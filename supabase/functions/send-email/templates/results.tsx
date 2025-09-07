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

interface ResultsEmailProps {
  gameName: string;
  gameId: string;
  locale: string;
  results?: {
    topStartups?: Array<{ name: string; marketCap: number; }>;
    topAngels?: Array<{ name: string; roi: number; }>;
    topVCs?: Array<{ name: string; roi: number; }>;
    totalVolume?: number;
    totalTrades?: number;
  };
}

export const ResultsEmail = ({ gameName, gameId, locale, results }: ResultsEmailProps) => {
  const isPortuguese = locale === 'pt';
  
  return (
    <Html>
      <Head />
      <Preview>
        {isPortuguese 
          ? `${gameName} - Resultados Finais` 
          : `${gameName} - Final Results`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://via.placeholder.com/200x60/7C3AED/FFFFFF?text=RESULTS"
              width="200"
              height="60"
              alt="Final Results"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>
            {isPortuguese ? '🏆 Resultados Finais' : '🏆 Final Results'}
          </Heading>
          
          <Text style={text}>
            {isPortuguese 
              ? `Parabéns! **${gameName}** chegou ao fim. Aqui estão os resultados finais:`
              : `Congratulations! **${gameName}** has come to an end. Here are the final results:`}
          </Text>
          
          {results?.topStartups && results.topStartups.length > 0 && (
            <Section style={resultsSection}>
              <Text style={sectionTitle}>
                {isPortuguese ? '🚀 Top Startups por Market Cap:' : '🚀 Top Startups by Market Cap:'}
              </Text>
              {results.topStartups.slice(0, 3).map((startup, index) => (
                <Text key={index} style={resultItem}>
                  {index + 1}. **{startup.name}** - ${startup.marketCap.toLocaleString()}
                </Text>
              ))}
            </Section>
          )}
          
          {results?.topAngels && results.topAngels.length > 0 && (
            <Section style={resultsSection}>
              <Text style={sectionTitle}>
                {isPortuguese ? '👼 Top Angels por ROI:' : '👼 Top Angels by ROI:'}
              </Text>
              {results.topAngels.slice(0, 3).map((angel, index) => (
                <Text key={index} style={resultItem}>
                  {index + 1}. **{angel.name}** - {angel.roi.toFixed(1)}% ROI
                </Text>
              ))}
            </Section>
          )}
          
          {results?.topVCs && results.topVCs.length > 0 && (
            <Section style={resultsSection}>
              <Text style={sectionTitle}>
                {isPortuguese ? '💼 Top VCs por ROI:' : '💼 Top VCs by ROI:'}
              </Text>
              {results.topVCs.slice(0, 3).map((vc, index) => (
                <Text key={index} style={resultItem}>
                  {index + 1}. **{vc.name}** - {vc.roi.toFixed(1)}% ROI
                </Text>
              ))}
            </Section>
          )}
          
          {results && (
            <Section style={statsSection}>
              <Text style={statsTitle}>
                {isPortuguese ? '📊 Estatísticas do Jogo:' : '📊 Game Statistics:'}
              </Text>
              {results.totalVolume && (
                <Text style={statsText}>
                  {isPortuguese 
                    ? `• Volume Total: $${results.totalVolume.toLocaleString()}`
                    : `• Total Volume: $${results.totalVolume.toLocaleString()}`}
                </Text>
              )}
              {results.totalTrades && (
                <Text style={statsText}>
                  {isPortuguese 
                    ? `• Total de Negociações: ${results.totalTrades}`
                    : `• Total Trades: ${results.totalTrades}`}
                </Text>
              )}
            </Section>
          )}
          
          <Text style={congratsText}>
            {isPortuguese 
              ? '🎉 Obrigado por participar! Foi um jogo emocionante.'
              : '🎉 Thank you for participating! It was an exciting game.'}
          </Text>
          
          <Text style={footer}>
            {isPortuguese 
              ? 'Até ao próximo jogo! 🚀'
              : 'See you in the next game! 🚀'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #e5e7eb",
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

const resultsSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 32px",
  border: "1px solid #e5e7eb",
};

const sectionTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const resultItem = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const statsSection = {
  backgroundColor: "#ede9fe",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 32px",
};

const statsTitle = {
  color: "#581c87",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const statsText = {
  color: "#7c3aed",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "4px 0",
};

const congratsText = {
  color: "#059669",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "32px 32px 16px",
  textAlign: "center" as const,
  fontWeight: "bold",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 32px 0",
  textAlign: "center" as const,
};