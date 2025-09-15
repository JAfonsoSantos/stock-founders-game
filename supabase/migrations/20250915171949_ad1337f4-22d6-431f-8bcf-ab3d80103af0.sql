-- Add RLS policy to allow game owners to view founder members for ventures in their games
CREATE POLICY "Game owners can view venture founders"
ON public.founder_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ventures v
    JOIN public.games g ON v.game_id = g.id
    WHERE v.id = founder_members.venture_id
    AND g.owner_user_id = auth.uid()
  )
);