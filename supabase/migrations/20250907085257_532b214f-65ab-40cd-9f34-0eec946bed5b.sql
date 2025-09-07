-- Add missing RLS policies for tables without them

-- RLS Policies for game_roles table
CREATE POLICY "Game owners can manage game roles" ON public.game_roles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.games WHERE games.id = game_roles.game_id AND games.owner_user_id = auth.uid())
);
CREATE POLICY "Participants can view game roles" ON public.game_roles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.game_id = game_roles.game_id AND participants.user_id = auth.uid())
);

-- RLS Policies for founder_members table
CREATE POLICY "Startup founders can manage members" ON public.founder_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.founder_members fm 
            JOIN public.participants p ON p.id = fm.participant_id 
            WHERE fm.startup_id = founder_members.startup_id 
            AND p.user_id = auth.uid() 
            AND fm.can_manage = true)
);
CREATE POLICY "Participants can view founder members" ON public.founder_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.startups s 
            JOIN public.participants p ON p.game_id = s.game_id 
            WHERE s.id = founder_members.startup_id AND p.user_id = auth.uid())
);

-- RLS Policies for orders_primary table
CREATE POLICY "Game owners can view all orders" ON public.orders_primary FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.games WHERE games.id = orders_primary.game_id AND games.owner_user_id = auth.uid())
);
CREATE POLICY "Buyers can manage their orders" ON public.orders_primary FOR ALL USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.id = orders_primary.buyer_participant_id AND participants.user_id = auth.uid())
);
CREATE POLICY "Startup founders can view and decide orders" ON public.orders_primary FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.founder_members fm 
            JOIN public.participants p ON p.id = fm.participant_id 
            WHERE fm.startup_id = orders_primary.startup_id 
            AND p.user_id = auth.uid())
);

-- RLS Policies for positions table
CREATE POLICY "Users can view their own positions" ON public.positions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.id = positions.participant_id AND participants.user_id = auth.uid())
);
CREATE POLICY "Game owners can view all positions" ON public.positions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants p 
            JOIN public.games g ON g.id = p.game_id 
            WHERE p.id = positions.participant_id AND g.owner_user_id = auth.uid())
);

-- RLS Policies for notifications table
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.id = notifications.to_participant_id AND participants.user_id = auth.uid())
);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.participants WHERE participants.id = notifications.to_participant_id AND participants.user_id = auth.uid())
);

-- Fix function search paths
CREATE OR REPLACE FUNCTION calculate_vwap3_for_startup(startup_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION trigger_recalc_vwap()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    PERFORM calculate_vwap3_for_startup(NEW.startup_id);
    RETURN NEW;
END;
$$;

-- Recreate views as regular views (not security definer)
DROP VIEW IF EXISTS public.leaderboard_startups;
DROP VIEW IF EXISTS public.portfolio_view;
DROP VIEW IF EXISTS public.leaderboard_angels;
DROP VIEW IF EXISTS public.leaderboard_vcs;

-- Regular views without security definer
CREATE VIEW public.leaderboard_startups AS
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

CREATE VIEW public.portfolio_view AS
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

CREATE VIEW public.leaderboard_angels AS
SELECT * FROM public.portfolio_view 
WHERE role = 'angel' 
ORDER BY roi_percentage DESC NULLS LAST;

CREATE VIEW public.leaderboard_vcs AS
SELECT * FROM public.portfolio_view 
WHERE role = 'vc' 
ORDER BY roi_percentage DESC NULLS LAST;