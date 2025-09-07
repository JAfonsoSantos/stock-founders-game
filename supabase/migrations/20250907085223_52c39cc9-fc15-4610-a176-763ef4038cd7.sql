-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE game_status AS ENUM ('draft', 'pre_market', 'open', 'closed', 'results');
CREATE TYPE participant_role AS ENUM ('founder', 'angel', 'vc', 'organizer');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'rejected', 'canceled', 'expired');
CREATE TYPE market_type AS ENUM ('primary', 'secondary');
CREATE TYPE founder_member_role AS ENUM ('owner', 'member');

-- Create games table
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status game_status DEFAULT 'draft' NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    locale TEXT DEFAULT 'en' NOT NULL,
    allow_secondary BOOLEAN DEFAULT FALSE NOT NULL,
    show_public_leaderboards BOOLEAN DEFAULT FALSE NOT NULL,
    circuit_breaker BOOLEAN DEFAULT TRUE NOT NULL,
    max_price_per_share NUMERIC(15,2) DEFAULT 10000 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create game_roles table for default budgets per role
CREATE TABLE public.game_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    role participant_role NOT NULL,
    default_budget NUMERIC(15,2) NOT NULL,
    UNIQUE(game_id, role)
);

-- Create users profile table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    locale_pref TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create participants table
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role participant_role NOT NULL,
    initial_budget NUMERIC(15,2) NOT NULL,
    current_cash NUMERIC(15,2) NOT NULL,
    is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(game_id, user_id)
);

-- Create startups table
CREATE TABLE public.startups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    linkedin TEXT,
    total_shares INTEGER NOT NULL DEFAULT 100,
    primary_shares_remaining INTEGER NOT NULL DEFAULT 100,
    last_vwap_price NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(game_id, slug)
);

-- Create founder_members table
CREATE TABLE public.founder_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    role founder_member_role DEFAULT 'member' NOT NULL,
    can_manage BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(startup_id, participant_id)
);

-- Create orders_primary table
CREATE TABLE public.orders_primary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    buyer_participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    price_per_share NUMERIC(15,2) NOT NULL CHECK (price_per_share > 0),
    status order_status DEFAULT 'pending' NOT NULL,
    auto_accept_min_price NUMERIC(15,2),
    decided_by_participant_id UUID REFERENCES public.participants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create trades table
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    seller_participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    buyer_participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    price_per_share NUMERIC(15,2) NOT NULL CHECK (price_per_share > 0),
    market_type market_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create positions table
CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    qty_total INTEGER NOT NULL DEFAULT 0,
    avg_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(participant_id, startup_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    to_participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    from_participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'unread' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_trades_startup_created_at ON public.trades(startup_id, created_at DESC);
CREATE INDEX idx_participants_game_user ON public.participants(game_id, user_id);
CREATE INDEX idx_startups_game_slug ON public.startups(game_id, slug);
CREATE INDEX idx_positions_participant_startup ON public.positions(participant_id, startup_id);
CREATE INDEX idx_notifications_participant ON public.notifications(to_participant_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_primary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for games table
CREATE POLICY "Game owners can manage their games" ON public.games FOR ALL USING (auth.uid() = owner_user_id);
CREATE POLICY "Participants can view games they're in" ON public.games FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.game_id = games.id AND participants.user_id = auth.uid())
);

-- RLS Policies for participants table
CREATE POLICY "Game owners can manage participants" ON public.participants FOR ALL USING (
    EXISTS (SELECT 1 FROM public.games WHERE games.id = participants.game_id AND games.owner_user_id = auth.uid())
);
CREATE POLICY "Users can view their own participation" ON public.participants FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for startups table
CREATE POLICY "Game owners can manage startups" ON public.startups FOR ALL USING (
    EXISTS (SELECT 1 FROM public.games WHERE games.id = startups.game_id AND games.owner_user_id = auth.uid())
);
CREATE POLICY "Participants can view startups in their games" ON public.startups FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.game_id = startups.game_id AND participants.user_id = auth.uid())
);

-- RLS Policies for trades table
CREATE POLICY "Game owners can view all trades" ON public.trades FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.games WHERE games.id = trades.game_id AND games.owner_user_id = auth.uid())
);
CREATE POLICY "Participants can view trades in their games" ON public.trades FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.game_id = trades.game_id AND participants.user_id = auth.uid())
);

-- Function to calculate VWAP(3) and update startup price
CREATE OR REPLACE FUNCTION calculate_vwap3_for_startup(startup_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    vwap_price NUMERIC;
BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN NULL
            ELSE SUM(qty * price_per_share) / SUM(qty)
        END
    INTO vwap_price
    FROM (
        SELECT qty, price_per_share
        FROM public.trades
        WHERE startup_id = startup_uuid
        ORDER BY created_at DESC
        LIMIT 3
    ) recent_trades;
    
    UPDATE public.startups 
    SET last_vwap_price = vwap_price,
        updated_at = NOW()
    WHERE id = startup_uuid;
    
    RETURN vwap_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate VWAP after trade insert
CREATE OR REPLACE FUNCTION trigger_recalc_vwap()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_vwap3_for_startup(NEW.startup_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_vwap_on_trade
    AFTER INSERT ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalc_vwap();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, first_name, last_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create view for startup leaderboards (market cap)
CREATE OR REPLACE VIEW public.leaderboard_startups AS
SELECT 
    s.id,
    s.game_id,
    s.name,
    s.logo_url,
    s.last_vwap_price,
    s.total_shares,
    COALESCE(s.last_vwap_price * s.total_shares, 0) as market_cap,
    s.total_shares - s.primary_shares_remaining as shares_sold
FROM public.startups s
ORDER BY market_cap DESC NULLS LAST;

-- Create view for portfolio values
CREATE OR REPLACE VIEW public.portfolio_view AS
SELECT 
    p.id as participant_id,
    p.game_id,
    p.user_id,
    p.role,
    p.current_cash,
    p.initial_budget,
    COALESCE(SUM(pos.qty_total * COALESCE(s.last_vwap_price, pos.avg_cost)), 0) as portfolio_value,
    p.current_cash + COALESCE(SUM(pos.qty_total * COALESCE(s.last_vwap_price, pos.avg_cost)), 0) as total_value,
    ((p.current_cash + COALESCE(SUM(pos.qty_total * COALESCE(s.last_vwap_price, pos.avg_cost)), 0) - p.initial_budget) / p.initial_budget * 100) as roi_percentage
FROM public.participants p
LEFT JOIN public.positions pos ON pos.participant_id = p.id
LEFT JOIN public.startups s ON s.id = pos.startup_id
GROUP BY p.id, p.game_id, p.user_id, p.role, p.current_cash, p.initial_budget;

-- Create leaderboard views for Angels and VCs
CREATE OR REPLACE VIEW public.leaderboard_angels AS
SELECT * FROM public.portfolio_view 
WHERE role = 'angel' 
ORDER BY roi_percentage DESC NULLS LAST;

CREATE OR REPLACE VIEW public.leaderboard_vcs AS
SELECT * FROM public.portfolio_view 
WHERE role = 'vc' 
ORDER BY roi_percentage DESC NULLS LAST;