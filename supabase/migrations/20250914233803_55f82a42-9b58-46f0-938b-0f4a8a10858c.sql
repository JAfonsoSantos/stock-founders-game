-- Create RLS policy to allow game owners to see venture ideas from their participants
CREATE POLICY "Game owners can view participant venture ideas" 
ON public.venture_ideas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM participants p 
    JOIN games g ON g.id = p.game_id 
    WHERE p.user_id = venture_ideas.user_id 
    AND g.owner_user_id = auth.uid()
  )
);