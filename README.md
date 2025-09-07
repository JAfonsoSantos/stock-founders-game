# Startup Stock Market

Uma plataforma completa para simulação de mercado de ações de startups em eventos. Os fundadores vendem ações das suas startups a outros participantes (Angels e VCs), com um organizador que controla o mercado.

## 🚀 Características Principais

### Para Organizadores
- **Criação de Jogos**: Configure jogos com moeda, idioma, datas e regras customizáveis
- **Gestão de Participantes**: Adicione participantes com diferentes papéis (Founder, Angel, VC)
- **Controlo do Mercado**: Abra/feche mercados, ative trading secundário
- **Dashboard Analytics**: Acompanhe KPIs em tempo real
- **Sistema de Emails**: Envie convites e notificações automáticas

### Para Participantes
- **Discovery**: Explore startups disponíveis para investimento
- **Trading Primário**: Proponha investimentos diretamente às startups
- **Trading Secundário**: Negocie ações entre participantes (quando ativado)
- **Portfolio**: Acompanhe investimentos, P&L e posições
- **Leaderboards**: Veja rankings por market cap e ROI

### Funcionalidades Técnicas
- **VWAP(3)**: Preço oficial baseado nas últimas 3 transações
- **Circuit Breaker**: Pausa automática em variações > ±200%
- **Row Level Security**: Segurança completa na base de dados
- **Realtime Updates**: Atualizações em tempo real via Supabase
- **Multi-idioma**: Suporte para 10 idiomas principais
- **Multi-moeda**: Suporte para 10 moedas principais

## 🛠 Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **Email**: Resend (configuração necessária)
- **Deployment**: Lovable (deploy automático)

## 📁 Estrutura da Base de Dados

### Tabelas Principais
- `games` - Configuração dos jogos
- `participants` - Participantes em cada jogo
- `startups` - Startups disponíveis para investimento
- `trades` - Histórico de todas as transações
- `positions` - Posições atuais dos participantes
- `orders_primary` - Pedidos de investimento primário

### Views Automáticas
- `leaderboard_startups` - Ranking por market cap
- `leaderboard_angels` - Ranking Angels por ROI
- `leaderboard_vcs` - Ranking VCs por ROI
- `portfolio_view` - Valor total do portfolio por participante

## 🚀 Como Começar

### 1. Configuração Inicial
A base de dados já está configurada com todas as tabelas, políticas RLS e triggers necessários.

### 2. Autenticação
- Faça login com o seu email
- Receberá um magic link para acesso seguro
- O seu perfil será criado automaticamente

### 3. Criar Primeiro Jogo
1. Clique em "New Game" no dashboard
2. Configure nome, moeda, datas e regras
3. Defina orçamentos default por papel
4. Clique "Create Game"

### 4. Gestão do Jogo
- **Players**: Adicione participantes por email
- **Startups**: Crie as startups que participarão
- **Controls**: Controle o estado do mercado
- **Emails**: Envie notificações aos participantes

### 5. Durante o Jogo
- Participantes exploram startups em `/games/{id}/discover`
- Fazem propostas de investimento
- Fundadores aceitam/rejeitam em `/games/{id}/startup/{slug}/admin`
- Preços são calculados automaticamente via VWAP(3)

## 📊 Regras de Negócio

### Papéis
- **Founder**: Gere a startup, aceita/rejeita investimentos
- **Angel**: Investe com orçamento médio (default: $100k)
- **VC**: Investe com orçamento alto (default: $1M)
- **Organizer**: Controla o jogo todo

### Estados do Jogo
1. **Draft**: Configuração inicial
2. **Pre-market**: Preparação antes do início
3. **Open**: Mercado ativo para trading
4. **Closed**: Mercado fechado
5. **Results**: Resultados finais

### Preço VWAP(3)
- Calculado automaticamente após cada trade
- Baseado nas últimas 3 transações
- Usado para market cap e valorização do portfolio

### Trading Secundário
- Desabilitado por default
- Quando ativo: participantes podem vender entre si
- Requer dupla confirmação (vendedor + comprador)

## 🔐 Segurança

- **Row Level Security (RLS)** em todas as tabelas
- **Políticas granulares** por papel e ação
- **Validações automáticas** de saldo e posições
- **Triggers de integridade** de dados

## 🎯 Próximos Passos

1. **Configurar Resend** (opcional): Para emails automáticos
2. **Adicionar Storage** (opcional): Para logos das startups  
3. **Personalizar Design**: Ajustar cores e branding

## 📧 Configuração de Email (Opcional)

Para ativar emails automáticos:
1. Crie conta em [Resend.com](https://resend.com)
2. Valide o seu domínio
3. Obtenha API key em [API Keys](https://resend.com/api-keys)
4. Configure a secret `RESEND_API_KEY` no Supabase

## 🌍 Multi-idioma (Futuro)

Preparado para suporte a:
- 🇺🇸 English
- 🇨🇳 中文 (Chinese)  
- 🇮🇳 हिन्दी (Hindi)
- 🇪🇸 Español
- 🇸🇦 العربية (Arabic)
- 🇧🇩 বাংলা (Bengali)
- 🇵🇹 Português
- 🇷🇺 Русский (Russian)
- 🇯🇵 日本語 (Japanese)
- 🇩🇪 Deutsch (German)

## 💰 Multi-moeda

Suporte completo para:
- USD, EUR, CNY, JPY, GBP
- INR, AUD, CAD, CHF, HKD

---

**Startup Stock Market** - Criado com ❤️ usando Lovable, Supabase e React.