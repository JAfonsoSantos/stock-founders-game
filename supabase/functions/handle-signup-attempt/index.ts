import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email template for existing user
const ExistingUserEmail = ({ magicLink }: { magicLink: string }) => {
  return React.createElement('html', {},
    React.createElement('head', {}),
    React.createElement('body', { style: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: '30px' } },
        React.createElement('h1', { style: { color: '#333', fontSize: '28px', marginBottom: '10px' } }, 'Stox'),
        React.createElement('p', { style: { color: '#666', fontSize: '16px' } }, 'Mercado de Startups')
      ),
      React.createElement('div', { style: { backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '20px' } },
        React.createElement('h2', { style: { color: '#333', marginBottom: '15px' } }, '🔐 Já tens uma conta!'),
        React.createElement('p', { style: { color: '#555', lineHeight: '1.6', marginBottom: '20px' } }, 
          'Tentaste criar uma conta com este email, mas já tens uma conta registada.'
        ),
        React.createElement('p', { style: { color: '#555', lineHeight: '1.6', marginBottom: '25px' } }, 
          'Para facilitar, criámos um link mágico para entrares directamente:'
        ),
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '25px' } },
          React.createElement('a', {
            href: magicLink,
            style: {
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'inline-block'
            }
          }, '🚀 Entrar Agora')
        ),
        React.createElement('p', { style: { color: '#666', fontSize: '14px', textAlign: 'center' } }, 
          'Este link é válido por 1 hora e só funciona uma vez.'
        )
      ),
      React.createElement('div', { style: { borderTop: '1px solid #eee', paddingTop: '20px', color: '#999', fontSize: '12px', textAlign: 'center' } },
        React.createElement('p', {}, 'Se não foste tu a tentar registar, podes ignorar este email com segurança.'),
        React.createElement('p', { style: { marginTop: '10px' } }, 'Stox - Startup Stock Market')
      )
    )
  );
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (userError) {
      console.error('Error checking user:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user existence' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user doesn't exist, let normal signup flow handle it
    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ userExists: false }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User exists, generating magic link for:', email);

    // Generate magic link for existing user
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://stox.games'}/`
      }
    });

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate magic link' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Render email template
    const emailHtml = await renderAsync(
      React.createElement(ExistingUserEmail, { 
        magicLink: magicLinkData.properties?.action_link || '' 
      })
    );

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'Stox <noreply@stox.games>',
      to: [email],
      subject: '🔐 Já tens conta no Stox - Link mágico para entrar',
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Magic link email sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        userExists: true, 
        magicLinkSent: true,
        message: 'Magic link sent to existing user'
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in handle-signup-attempt:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);