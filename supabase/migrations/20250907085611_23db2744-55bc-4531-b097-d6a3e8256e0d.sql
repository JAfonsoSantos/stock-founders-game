-- Insert demo data for testing

-- Create demo users (these would normally be created via auth, but we'll insert profiles)
INSERT INTO public.users (id, first_name, last_name, locale_pref) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Alice', 'Cooper', 'en'),
('550e8400-e29b-41d4-a716-446655440001', 'Bob', 'Smith', 'en'),
('550e8400-e29b-41d4-a716-446655440002', 'Charlie', 'Johnson', 'en'),
('550e8400-e29b-41d4-a716-446655440003', 'Diana', 'Wilson', 'en'),
('550e8400-e29b-41d4-a716-446655440004', 'Eve', 'Davis', 'en'),
('550e8400-e29b-41d4-a716-446655440005', 'Frank', 'Miller', 'en'),
('550e8400-e29b-41d4-a716-446655440006', 'Grace', 'Brown', 'en'),
('550e8400-e29b-41d4-a716-446655440007', 'Henry', 'Taylor', 'en'),
('550e8400-e29b-41d4-a716-446655440008', 'Ivy', 'Anderson', 'en'),
('550e8400-e29b-41d4-a716-446655440009', 'Jack', 'Thomas', 'en'),
('550e8400-e29b-41d4-a716-44665544000a', 'Kate', 'Jackson', 'en'),
('550e8400-e29b-41d4-a716-44665544000b', 'Leo', 'White', 'en')
ON CONFLICT (id) DO NOTHING;

-- Create a demo game
INSERT INTO public.games (id, owner_user_id, name, status, starts_at, ends_at, currency, locale, allow_secondary, show_public_leaderboards, circuit_breaker, max_price_per_share)
VALUES ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'Demo Summit 2024', 'pre_market', 
        NOW() + INTERVAL '1 hour', 
        NOW() + INTERVAL '1 day', 
        'USD', 'en', false, true, true, 10000.00)
ON CONFLICT (id) DO NOTHING;

-- Create game roles for demo game
INSERT INTO public.game_roles (game_id, role, default_budget) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'founder', 10000.00),
('550e8400-e29b-41d4-a716-446655440100', 'angel', 100000.00),
('550e8400-e29b-41d4-a716-446655440100', 'vc', 1000000.00)
ON CONFLICT (game_id, role) DO NOTHING;

-- Create participants
INSERT INTO public.participants (id, game_id, user_id, role, initial_budget, current_cash) VALUES
-- Founders
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', 'founder', 10000.00, 10000.00),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440002', 'founder', 10000.00, 10000.00),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440003', 'founder', 10000.00, 10000.00),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440004', 'founder', 10000.00, 10000.00),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440005', 'founder', 10000.00, 10000.00),
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440006', 'founder', 10000.00, 10000.00),
('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440007', 'founder', 10000.00, 10000.00),
('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440008', 'founder', 10000.00, 10000.00),
-- Angels
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440009', 'angel', 100000.00, 100000.00),
('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-44665544000a', 'angel', 100000.00, 100000.00),
-- VCs
('550e8400-e29b-41d4-a716-44665544020a', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-44665544000b', 'vc', 1000000.00, 1000000.00)
ON CONFLICT (id) DO NOTHING;

-- Create startups
INSERT INTO public.startups (id, game_id, slug, name, description, website, linkedin, total_shares, primary_shares_remaining) VALUES
('550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440100', 'techflow', 'TechFlow AI', 'Revolutionary AI platform for workflow automation', 'https://techflow.ai', 'https://linkedin.com/company/techflow', 100, 100),
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440100', 'greentech', 'GreenTech Solutions', 'Sustainable energy solutions for smart cities', 'https://greentech.com', 'https://linkedin.com/company/greentech', 100, 100),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440100', 'healthai', 'HealthAI', 'AI-powered healthcare diagnostics platform', 'https://healthai.com', 'https://linkedin.com/company/healthai', 100, 100),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440100', 'fintech-pro', 'FinTech Pro', 'Next-generation financial services platform', 'https://fintechpro.com', 'https://linkedin.com/company/fintechpro', 100, 100)
ON CONFLICT (id) DO NOTHING;

-- Assign founders to startups
INSERT INTO public.founder_members (startup_id, participant_id, role, can_manage) VALUES
-- TechFlow AI
('550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440200', 'owner', true),
('550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440201', 'member', true),
-- GreenTech Solutions
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440202', 'owner', true),
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440203', 'member', true),
-- HealthAI
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440204', 'owner', true),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440205', 'member', true),
-- FinTech Pro
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440206', 'owner', true),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440207', 'member', true)
ON CONFLICT (startup_id, participant_id) DO NOTHING;

-- Create some demo trades to show VWAP calculation
INSERT INTO public.trades (game_id, startup_id, seller_participant_id, buyer_participant_id, qty, price_per_share, market_type) VALUES
-- TechFlow AI trades
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440300', NULL, '550e8400-e29b-41d4-a716-446655440208', 10, 100.00, 'primary'),
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440300', NULL, '550e8400-e29b-41d4-a716-446655440209', 15, 120.00, 'primary'),
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440300', NULL, '550e8400-e29b-41d4-a716-44665544020a', 20, 110.00, 'primary'),
-- GreenTech Solutions trades
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440301', NULL, '550e8400-e29b-41d4-a716-446655440208', 5, 200.00, 'primary'),
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440301', NULL, '550e8400-e29b-41d4-a716-44665544020a', 10, 180.00, 'primary');

-- Update startup shares remaining after trades
UPDATE public.startups SET primary_shares_remaining = 55 WHERE id = '550e8400-e29b-41d4-a716-446655440300';
UPDATE public.startups SET primary_shares_remaining = 85 WHERE id = '550e8400-e29b-41d4-a716-446655440301';

-- Update participant cash after trades
UPDATE public.participants SET current_cash = 99000.00 WHERE id = '550e8400-e29b-41d4-a716-446655440208'; -- Angel spent 2000
UPDATE public.participants SET current_cash = 98200.00 WHERE id = '550e8400-e29b-41d4-a716-446655440209'; -- Angel spent 1800  
UPDATE public.participants SET current_cash = 996200.00 WHERE id = '550e8400-e29b-41d4-a716-44665544020a'; -- VC spent 3800

-- Create positions for buyers
INSERT INTO public.positions (participant_id, startup_id, qty_total, avg_cost) VALUES
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440300', 10, 100.00),
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440301', 5, 200.00),
('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440300', 15, 120.00),
('550e8400-e29b-41d4-a716-44665544020a', '550e8400-e29b-41d4-a716-446655440300', 20, 110.00),
('550e8400-e29b-41d4-a716-44665544020a', '550e8400-e29b-41d4-a716-446655440301', 10, 180.00)
ON CONFLICT (participant_id, startup_id) DO NOTHING;

-- Create some pending orders for testing
INSERT INTO public.orders_primary (game_id, startup_id, buyer_participant_id, qty, price_per_share, status) VALUES
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440208', 8, 150.00, 'pending'),
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440209', 12, 95.00, 'pending'),
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-44665544020a', 25, 140.00, 'pending');