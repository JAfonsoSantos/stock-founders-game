import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://stox.games',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create authenticated Supabase client to verify user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify JWT and get authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract email from authenticated user (required)
    if (!user.email) {
      console.error('User has no email address');
      return new Response(
        JSON.stringify({ error: 'User email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse request body - ignore client-provided newUserId/email, use authenticated user's data
    const { oldUserId } = await req.json();
    const authenticatedUserId = user.id;
    const authenticatedEmail = user.email;

    console.log(`Merging accounts for authenticated user ${authenticatedUserId} with email ${authenticatedEmail}${oldUserId ? ` (explicit old user ${oldUserId})` : ''}`);

    // Create service role client for write operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ensure the authenticated user record has the email stored (used by organizer tools)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({ id: authenticatedUserId, email: authenticatedEmail }, { onConflict: 'id' });

    if (userError) {
      console.error('Error upserting user email:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let mergedCount = 0;

    // Helper to move participations and delete an old profile row
    const mergeFromOld = async (oldId: string) => {
      if (oldId === authenticatedUserId) {
        console.log('Skipping merge - old ID matches authenticated user ID');
        return;
      }

      // Verify the old profile exists and has matching email (security check)
      const { data: oldProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('email, id')
        .eq('id', oldId)
        .single();

      if (profileError || !oldProfile) {
        console.warn(`Old profile ${oldId} not found, skipping`);
        return;
      }

      if (oldProfile.email !== authenticatedEmail) {
        console.warn(`Email mismatch for profile ${oldId}: ${oldProfile.email} !== ${authenticatedEmail}, skipping`);
        return;
      }

      // Move participants to authenticated user
      const { error: participantError } = await supabaseAdmin
        .from('participants')
        .update({ user_id: authenticatedUserId })
        .eq('user_id', oldId);

      if (participantError) {
        console.error('Error updating participants:', participantError);
        throw participantError;
      }

      // Delete old profile
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', oldId);

      if (deleteError) {
        console.warn('Error deleting old user (non-fatal):', deleteError);
      }

      mergedCount += 1;
      console.log(`Successfully merged profile ${oldId}`);
    };

    if (oldUserId) {
      await mergeFromOld(oldUserId);
    } else {
      // Find any profile rows with the same email (created via CSV or demo) and merge them
      const { data: dupUsers, error: dupErr } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', authenticatedEmail)
        .neq('id', authenticatedUserId); // Exclude authenticated user's profile

      if (dupErr) {
        console.error('Error fetching duplicate users:', dupErr);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch duplicate profiles' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      for (const u of dupUsers || []) {
        await mergeFromOld(u.id as string);
      }
    }

    console.log('Account merge completed successfully. Merged profiles:', mergedCount);

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
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});