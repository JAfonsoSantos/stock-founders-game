-- Fix infinite recursion in RLS policies by using SECURITY DEFINER helper functions

-- First drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Game owners can manage their games" ON public.games;
DROP POLICY IF EXISTS "Games: owner full access" ON public.games;
DROP POLICY IF EXISTS "Games: participants can select" ON public.games;
DROP POLICY IF EXISTS "Participants can view games they're in" ON public.games;

DROP POLICY IF EXISTS "Game owners can manage participants" ON public.participants;
DROP POLICY IF EXISTS "Participants: owner manage" ON public.participants;
DROP POLICY IF EXISTS "Participants: user can select own" ON public.participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.participants;

DROP POLICY IF EXISTS "Game owners can manage startups" ON public.startups;
DROP POLICY IF EXISTS "Startups: owner manage" ON public.startups;
DROP POLICY IF EXISTS "Startups: participants select" ON public.startups;
DROP POLICY IF EXISTS "Participants can view startups in their games" ON public.startups;

DROP POLICY IF EXISTS "Game owners can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Participants can view trades in their games" ON public.trades;
DROP POLICY IF EXISTS "Trades: select by participants or owner" ON public.trades;

DROP POLICY IF EXISTS "Users can view their own positions" ON public.positions;
DROP POLICY IF EXISTS "Game owners can view all positions" ON public.positions;
DROP POLICY IF EXISTS "Positions: user can select own" ON public.positions;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications: user select own" ON public.notifications;
DROP POLICY IF EXISTS "Notifications: user update own" ON public.notifications;

DROP POLICY IF EXISTS "Game owners can view all orders" ON public.orders_primary;
DROP POLICY IF EXISTS "Buyers can manage their orders" ON public.orders_primary;
DROP POLICY IF EXISTS "Startup founders can view and decide orders" ON public.orders_primary;
DROP POLICY IF EXISTS "Orders: buyer manage own" ON public.orders_primary;
DROP POLICY IF EXISTS "Orders: founders select" ON public.orders_primary;

DROP POLICY IF EXISTS "Game owners can manage game roles" ON public.game_roles;
DROP POLICY IF EXISTS "Participants can view game roles" ON public.game_roles;
DROP POLICY IF EXISTS "Game Roles: owner manage" ON public.game_roles;
DROP POLICY IF EXISTS "Game Roles: participants select" ON public.game_roles;

DROP POLICY IF EXISTS "Startup founders can manage members" ON public.founder_members;
DROP POLICY IF EXISTS "Participants can view founder members" ON public.founder_members;

-- Create helper functions to avoid recursion
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

-- Create simple, non-recursive policies using helper functions

-- games: Only basic access patterns
CREATE POLICY "games_owner_access" ON public.games
FOR ALL USING (owner_user_id = auth.uid());

-- participants: Simple user-based access
CREATE POLICY "participants_owner_manage" ON public.participants
FOR ALL USING (public.is_game_owner(game_id));

CREATE POLICY "participants_user_select" ON public.participants
FOR SELECT USING (user_id = auth.uid());

-- startups: Simple access patterns
CREATE POLICY "startups_owner_manage" ON public.startups
FOR ALL USING (public.is_game_owner(game_id));

CREATE POLICY "startups_participants_select" ON public.startups
FOR SELECT USING (public.is_user_participant_in_game(game_id));

-- trades: Simple access
CREATE POLICY "trades_participants_select" ON public.trades
FOR SELECT USING (
  public.is_user_participant_in_game(game_id) OR public.is_game_owner(game_id)
);

-- positions: Direct user check
CREATE POLICY "positions_user_select" ON public.positions
FOR SELECT USING (public.is_participant_of_user(participant_id));

-- notifications: Direct user check
CREATE POLICY "notifications_user_access" ON public.notifications
FOR ALL USING (public.is_participant_of_user(to_participant_id));

-- orders_primary: Simple access
CREATE POLICY "orders_buyer_access" ON public.orders_primary
FOR ALL USING (public.is_participant_of_user(buyer_participant_id));

CREATE POLICY "orders_game_owner_select" ON public.orders_primary
FOR SELECT USING (public.is_game_owner(game_id));

-- game_roles: Simple access
CREATE POLICY "game_roles_owner_manage" ON public.game_roles
FOR ALL USING (public.is_game_owner(game_id));

CREATE POLICY "game_roles_participants_select" ON public.game_roles
FOR SELECT USING (public.is_user_participant_in_game(game_id));

-- founder_members: Simple access
CREATE POLICY "founder_members_participants_view" ON public.founder_members
FOR SELECT USING (public.is_participant_of_user(participant_id));