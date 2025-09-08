import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import QRCode from "npm:qrcode@1.5.4";
import { InviteEmail } from "./templates/invite.tsx";
import { MarketOpenEmail } from "./templates/market-open.tsx";
import { LastMinutesEmail } from "./templates/last-minutes.tsx";
import { ResultsEmail } from "./templates/results.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://stox.games",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  type: 'invite' | 'market_open' | 'last_minutes' | 'results';
  to: string[];
  gameId: string;
  gameName: string;
  locale?: string;
  data?: any;
}

// Simple rate limiting per user/game
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_EMAILS_PER_WINDOW = 50;

function checkRateLimit(userId: string, gameId: string): boolean {
  const key = `${userId}:${gameId}`;
  const now = Date.now();
  const userRequests = rateLimitStore.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter((timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_EMAILS_PER_WINDOW) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return true;
}

function isValidStoxUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'stox.games' || parsed.hostname.endsWith('.stox.games');
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create authenticated Supabase client
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

    const emailRequest: EmailRequest = await req.json();
    
    // Validate input size
    if (JSON.stringify(emailRequest).length > 100000) { // 100KB limit
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 413 }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(user.id, emailRequest.gameId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    console.log(`Processing email request from user ${user.id} for game ${emailRequest.gameId}`);

    // Verify user is the game owner
    const { data: game, error: gameError } = await supabaseUser
      .from('games')
      .select('owner_user_id, name')
      .eq('id', emailRequest.gameId)
      .single();

    if (gameError || !game) {
      console.error('Game not found:', gameError);
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (game.owner_user_id !== user.id) {
      console.error(`User ${user.id} is not owner of game ${emailRequest.gameId}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only game owner can send emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Validate recipients are participants in the game
    const { data: participants, error: participantsError } = await supabaseUser
      .from('participants')
      .select('user_id, users!inner(email)')
      .eq('game_id', emailRequest.gameId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate recipients' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const validEmails = participants?.map(p => (p.users as any)?.email).filter(Boolean) || [];
    const invalidRecipients = emailRequest.to.filter(email => !validEmails.includes(email));
    
    if (invalidRecipients.length > 0) {
      console.error('Invalid recipients:', invalidRecipients);
      return new Response(
        JSON.stringify({ error: `Invalid recipients: ${invalidRecipients.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let template;
    let subject = '';

    switch (emailRequest.type) {
      case 'invite':
        // Generate QR code for invite with secure URL
        let qrCodeBase64 = '';
        try {
          const joinUrl = `https://stox.games/join/${emailRequest.gameId}`;
          qrCodeBase64 = await QRCode.toDataURL(joinUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
        }

        template = React.createElement(InviteEmail, {
          gameName: emailRequest.gameName,
          gameId: emailRequest.gameId,
          locale: emailRequest.locale || 'en',
          joinUrl: `https://stox.games/join/${emailRequest.gameId}`, // Override with secure URL
          qrCodeBase64: qrCodeBase64
        });
        subject = emailRequest.locale === 'pt' 
          ? `Convite para ${emailRequest.gameName}` 
          : `Invitation to ${emailRequest.gameName}`;
        break;

      case 'market_open':
        template = React.createElement(MarketOpenEmail, {
          gameName: emailRequest.gameName,
          gameId: emailRequest.gameId,
          locale: emailRequest.locale || 'en',
          gameUrl: `https://stox.games/games/${emailRequest.gameId}/discover` // Override with secure URL
        });
        subject = emailRequest.locale === 'pt' 
          ? `🚀 ${emailRequest.gameName} - Mercado Aberto!` 
          : `🚀 ${emailRequest.gameName} - Market Open!`;
        break;

      case 'last_minutes':
        template = React.createElement(LastMinutesEmail, {
          gameName: emailRequest.gameName,
          gameId: emailRequest.gameId,
          locale: emailRequest.locale || 'en',
          gameUrl: `https://stox.games/games/${emailRequest.gameId}/discover`, // Override with secure URL
          minutesLeft: emailRequest.data?.minutesLeft || 10
        });
        subject = emailRequest.locale === 'pt' 
          ? `⏰ ${emailRequest.gameName} - Últimos Minutos!` 
          : `⏰ ${emailRequest.gameName} - Last Minutes!`;
        break;

      case 'results':
        template = React.createElement(ResultsEmail, {
          gameName: emailRequest.gameName,
          gameId: emailRequest.gameId,
          locale: emailRequest.locale || 'en',
          results: emailRequest.data?.results
        });
        subject = emailRequest.locale === 'pt' 
          ? `🏆 ${emailRequest.gameName} - Resultados Finais` 
          : `🏆 ${emailRequest.gameName} - Final Results`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown email type: ${emailRequest.type}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    const html = await renderAsync(template);

    const emailResponse = await resend.emails.send({
      from: "Stox <onboarding@resend.dev>",
      to: emailRequest.to,
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);