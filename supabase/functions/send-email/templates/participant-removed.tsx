import React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Img
} from "npm:@react-email/components@0.0.22";

interface ParticipantRemovedEmailProps {
  gameName: string;
  gameId: string;
  locale: string;
  participantName: string;
  reason?: string;
}

export const ParticipantRemovedEmail = ({ 
  gameName, 
  gameId, 
  locale, 
  participantName,
  reason 
}: ParticipantRemovedEmailProps) => {
  const isPortuguese = locale === 'pt';
  
  return (
    <Html>
      <Head />
      <Preview>
        {isPortuguese 
          ? `Você foi removido do jogo ${gameName}` 
          : `You have been removed from ${gameName}`}
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
            {isPortuguese ? '📢 Participação Removida' : '📢 Participation Removed'}
          </Heading>
          
          <Text style={text}>
            {isPortuguese ? 'Olá' : 'Hello'} {participantName},
          </Text>
          
          <Text style={text}>
            {isPortuguese 
              ? `Informamos que a sua participação no jogo **${gameName}** foi removida pelo organizador.`
              : `We inform you that your participation in the game **${gameName}** has been removed by the organizer.`}
          </Text>

          {reason && (
            <Section style={reasonSection}>
              <Text style={reasonTitle}>
                {isPortuguese ? 'Motivo:' : 'Reason:'}
              </Text>
              <Text style={reasonText}>
                {reason}
              </Text>
            </Section>
          )}
          
          <Text style={text}>
            {isPortuguese 
              ? 'Se acredita que isto foi um erro, pode contactar diretamente o organizador do jogo.'
              : 'If you believe this was an error, you can contact the game organizer directly.'}
          </Text>
          
          <Text style={footer}>
            {isPortuguese 
              ? 'Obrigado pela sua participação!'
              : 'Thank you for your participation!'}
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
  color: "#dc2626",
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

const reasonSection = {
  margin: "24px 32px",
  padding: "20px",
  backgroundColor: "#fef3f2",
  borderRadius: "8px",
  borderLeft: "4px solid #dc2626",
};

const reasonTitle = {
  color: "#dc2626",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "32px 32px 0",
  textAlign: "center" as const,
};