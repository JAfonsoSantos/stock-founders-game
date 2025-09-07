-- Drop views with CASCADE to handle dependencies
DROP VIEW IF EXISTS public.leaderboard_angels CASCADE;
DROP VIEW IF EXISTS public.leaderboard_vcs CASCADE;
DROP VIEW IF EXISTS public.portfolio_view CASCADE;
DROP VIEW IF EXISTS public.leaderboard_startups CASCADE;

-- Recreate views as regular views (not security definer)
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