import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { StatusChangeEmail } from "../send-email/templates/status-change.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface StatusChangeRequest {
  gameId: string;
  previousStatus: string;
  newStatus: string;
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
    console.log("Processing game status change notification request");

    const { gameId, previousStatus, newStatus }: StatusChangeRequest = await req.json();

    if (!gameId || !previousStatus || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get game information
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('name, locale, ends_at')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      console.error('Game not found:', gameError);
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get all participants in the game with their user emails
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select(`
        id,
        status,
        users!inner(email, first_name, last_name)
      `)
      .eq('game_id', gameId)
      .eq('status', 'active'); // Only send to active participants

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch participants' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!participants || participants.length === 0) {
      console.log('No active participants found for game:', gameId);
      return new Response(
        JSON.stringify({ message: 'No active participants to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Extract valid emails
    const emails = participants
      .map(p => (p.users as any)?.email)
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      console.log('No valid emails found for participants');
      return new Response(
        JSON.stringify({ message: 'No valid emails to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Sending status change notification to ${emails.length} participants`);

    // Generate appropriate game URL based on status
    let gameUrl = `https://stox.games/games/${gameId}`;
    switch (newStatus) {
      case 'pre_market':
      case 'open':
        gameUrl += '/discover';
        break;
      case 'closed':
        gameUrl += '/me';
        break;
      case 'results':
        gameUrl += '/leaderboard';
        break;
    }

    // Render email template
    const template = React.createElement(StatusChangeEmail, {
      gameName: game.name,
      gameId: gameId,
      locale: game.locale || 'en',
      previousStatus,
      newStatus,
      gameUrl,
      endsAt: game.ends_at
    });

    const html = await renderAsync(template);

    // Generate subject based on status and locale
    let subject = '';
    const isPortuguese = game.locale === 'pt';
    
    switch (newStatus) {
      case 'pre_market':
        subject = isPortuguese 
          ? `⏰ ${game.name} - Fase de Preparação` 
          : `⏰ ${game.name} - Pre-Market Phase`;
        break;
      case 'open':
        subject = isPortuguese 
          ? `🚀 ${game.name} - Mercado Aberto!` 
          : `🚀 ${game.name} - Market Open!`;
        break;
      case 'closed':
        subject = isPortuguese 
          ? `🔒 ${game.name} - Mercado Fechado` 
          : `🔒 ${game.name} - Market Closed`;
        break;
      case 'results':
        subject = isPortuguese 
          ? `🏆 ${game.name} - Resultados Finais` 
          : `🏆 ${game.name} - Final Results`;
        break;
      default:
        subject = isPortuguese 
          ? `📢 ${game.name} - Status Atualizado` 
          : `📢 ${game.name} - Status Updated`;
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Stox <noreply@stox.games>",
      to: emails,
      subject: subject,
      html: html,
    });

    console.log("Status change notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: emails.length,
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-game-status-change function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);