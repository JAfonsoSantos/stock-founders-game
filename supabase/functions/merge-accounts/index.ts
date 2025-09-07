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

    console.log(`Merging accounts: ${oldUserId} -> ${newUserId} (${email})`);

    // Update the new user with the email
    const { error: userError } = await supabase
      .from('users')
      .update({ email })
      .eq('id', newUserId);

    if (userError) {
      console.error('Error updating user:', userError);
      throw userError;
    }

    // Move all participations from old user to new user
    const { error: participantError } = await supabase
      .from('participants')
      .update({ user_id: newUserId })
      .eq('user_id', oldUserId);

    if (participantError) {
      console.error('Error updating participants:', participantError);
      throw participantError;
    }

    // Delete the old user record
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', oldUserId);

    if (deleteError) {
      console.error('Error deleting old user:', deleteError);
      // Don't throw here, just log the error
    }

    console.log('Account merge completed successfully');

    return new Response(
      JSON.stringify({ success: true }),
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