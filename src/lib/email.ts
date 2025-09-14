import { supabase } from "@/integrations/supabase/client";

export interface EmailRequest {
  type: 'invite' | 'market_open' | 'last_minutes' | 'results';
  to: string[];
  gameId: string;
  gameName: string;
  locale?: string;
  data?: any;
}

export async function sendEmail(request: EmailRequest) {
  try {
    console.log('Sending email request:', { type: request.type, to: request.to, gameId: request.gameId });
    
    // Get the current session to ensure we're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session exists:', !!session);
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    console.log('User ID:', session.user.id);
    console.log('Supabase URL being used:', 'https://ccwlxhhsfgnmcqbnjmys.supabase.co');
    console.log('Function URL will be:', 'https://ccwlxhhsfgnmcqbnjmys.supabase.co/functions/v1/send-email');
    
    // Try direct fetch instead of supabase client to test connectivity
    try {
      console.log('Testing direct fetch to function...');
      const directResponse = await fetch('https://ccwlxhhsfgnmcqbnjmys.supabase.co/functions/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd2x4aGhzZmdubWNxYm5qbXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzQ2NDQsImV4cCI6MjA3MjgxMDY0NH0.K6kbRHdjZoXvPLXNVHyJeg6-6xcjfyl5uNk0vHnfy3w'
        },
        body: JSON.stringify(request)
      });
      
      console.log('Direct fetch response status:', directResponse.status);
      const responseText = await directResponse.text();
      console.log('Direct fetch response body:', responseText);
      
      if (directResponse.ok) {
        const data = JSON.parse(responseText);
        console.log('Email sent successfully via direct fetch:', data);
        return data;
      } else {
        throw new Error(`Direct fetch failed with status ${directResponse.status}: ${responseText}`);
      }
    } catch (directError) {
      console.error('Direct fetch failed:', directError);
      
      // Fallback to supabase client
      console.log('Falling back to Supabase client...');
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: request,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('Supabase client result:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Email function error: ${error.message || 'Unknown error'}`);
      }

      console.log('Email sent successfully via Supabase client:', data);
      return data;
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Email sending failed: ${errorMessage}`);
  }
}

// Helper functions for specific email types
export async function sendInviteEmail(to: string[], gameId: string, gameName: string, locale = 'en') {
  return sendEmail({
    type: 'invite',
    to,
    gameId,
    gameName,
    locale,
    data: {
      joinUrl: `https://stox.games/join/${gameId}`
    }
  });
}

export async function sendMarketOpenEmail(to: string[], gameId: string, gameName: string, locale = 'en') {
  return sendEmail({
    type: 'market_open',
    to,
    gameId,
    gameName,
    locale,
    data: {
      gameUrl: `https://stox.games/games/${gameId}/discover`
    }
  });
}

export async function sendLastMinutesEmail(to: string[], gameId: string, gameName: string, minutesLeft = 10, locale = 'en') {
  return sendEmail({
    type: 'last_minutes',
    to,
    gameId,
    gameName,
    locale,
    data: {
      gameUrl: `https://stox.games/games/${gameId}/discover`,
      minutesLeft
    }
  });
}

export async function sendResultsEmail(to: string[], gameId: string, gameName: string, results: any, locale = 'en') {
  return sendEmail({
    type: 'results',
    to,
    gameId,
    gameName,
    locale,
    data: {
      results
    }
  });
}