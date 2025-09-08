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

interface StatusChangeEmailProps {
  gameName: string;
  gameId: string;
  locale: string;
  previousStatus: string;
  newStatus: string;
  gameUrl: string;
  endsAt?: string;
}

export const StatusChangeEmail = ({ 
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

  return (
    <Html>
      <Head />
      <Preview>
        {isPortuguese 
          ? `${gameName} - ${getStatusTitle(newStatus)}` 
          : `${gameName} - ${getStatusTitle(newStatus)}`}
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
            {getStatusTitle(newStatus)}
          </Heading>
          
          <Section style={statusSection}>
            <Text style={gameTitleText}>{gameName}</Text>
            <Text style={statusText}>
              {getStatusMessage(previousStatus, newStatus)}
            </Text>
          </Section>
          
          {newStatus === 'open' && endsAt && (
            <Section style={urgencySection}>
              <Text style={urgencyText}>
                {isPortuguese 
                  ? `⏱️ Termina em: ${new Date(endsAt).toLocaleString('pt-BR')}`
                  : `⏱️ Ends at: ${new Date(endsAt).toLocaleString('en-US')}`}
              </Text>
            </Section>
          )}
          
          <Section style={buttonSection}>
            <Button style={button} href={gameUrl}>
              {getActionText(newStatus)}
            </Button>
          </Section>
          
          <Text style={footer}>
            {isPortuguese 
              ? 'Boa sorte no jogo!'
              : 'Good luck in the game!'}
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