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
    
    // Try to invoke the function with timeout and retry logic
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt}: Invoking send-email function...`);
        
        const result = await Promise.race([
          supabase.functions.invoke('send-email', {
            body: request,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
          )
        ]) as { data: any; error: any };

        const { data, error } = result;

        console.log('Function invoke result:', { data, error });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Email function error: ${error.message || 'Unknown error'}`);
        }

        console.log('Email sent successfully:', data);
        return data;
      } catch (attemptError) {
        lastError = attemptError;
        console.error(`Attempt ${attempt} failed:`, attemptError);
        
        if (attempt < 3) {
          console.log(`Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw lastError;
  } catch (error) {
    console.error('Failed to send email after all attempts:', error);
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