-- First, drop all functions that reference startup_id to avoid conflicts
DROP FUNCTION IF EXISTS public.create_primary_order(uuid, uuid, integer, numeric, numeric);
DROP FUNCTION IF EXISTS public.create_primary_order(uuid, uuid, integer, numeric);
DROP FUNCTION IF EXISTS public.decide_primary_order(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.decide_primary_order(uuid, text);
DROP FUNCTION IF EXISTS public.create_secondary_trade_request(uuid, uuid, text, integer, numeric);
DROP FUNCTION IF EXISTS public.accept_secondary_trade(uuid);
DROP FUNCTION IF EXISTS public.get_startup_leaderboard(uuid);
DROP FUNCTION IF EXISTS public.calculate_vwap3_for_startup(uuid);
DROP FUNCTION IF EXISTS public.get_all_startups_admin();
DROP FUNCTION IF EXISTS public.admin_delete_startups(uuid[]);

-- Now rename the table and columns
ALTER TABLE public.startups RENAME TO ventures;
ALTER TABLE public.ventures ADD COLUMN type TEXT NOT NULL DEFAULT 'startup';
ALTER TABLE public.ventures ADD CONSTRAINT ventures_type_check 
CHECK (type IN ('startup', 'idea', 'project'));

-- Update all foreign key references
ALTER TABLE public.founder_members RENAME COLUMN startup_id TO venture_id;
ALTER TABLE public.positions RENAME COLUMN startup_id TO venture_id;
ALTER TABLE public.trades RENAME COLUMN startup_id TO venture_id;
ALTER TABLE public.orders_primary RENAME COLUMN startup_id TO venture_id;

-- Update indexes
DROP INDEX IF EXISTS idx_trades_startup_created;
CREATE INDEX idx_trades_venture_created ON public.trades (venture_id, created_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "startups_owner_manage" ON public.ventures;
DROP POLICY IF EXISTS "startups_participants_select" ON public.ventures;

CREATE POLICY "ventures_owner_manage" ON public.ventures
FOR ALL USING (is_game_owner(game_id));

CREATE POLICY "ventures_participants_select" ON public.ventures
FOR SELECT USING (is_user_participant_in_game(game_id));