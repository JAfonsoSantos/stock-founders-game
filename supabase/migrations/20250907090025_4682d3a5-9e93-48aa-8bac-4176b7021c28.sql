-- Fix infinite recursion in RLS by using SECURITY DEFINER helper functions

-- Helper: is user participant in game
CREATE OR REPLACE FUNCTION public.is_user_participant_in_game(game_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.participants p
    where p.game_id = game_uuid and p.user_id = auth.uid()
  );
$$;

-- Helper: is user owner of game
CREATE OR REPLACE FUNCTION public.is_game_owner(game_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.games g
    where g.id = game_uuid and g.owner_user_id = auth.uid()
  );
$$;

-- Optional helper: does participant belong to user
CREATE OR REPLACE FUNCTION public.is_participant_of_user(participant_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.participants p
    where p.id = participant_uuid and p.user_id = auth.uid()
  );
$$;

-- Drop problematic policies to avoid recursive references
DROP POLICY IF EXISTS "Participants can view games they're in" ON public.games;
DROP POLICY IF EXISTS "Game owners can manage participants" ON public.participants;
DROP POLICY IF EXISTS "Participants can view startups in their games" ON public.startups;
DROP POLICY IF EXISTS "Game owners can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Participants can view trades in their games" ON public.trades;
DROP POLICY IF EXISTS "Game owners can view all positions" ON public.positions;
DROP POLICY IF EXISTS "Users can view their own positions" ON public.positions;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Buyers can manage their orders" ON public.orders_primary;
DROP POLICY IF EXISTS "Startup founders can view and decide orders" ON public.orders_primary;
DROP POLICY IF EXISTS "Game owners can view all orders" ON public.orders_primary;
DROP POLICY IF EXISTS "Participants can view game roles" ON public.game_roles;
DROP POLICY IF EXISTS "Game owners can manage game roles" ON public.game_roles;

-- Recreate non-recursive, function-based policies

-- games
CREATE POLICY "Games: owner full access" ON public.games
FOR ALL USING (public.is_game_owner(id));

CREATE POLICY "Games: participants can select" ON public.games
FOR SELECT USING (public.is_user_participant_in_game(id));

-- participants
CREATE POLICY "Participants: owner manage" ON public.participants
FOR ALL USING (public.is_game_owner(game_id));

CREATE POLICY "Participants: user can select own" ON public.participants
FOR SELECT USING (user_id = auth.uid());

-- startups
CREATE POLICY "Startups: owner manage" ON public.startups
FOR ALL USING (public.is_game_owner(game_id));

CREATE POLICY "Startups: participants select" ON public.startups
FOR SELECT USING (public.is_user_participant_in_game(game_id));

-- trades
CREATE POLICY "Trades: select by participants or owner" ON public.trades
FOR SELECT USING (
  public.is_user_participant_in_game(game_id) OR public.is_game_owner(game_id)
);

-- positions
CREATE POLICY "Positions: user can select own" ON public.positions
FOR SELECT USING (public.is_participant_of_user(participant_id));

-- notifications
CREATE POLICY "Notifications: user select own" ON public.notifications
FOR SELECT USING (public.is_participant_of_user(to_participant_id));

CREATE POLICY "Notifications: user update own" ON public.notifications
FOR UPDATE USING (public.is_participant_of_user(to_participant_id));

-- orders_primary
CREATE POLICY "Orders: buyer manage own" ON public.orders_primary
FOR ALL USING (public.is_participant_of_user(buyer_participant_id));

CREATE POLICY "Orders: founders select" ON public.orders_primary
FOR SELECT USING (
  exists (
    select 1 from public.founder_members fm
    join public.participants p on p.id = fm.participant_id
    where fm.startup_id = orders_primary.startup_id and p.user_id = auth.uid()
  ) OR public.is_game_owner(game_id)
);

-- game_roles
CREATE POLICY "Game Roles: owner manage" ON public.game_roles
FOR ALL USING (public.is_game_owner(game_id));

CREATE POLICY "Game Roles: participants select" ON public.game_roles
FOR SELECT USING (public.is_user_participant_in_game(game_id));