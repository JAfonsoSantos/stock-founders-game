-- Temporary fix: Disable RLS on games table to stop infinite recursion
-- This allows the app to function while we debug the policy issues

ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled only on critical user tables
-- users table stays protected
-- participants table gets simplified policies

-- Remove any remaining problematic policies
DROP POLICY IF EXISTS "games_owner_access" ON public.games;

-- Simple participant policy
DROP POLICY IF EXISTS "participants_owner_manage" ON public.participants;
DROP POLICY IF EXISTS "participants_user_select" ON public.participants;

CREATE POLICY "participants_simple" ON public.participants
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.games WHERE games.id = participants.game_id AND games.owner_user_id = auth.uid())
);