-- Function to get available founders for transfer in a game
CREATE OR REPLACE FUNCTION public.get_available_founders_for_transfer(
  p_game_id uuid, 
  p_exclude_participant_id uuid
)
RETURNS TABLE(
  participant_id uuid,
  user_name text,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as participant_id,
    COALESCE(u.first_name || ' ' || u.last_name, u.email) as user_name,
    u.email as user_email
  FROM participants p
  JOIN users u ON u.id = p.user_id
  WHERE p.game_id = p_game_id
    AND p.role = 'founder'
    AND p.status = 'active'
    AND p.id != p_exclude_participant_id
  ORDER BY user_name;
END;
$function$;