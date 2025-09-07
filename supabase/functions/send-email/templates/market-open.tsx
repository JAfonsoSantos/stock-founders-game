import React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
  Img
} from "npm:@react-email/components@0.0.22";

interface MarketOpenEmailProps {
  gameName: string;
  gameId: string;
  gameUrl?: string;
  locale: string;
}

export const MarketOpenEmail = ({ gameName, gameId, gameUrl, locale }: MarketOpenEmailProps) => {
  const isPortuguese = locale === 'pt';
  const defaultGameUrl = gameUrl || `https://yourdomain.com/games/${gameId}/discover`;
  
  return (
    <Html>
      <Head />
      <Preview>
        {isPortuguese 
          ? `${gameName} - O mercado está aberto!` 
          : `${gameName} - Market is now open!`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://via.placeholder.com/200x60/10B981/FFFFFF?text=OPEN"
              width="200"
              height="60"
              alt="Market Open"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>
            {isPortuguese ? '🚀 Mercado Aberto!' : '🚀 Market Open!'}
          </Heading>
          
          <Text style={text}>
            {isPortuguese 
              ? `Ótimas notícias! O mercado para **${gameName}** está agora oficialmente aberto para trading.`
              : `Great news! The market for **${gameName}** is now officially open for trading.`}
          </Text>
          
          <Text style={text}>
            {isPortuguese 
              ? 'Agora você pode:'
              : 'You can now:'}
          </Text>
          
          <Text style={listItem}>
            {isPortuguese 
              ? '📊 Explorar todas as startups disponíveis'
              : '📊 Browse all available startups'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '💰 Fazer seus primeiros investimentos'
              : '💰 Make your first investments'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '📈 Acompanhar preços em tempo real'
              : '📈 Track real-time prices'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '🤝 Negociar com outros participantes'
              : '🤝 Trade with other participants'}
          </Text>
          
          <Section style={buttonSection}>
            <Button style={button} href={defaultGameUrl}>
              {isPortuguese ? '🎯 Começar a Investir' : '🎯 Start Investing'}
            </Button>
          </Section>
          
          <Section style={statsSection}>
            <Text style={statsTitle}>
              {isPortuguese ? '📊 Estatísticas do Jogo:' : '📊 Game Stats:'}
            </Text>
            <Text style={statsText}>
              {isPortuguese 
                ? '• Mercado: Primário (ações diretas das startups)'
                : '• Market: Primary (direct from startups)'}
            </Text>
            <Text style={statsText}>
              {isPortuguese 
                ? '• Status: Trading ativo'
                : '• Status: Active trading'}
            </Text>
          </Section>
          
          <Text style={footer}>
            {isPortuguese 
              ? 'Que comece o jogo! Boa sorte com seus investimentos. 🚀'
              : 'Let the games begin! Good luck with your investments. 🚀'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f0fdf4",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #d1fae5",
};

const logoSection = {
  padding: "32px 32px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#065f46",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 32px 20px",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#047857",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 32px",
};

const listItem = {
  color: "#047857",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "8px 32px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
};

const statsSection = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 32px",
};

const statsTitle = {
  color: "#065f46",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const statsText = {
  color: "#047857",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "4px 0",
};

const footer = {
  color: "#047857",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "32px 32px 0",
  textAlign: "center" as const,
  fontWeight: "bold",
};