-- Allow game owners to update users of their games
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND policyname = 'Game owners can update participant profiles'
  ) THEN
    CREATE POLICY "Game owners can update participant profiles"
    ON public.users
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.participants p
        JOIN public.games g ON g.id = p.game_id
        WHERE p.user_id = users.id
          AND g.owner_user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.participants p
        JOIN public.games g ON g.id = p.game_id
        WHERE p.user_id = users.id
          AND g.owner_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Backfill email for Afonso Kevel in game 90651dac-23b9-4763-95da-aa4be274b305 if missing
UPDATE public.users u
SET email = 'asantos@kevel.com'
FROM public.participants p
WHERE p.user_id = u.id
  AND p.game_id = '90651dac-23b9-4763-95da-aa4be274b305'
  AND COALESCE(u.email, '') = ''
  AND u.first_name = 'Afonso'
  AND u.last_name = 'Kevel';