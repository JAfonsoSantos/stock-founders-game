-- Fix infinite recursion in games table RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Game owners can manage their games" ON public.games;
DROP POLICY IF EXISTS "Participants can view games they're in" ON public.games;

-- Create security definer function to check game ownership
CREATE OR REPLACE FUNCTION public.is_game_owner_direct(game_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_user_id = auth.uid()
  FROM games
  WHERE id = game_uuid;
$$;

-- Create security definer function to check if user is participant
CREATE OR REPLACE FUNCTION public.is_participant_in_game_direct(game_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE game_id = game_uuid AND user_id = auth.uid()
  );
$$;

-- Create new non-recursive policies for games table
CREATE POLICY "Game owners can manage their games" 
ON public.games 
FOR ALL 
USING (owner_user_id = auth.uid());

CREATE POLICY "Participants can view games they're in" 
ON public.games 
FOR SELECT 
USING (is_participant_in_game_direct(id));