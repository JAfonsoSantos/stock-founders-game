import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Img
} from "npm:@react-email/components@0.0.22";

// Inline StatusChangeEmail component
interface StatusChangeEmailProps {
  gameName: string;
  gameId: string;
  locale: string;
  previousStatus: string;
  newStatus: string;
  gameUrl: string;
  endsAt?: string;
}

const StatusChangeEmail = ({ 
  gameName, 
  gameId, 
  locale, 
  previousStatus, 
  newStatus, 
  gameUrl,
  endsAt 
}: StatusChangeEmailProps) => {
  const isPortuguese = locale === 'pt';
  
  const getStatusTitle = (status: string) => {
    if (isPortuguese) {
      switch (status) {
        case 'pre_market': return '⏰ Preparação';
        case 'open': return '🚀 Mercado Aberto';
        case 'closed': return '🔒 Mercado Fechado';
        case 'results': return '🏆 Resultados Finais';
        default: return status;
      }
    } else {
      switch (status) {
        case 'pre_market': return '⏰ Pre-Market';
        case 'open': return '🚀 Market Open';
        case 'closed': return '🔒 Market Closed';
        case 'results': return '🏆 Final Results';
        default: return status;
      }
    }
  };

  const getStatusMessage = (fromStatus: string, toStatus: string) => {
    if (isPortuguese) {
      switch (toStatus) {
        case 'pre_market':
          return 'O jogo está agora na fase de preparação. Os fundadores podem configurar suas startups.';
        case 'open':
          return 'O mercado está aberto! Agora você pode investir nas startups e negociar ações.';
        case 'closed':
          return 'O mercado fechou. As negociações foram encerradas e os resultados estão sendo calculados.';
        case 'results':
          return 'Os resultados finais estão disponíveis! Veja quem foram os melhores investidores.';
        default:
          return `O status do jogo mudou de ${fromStatus} para ${toStatus}.`;
      }
    } else {
      switch (toStatus) {
        case 'pre_market':
          return 'The game is now in preparation phase. Founders can set up their startups.';
        case 'open':
          return 'The market is open! You can now invest in startups and trade shares.';
        case 'closed':
          return 'The market has closed. Trading has ended and results are being calculated.';
        case 'results':
          return 'Final results are available! See who the top investors were.';
        default:
          return `Game status changed from ${fromStatus} to ${toStatus}.`;
      }
    }
  };

  const getActionText = (status: string) => {
    if (isPortuguese) {
      switch (status) {
        case 'pre_market': return '👀 Ver Jogo';
        case 'open': return '💰 Começar a Investir';
        case 'closed': return '📊 Ver Portfolio';
        case 'results': return '🏆 Ver Resultados';
        default: return '🔗 Ir para o Jogo';
      }
    } else {
      switch (status) {
        case 'pre_market': return '👀 View Game';
        case 'open': return '💰 Start Investing';
        case 'closed': return '📊 View Portfolio';
        case 'results': return '🏆 View Results';
        default: return '🔗 Go to Game';
      }
    }
  };

  // Inline styles
  const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  };

  const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
  };

  const logoSection = {
    padding: "32px 32px 0",
    textAlign: "center" as const,
  };

  const logo = {
    margin: "0 auto",
  };

  const h1 = {
    color: "#1f2937",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "40px 32px 20px",
    padding: "0",
    textAlign: "center" as const,
  };

  const statusSection = {
    margin: "32px 32px",
    padding: "24px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    borderLeft: "4px solid #0ea5e9",
  };

  const gameTitleText = {
    color: "#0c4a6e",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 12px 0",
    textAlign: "center" as const,
  };

  const statusText = {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "26px",
    margin: "0",
    textAlign: "center" as const,
  };

  const urgencySection = {
    margin: "16px 32px",
    padding: "16px",
    backgroundColor: "#fef3c7",
    borderRadius: "8px",
    border: "1px solid #f59e0b",
  };

  const urgencyText = {
    color: "#92400e",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
    textAlign: "center" as const,
  };

  const buttonSection = {
    textAlign: "center" as const,
    margin: "32px 0",
  };

  const button = {
    backgroundColor: "#4f46e5",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "16px 32px",
  };

  const footer = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "32px 32px 0",
    textAlign: "center" as const,
  };

  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null,
      isPortuguese 
        ? `${gameName} - ${getStatusTitle(newStatus)}` 
        : `${gameName} - ${getStatusTitle(newStatus)}`
    ),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Section, { style: logoSection },
          React.createElement(Img, {
            src: "https://via.placeholder.com/200x60/4F46E5/FFFFFF?text=SSM",
            width: "200",
            height: "60",
            alt: "Startup Stock Market",
            style: logo
          })
        ),
        React.createElement(Heading, { style: h1 }, getStatusTitle(newStatus)),
        React.createElement(Section, { style: statusSection },
          React.createElement(Text, { style: gameTitleText }, gameName),
          React.createElement(Text, { style: statusText }, getStatusMessage(previousStatus, newStatus))
        ),
        newStatus === 'open' && endsAt && React.createElement(Section, { style: urgencySection },
          React.createElement(Text, { style: urgencyText },
            isPortuguese 
              ? `⏱️ Termina em: ${new Date(endsAt).toLocaleString('pt-BR')}`
              : `⏱️ Ends at: ${new Date(endsAt).toLocaleString('en-US')}`
          )
        ),
        React.createElement(Section, { style: buttonSection },
          React.createElement(Button, { style: button, href: gameUrl }, getActionText(newStatus))
        ),
        React.createElement(Text, { style: footer },
          isPortuguese 
            ? 'Boa sorte no jogo!'
            : 'Good luck in the game!'
        )
      )
    )
  );
};

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