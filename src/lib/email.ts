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
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: request
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
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
      joinUrl: `${window.location.origin}/join/${gameId}`
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
      gameUrl: `${window.location.origin}/games/${gameId}/discover`
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
      gameUrl: `${window.location.origin}/games/${gameId}/discover`,
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