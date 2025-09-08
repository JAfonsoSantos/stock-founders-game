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

interface InviteEmailProps {
  gameName: string;
  gameId: string;
  joinUrl: string;
  locale: string;
  qrCodeBase64?: string;
  qrCid?: string;
}

export const InviteEmail = ({ gameName, gameId, joinUrl, locale, qrCodeBase64, qrCid }: InviteEmailProps) => {
  const isPortuguese = locale === 'pt';
  
  return (
    <Html>
      <Head />
      <Preview>
        {isPortuguese 
          ? `Você foi convidado para ${gameName}` 
          : `You're invited to join ${gameName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://via.placeholder.com/200x60/4F46E5/FFFFFF?text=SSM"
              width="200"
              height="60"
              alt="Startup Stock Market"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>
            {isPortuguese ? '🎉 Convite para o Jogo' : '🎉 Game Invitation'}
          </Heading>
          
          <Text style={text}>
            {isPortuguese 
              ? `Você foi convidado para participar em **${gameName}** - um emocionante jogo de mercado bolsista de startups!`
              : `You've been invited to participate in **${gameName}** - an exciting startup stock market game!`}
          </Text>
          
          <Text style={text}>
            {isPortuguese 
              ? 'Neste jogo, você poderá:'
              : 'In this game, you can:'}
          </Text>
          
          <Text style={listItem}>
            {isPortuguese 
              ? '• 💰 Investir em startups promissoras'
              : '• 💰 Invest in promising startups'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '• 📈 Negociar ações no mercado'
              : '• 📈 Trade stocks in the market'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '• 🏆 Competir com outros investidores'
              : '• 🏆 Compete with other investors'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '• 📊 Acompanhar seu portfólio em tempo real'
              : '• 📊 Track your portfolio in real-time'}
          </Text>

          <Section style={phaseSection}>
            <Heading style={h2}>
              {isPortuguese ? '📅 Como Funciona o Jogo' : '📅 How the Game Works'}
            </Heading>
            
            <Text style={phaseTitle}>
              {isPortuguese ? '🔸 Pre Market (Preparação)' : '🔸 Pre Market (Preparation)'}
            </Text>
            <Text style={phaseDescription}>
              {isPortuguese 
                ? 'Fase de preparação onde fundadores configuram suas startups. Ainda não há trading ativo.'
                : 'Preparation phase where founders set up their startups. No active trading yet.'}
            </Text>

            <Text style={phaseTitle}>
              {isPortuguese ? '🔸 Open Market (Mercado Ativo)' : '🔸 Open Market (Active Trading)'}
            </Text>
            <Text style={phaseDescription}>
              {isPortuguese 
                ? 'Mercado ativo! Invista nas startups e negocie ações. Preços calculados em tempo real.'
                : 'Market is live! Invest in startups and trade shares. Prices calculated in real-time.'}
            </Text>

            <Text style={phaseTitle}>
              {isPortuguese ? '🔸 Market Closed (Resultados)' : '🔸 Market Closed (Results)'}
            </Text>
            <Text style={phaseDescription}>
              {isPortuguese 
                ? 'Mercado fechado. Veja os resultados finais e leaderboards dos melhores investidores.'
                : 'Market closed. View final results and leaderboards of top investors.'}
            </Text>
          </Section>
          
          <Section style={buttonSection}>
            <Button style={button} href={joinUrl}>
              {isPortuguese ? '🚀 Juntar-se ao Jogo' : '🚀 Join the Game'}
            </Button>
          </Section>
          
           {(qrCid || qrCodeBase64) && (
             <Section style={qrSection}>
               <Text style={qrText}>
                 {isPortuguese 
                   ? 'Ou escaneie este QR code:'
                   : 'Or scan this QR code:'}
               </Text>
               <Section style={{textAlign: 'center'}}>
                 <Img
                   src={qrCid ? `cid:${qrCid}` : (qrCodeBase64 as string)}
                   alt={isPortuguese ? "QR Code para participar do jogo" : "QR Code to join the game"}
                   width="200"
                   height="200"
                   style={qrImage}
                 />
               </Section>
             </Section>
           )}
          
          <Text style={smallText}>
            {isPortuguese 
              ? 'Ou copie e cole este link no seu navegador:'
              : 'Or copy and paste this link in your browser:'}
          </Text>
          <Text style={linkText}>{joinUrl}</Text>
          
          <Text style={footer}>
            {isPortuguese 
              ? 'Boa sorte e divirta-se investindo!'
              : 'Good luck and have fun investing!'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
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

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 32px",
};

const listItem = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "8px 32px",
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

const smallText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 32px 8px",
  textAlign: "center" as const,
};

const linkText = {
  color: "#4f46e5",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0 32px 24px",
  wordBreak: "break-all" as const,
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "32px 32px 0",
  textAlign: "center" as const,
};

const qrSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
};

const qrText = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px 0",
  fontWeight: "600",
};

const qrImage = {
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
};

const phaseSection = {
  margin: "32px 32px",
  padding: "24px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  borderLeft: "4px solid #4f46e5",
};

const h2 = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  padding: "0",
};

const phaseTitle = {
  color: "#4f46e5",
  fontSize: "16px",
  fontWeight: "600",
  margin: "16px 0 4px 0",
  lineHeight: "24px",
};

const phaseDescription = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 12px 0",
};