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
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: request
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Email function error: ${error.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', data);
    return data;
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