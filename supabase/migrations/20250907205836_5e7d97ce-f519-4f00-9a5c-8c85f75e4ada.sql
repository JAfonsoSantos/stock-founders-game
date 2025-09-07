-- Fix security issues in views by adding proper access controls
-- Drop existing views
DROP VIEW IF EXISTS public.leaderboard_angels;
DROP VIEW IF EXISTS public.leaderboard_vcs; 
DROP VIEW IF EXISTS public.leaderboard_startups;
DROP VIEW IF EXISTS public.portfolio_view;

-- Recreate portfolio_view with proper security filters
-- Users can only see portfolio data for games they participate in
CREATE VIEW public.portfolio_view AS
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
    -- Only show data for games where the current user is a participant or game owner
    (p.user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM games g WHERE g.id = p.game_id AND g.owner_user_id = auth.uid()) OR
     EXISTS (SELECT 1 FROM participants pp WHERE pp.game_id = p.game_id AND pp.user_id = auth.uid()))
GROUP BY p.id, p.game_id, p.user_id, p.role, p.current_cash, p.initial_budget;

-- Recreate leaderboard_startups with security filters
-- Only show startups from games where user is participant or owner
CREATE VIEW public.leaderboard_startups AS
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
    -- Only show startups from games where user is participant or owner
    (EXISTS (SELECT 1 FROM games g WHERE g.id = s.game_id AND g.owner_user_id = auth.uid()) OR
     EXISTS (SELECT 1 FROM participants p WHERE p.game_id = s.game_id AND p.user_id = auth.uid()))
ORDER BY COALESCE((s.last_vwap_price * (s.total_shares)::numeric), (0)::numeric) DESC NULLS LAST;

-- Recreate leaderboard_angels with security filters
CREATE VIEW public.leaderboard_angels AS
SELECT 
    participant_id,
    game_id,
    user_id,
    role,
    current_cash,
    initial_budget,
    portfolio_value,
    total_value,
    roi_percentage
FROM portfolio_view
WHERE role = 'angel'::participant_role
ORDER BY roi_percentage DESC NULLS LAST;

-- Recreate leaderboard_vcs with security filters
CREATE VIEW public.leaderboard_vcs AS
SELECT 
    participant_id,
    game_id,
    user_id,
    role,
    current_cash,
    initial_budget,
    portfolio_value,
    total_value,
    roi_percentage
FROM portfolio_view
WHERE role = 'vc'::participant_role
ORDER BY roi_percentage DESC NULLS LAST;