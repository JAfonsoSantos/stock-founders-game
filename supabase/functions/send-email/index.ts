import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'invite' | 'market_open' | 'last_minutes' | 'results';
  to: string[];
  gameId: string;
  gameName: string;
  locale?: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    console.log('Processing email request:', emailRequest);

    let template;
    let subject = '';

    switch (emailRequest.type) {
      case 'invite':
        // Generate QR code for invite
        let qrCodeBase64 = '';
        try {
          const joinUrl = emailRequest.data?.joinUrl || `https://stox.games/join/${emailRequest.gameId}`;
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
          joinUrl: emailRequest.data?.joinUrl || `https://stox.games/join/${emailRequest.gameId}`,
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
          gameUrl: emailRequest.data?.gameUrl
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
          gameUrl: emailRequest.data?.gameUrl,
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
        throw new Error(`Unknown email type: ${emailRequest.type}`);
    }

    const html = await renderAsync(template);

    const emailResponse = await resend.emails.send({
      from: "Startup Stock Market <noreply@lovableproject.com>",
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);