import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { oldUserId, newUserId, email } = await req.json();

    if (!newUserId || !email) {
      return new Response(
        JSON.stringify({ error: 'newUserId and email are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Merging accounts for email ${email} into user ${newUserId}${oldUserId ? ` (explicit old user ${oldUserId})` : ''}`);

    // Ensure the new user record has the email stored (used by organizer tools)
    const { error: userError } = await supabase
      .from('users')
      .upsert({ id: newUserId, email }, { onConflict: 'id' });

    if (userError) {
      console.error('Error upserting user email:', userError);
      throw userError;
    }

    let mergedCount = 0;

    // Helper to move participations and delete an old profile row
    const mergeFromOld = async (oldId: string) => {
      if (oldId === newUserId) return;

      const { error: participantError } = await supabase
        .from('participants')
        .update({ user_id: newUserId })
        .eq('user_id', oldId);

      if (participantError) {
        console.error('Error updating participants:', participantError);
        throw participantError;
      }

      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', oldId);

      if (deleteError) {
        console.warn('Error deleting old user (non-fatal):', deleteError);
      }

      mergedCount += 1;
    };

    if (oldUserId) {
      await mergeFromOld(oldUserId);
    } else {
      // Find any profile rows with the same email (created via CSV or demo) and merge them
      const { data: dupUsers, error: dupErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);

      if (dupErr) {
        console.error('Error fetching duplicate users:', dupErr);
        throw dupErr;
      }

      for (const u of dupUsers || []) {
        await mergeFromOld(u.id as string);
      }
    }

    console.log('Account merge completed. Merged profiles:', mergedCount);

    return new Response(
      JSON.stringify({ success: true, mergedCount }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in merge-accounts function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});