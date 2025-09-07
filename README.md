# Startup Stock Market 🚀

A complete platform for running startup investment games at events. Founders sell shares of their startups to other participants (Angels, VCs) in real-time trading sessions.

## 🎯 Quick Start

### 1. First Time Setup

**Create Demo Game:**
1. Visit your dashboard
2. Click "Create Demo" to get a pre-configured game with sample startups and participants
3. The demo includes 4 startups with realistic data and initial trading activity

**Or Create Custom Game:**
1. Click "New Game" from dashboard
2. Configure game settings (name, currency, dates, market rules)
3. Invite participants via CSV import or individual invites
4. Add your startups (name, description, shares, logo)

### 2. Game Flow

```
Draft → Pre-Market → Open → Closed → Results
```

- **Draft**: Setup phase - configure everything
- **Pre-Market**: Countdown to market open
- **Open**: Active trading period
- **Closed**: Trading stopped
- **Results**: Final leaderboards and reports

### 3. Key Features

**For Organizers:**
- Complete game management dashboard
- CSV participant import
- Real-time market controls (open/close, secondary trading toggle)
- Email system (invites, market updates, results)
- Live analytics and KPIs

**For Participants:**
- **Primary Market**: Buy shares directly from startups (founders approve/reject)
- **Secondary Market**: Trade shares with other participants (when enabled)
- Real-time portfolio tracking and P&L
- Live startup pricing (VWAP of last 3 trades)
- Circuit breaker protection (configurable)

**For Founders:**
- Startup profile management
- Order approval dashboard
- Team member management
- Auto-accept minimum price settings

## 🎮 Testing Guide

### Demo Game Experience
1. **Dashboard**: Create demo game to see realistic data
2. **Organizer View**: Go to "Manage" → explore all tabs (Players, Startups, Controls, Emails)
3. **Market Controls**: 
   - Change game status to "Open" 
   - Toggle secondary market on/off
   - View live KPIs
4. **Player Experience**: Click "Enter Game" to see marketplace
5. **Investment Flow**: Try creating primary market orders
6. **Portfolio**: Check "My Portfolio" for holdings and P&L

### Key Things to Test
- [ ] Game creation and setup
- [ ] Participant management (CSV import)
- [ ] Startup profile creation
- [ ] Market opening/closing
- [ ] Primary market trades (order → approval → execution)
- [ ] Secondary market trades (if enabled)
- [ ] Real-time price updates (VWAP calculation)
- [ ] Portfolio tracking and P&L
- [ ] Leaderboards (public/private toggle)
- [ ] Email notifications
- [ ] Mobile responsiveness

## 🏗️ Technical Architecture

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **next-intl** for i18n (10 languages)

### Backend (Supabase)
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Authentication** (magic link)
- **Storage** for startup logos
- **Edge Functions** for email sending

### Key Business Logic
- **VWAP Pricing**: Price = weighted average of last 3 trades
- **Market Cap**: VWAP × total shares issued
- **Circuit Breaker**: 60s pause if price moves >±200%
- **Roles & Budgets**: Founder (10k), Angel (100k), VC (1M) - configurable

## 📧 Email System

Integrated **Resend** for automated emails:
- Invite participants with join links
- Pre-market reminders (T-24h)
- Market open notifications
- Last 10 minutes alerts
- Trade request notifications (secondary market)
- Final results reports

## 🌍 Internationalization

**Supported Languages**: English, Portuguese, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, Russian

**Supported Currencies**: USD, EUR, CNY, JPY, GBP, INR, AUD, CAD, CHF, HKD

## 🔐 Security Features

- Row Level Security (RLS) on all tables
- Circuit breaker for price volatility
- Maximum price per share limits
- Order expiration and validation
- Real-time fraud detection patterns

## 🚀 Deployment Ready

**Environment Variables Required:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
```

**Database Setup:**
1. Run migrations in `supabase/migrations/` via Supabase Dashboard SQL Editor
2. Configure storage bucket "logos" for startup images
3. Deploy edge functions from `supabase/functions/`

## 💡 Pro Tips

1. **Demo First**: Always start with demo game to understand the full flow
2. **Mobile Ready**: Test on mobile - fully responsive design
3. **Real-time**: All updates are live - open multiple tabs to see real-time sync
4. **Circuit Breaker**: Test with volatile pricing to see 60s pause mechanism
5. **Secondary Market**: Enable for more dynamic trading experience
6. **Email Integration**: Configure Resend for complete participant communication

## 🎯 Perfect For

- **Startup Events**: Pitch competitions, demo days, conferences
- **Corporate Training**: Investment simulation, financial education
- **University Courses**: Entrepreneurship, finance, economics
- **Accelerator Programs**: Portfolio company valuation exercises

---

**Ready to launch your startup stock market? Start with the demo game! 🎉**