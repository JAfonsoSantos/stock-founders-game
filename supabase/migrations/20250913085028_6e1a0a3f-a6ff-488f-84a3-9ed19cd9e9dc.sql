-- Delete all games except "The Unconference"
DELETE FROM public.games 
WHERE name != 'The Unconference' OR name IS NULL;