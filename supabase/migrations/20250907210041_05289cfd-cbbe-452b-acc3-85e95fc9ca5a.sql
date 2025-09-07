-- Drop all views to recreate them properly
DROP VIEW IF EXISTS public.leaderboard_angels CASCADE;
DROP VIEW IF EXISTS public.leaderboard_vcs CASCADE; 
DROP VIEW IF EXISTS public.leaderboard_startups CASCADE;
DROP VIEW IF EXISTS public.portfolio_view CASCADE;

-- Instead of using views, create SECURITY DEFINER functions that return tables
-- This provides the same functionality but with proper security isolation

-- Portfolio data function
CREATE OR REPLACE FUNCTION public.get_portfolio_data(p_game_id UUID DEFAULT NULL)
RETURNS TABLE (
    participant_id UUID,
    game_id UUID,
    user_id UUID,
    role participant_role,
    current_cash NUMERIC,
    initial_budget NUMERIC,
    portfolio_value NUMERIC,
    total_value NUMERIC,
    roi_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS participant_id,
        p.game_id,
        p.user_id,
        p.role,
        p.current_cash,
        p.initial_budget,
        COALESCE(sum(((pos.qty_total)::numeric * COALESCE(s.last_vwap_price, pos.avg_cost))), (0)::numeric) AS portfolio_value,
        (p.current_cash + COALESCE(sum(((pos.qty_total)::numeric * COALESCE(s.last_vwap_price, pos.avg_cost))), (0)::numeric)) AS total_value,
        ((((p.current_cash + COALESCE(sum(((pos.qty_total)::numeric * COALESCE(s.last_vwap_price, pos.avg_cost))), (0)::numeric)) - p.initial_budget) / p.initial_budget) * (100)::numeric) AS roi_percentage
    FROM participants p
    LEFT JOIN positions pos ON pos.participant_id = p.id
    LEFT JOIN startups s ON s.id = pos.startup_id
    WHERE 
        -- Security: Only show data the user has access to
        (p.user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM games g WHERE g.id = p.game_id AND g.owner_user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM participants pp WHERE pp.game_id = p.game_id AND pp.user_id = auth.uid()))
        AND (p_game_id IS NULL OR p.game_id = p_game_id)
    GROUP BY p.id, p.game_id, p.user_id, p.role, p.current_cash, p.initial_budget
    ORDER BY p.game_id, p.role, roi_percentage DESC NULLS LAST;
END;
$$;

-- Startup leaderboard function
CREATE OR REPLACE FUNCTION public.get_startup_leaderboard(p_game_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    game_id UUID,
    name TEXT,
    logo_url TEXT,
    last_vwap_price NUMERIC,
    total_shares INTEGER,
    market_cap NUMERIC,
    shares_sold INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.game_id,
        s.name,
        s.logo_url,
        s.last_vwap_price,
        s.total_shares,
        COALESCE((s.last_vwap_price * (s.total_shares)::numeric), (0)::numeric) AS market_cap,
        (s.total_shares - s.primary_shares_remaining) AS shares_sold
    FROM startups s
    WHERE 
        -- Security: Only show startups from accessible games
        (EXISTS (SELECT 1 FROM games g WHERE g.id = s.game_id AND g.owner_user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM participants p WHERE p.game_id = s.game_id AND p.user_id = auth.uid()))
        AND (p_game_id IS NULL OR s.game_id = p_game_id)
    ORDER BY COALESCE((s.last_vwap_price * (s.total_shares)::numeric), (0)::numeric) DESC NULLS LAST;
END;
$$;

-- Angel leaderboard function
CREATE OR REPLACE FUNCTION public.get_angel_leaderboard(p_game_id UUID DEFAULT NULL)
RETURNS TABLE (
    participant_id UUID,
    game_id UUID,
    user_id UUID,
    role participant_role,
    current_cash NUMERIC,
    initial_budget NUMERIC,
    portfolio_value NUMERIC,
    total_value NUMERIC,
    roi_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.get_portfolio_data(p_game_id)
    WHERE role = 'angel'::participant_role
    ORDER BY roi_percentage DESC NULLS LAST;
END;
$$;

-- VC leaderboard function
CREATE OR REPLACE FUNCTION public.get_vc_leaderboard(p_game_id UUID DEFAULT NULL)
RETURNS TABLE (
    participant_id UUID,
    game_id UUID,
    user_id UUID,
    role participant_role,
    current_cash NUMERIC,
    initial_budget NUMERIC,
    portfolio_value NUMERIC,
    total_value NUMERIC,
    roi_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.get_portfolio_data(p_game_id)
    WHERE role = 'vc'::participant_role
    ORDER BY roi_percentage DESC NULLS LAST;
END;
$$;