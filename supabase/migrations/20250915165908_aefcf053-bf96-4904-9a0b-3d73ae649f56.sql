-- Drop existing RLS policy that may be too permissive
DROP POLICY IF EXISTS "Game owners can manage team members" ON public.game_team_members;

-- Create more restrictive RLS policies for team members
-- Only game owners can INSERT, UPDATE, DELETE team members
CREATE POLICY "Game owners can insert team members"
  ON public.game_team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_team_members.game_id 
      AND games.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Game owners can update team members"
  ON public.game_team_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_team_members.game_id 
      AND games.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_team_members.game_id 
      AND games.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Game owners can delete team members"
  ON public.game_team_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_team_members.game_id 
      AND games.owner_user_id = auth.uid()
    )
  );

-- Only game owners and active participants can view team members
CREATE POLICY "Authorized users can view team members"
  ON public.game_team_members
  FOR SELECT
  TO authenticated
  USING (
    -- Game owner can always view
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_team_members.game_id 
      AND games.owner_user_id = auth.uid()
    )
    OR
    -- Active participants in the game can view team members
    EXISTS (
      SELECT 1 FROM public.participants p
      JOIN public.games g ON g.id = p.game_id
      WHERE p.game_id = game_team_members.game_id
      AND p.user_id = auth.uid()
      AND p.status = 'active'
    )
  );