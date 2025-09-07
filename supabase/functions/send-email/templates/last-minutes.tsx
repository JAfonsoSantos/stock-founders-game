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

interface LastMinutesEmailProps {
  gameName: string;
  gameId: string;
  gameUrl?: string;
  locale: string;
  minutesLeft: number;
}

export const LastMinutesEmail = ({ gameName, gameId, gameUrl, locale, minutesLeft }: LastMinutesEmailProps) => {
  const isPortuguese = locale === 'pt';
  const defaultGameUrl = gameUrl || `https://yourdomain.com/games/${gameId}/discover`;
  
  return (
    <Html>
      <Head />
      <Preview>
        {isPortuguese 
          ? `${gameName} - Últimos ${minutesLeft} minutos!` 
          : `${gameName} - Last ${minutesLeft} minutes!`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://via.placeholder.com/200x60/F59E0B/FFFFFF?text=TIME"
              width="200"
              height="60"
              alt="Time Running Out"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>
            {isPortuguese ? '⏰ Últimos Minutos!' : '⏰ Final Minutes!'}
          </Heading>
          
          <Section style={urgentSection}>
            <Text style={urgentText}>
              {isPortuguese 
                ? `Apenas ${minutesLeft} minutos restantes`
                : `Only ${minutesLeft} minutes remaining`}
            </Text>
          </Section>
          
          <Text style={text}>
            {isPortuguese 
              ? `O tempo está se esgotando para **${gameName}**! Esta é sua última chance para:`
              : `Time is running out for **${gameName}**! This is your last chance to:`}
          </Text>
          
          <Text style={listItem}>
            {isPortuguese 
              ? '🏃‍♂️ Fazer investimentos de última hora'
              : '🏃‍♂️ Make last-minute investments'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '🔄 Ajustar seu portfólio'
              : '🔄 Adjust your portfolio'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '💡 Executar suas estratégias finais'
              : '💡 Execute your final strategies'}
          </Text>
          <Text style={listItem}>
            {isPortuguese 
              ? '🎯 Garantir sua posição no leaderboard'
              : '🎯 Secure your leaderboard position'}
          </Text>
          
          <Section style={buttonSection}>
            <Button style={button} href={defaultGameUrl}>
              {isPortuguese ? '⚡ Trading Rápido' : '⚡ Quick Trading'}
            </Button>
          </Section>
          
          <Section style={warningSection}>
            <Text style={warningTitle}>
              {isPortuguese ? '⚠️  Lembrete Importante:' : '⚠️  Important Reminder:'}
            </Text>
            <Text style={warningText}>
              {isPortuguese 
                ? 'Após o encerramento, não será possível fazer mais negociações. As posições atuais determinarão os resultados finais.'
                : 'After closing, no more trades will be possible. Current positions will determine final results.'}
            </Text>
          </Section>
          
          <Text style={footer}>
            {isPortuguese 
              ? 'Aproveite estes últimos momentos! ⏱️'
              : 'Make these final moments count! ⏱️'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#fef3c7",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "2px solid #f59e0b",
};

const logoSection = {
  padding: "32px 32px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#92400e",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 32px 20px",
  padding: "0",
  textAlign: "center" as const,
};

const urgentSection = {
  backgroundColor: "#fbbf24",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 32px",
  textAlign: "center" as const,
};

const urgentText = {
  color: "#92400e",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
};

const text = {
  color: "#b45309",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 32px",
};

const listItem = {
  color: "#b45309",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "8px 32px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#f59e0b",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  animation: "pulse 2s infinite",
};

const warningSection = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 32px",
  border: "1px solid #f59e0b",
};

const warningTitle = {
  color: "#92400e",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const warningText = {
  color: "#b45309",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const footer = {
  color: "#b45309",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "32px 32px 0",
  textAlign: "center" as const,
  fontWeight: "bold",
};