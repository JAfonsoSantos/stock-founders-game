-- Function to transfer venture ownership
CREATE OR REPLACE FUNCTION public.transfer_venture_ownership(
  p_venture_id uuid, 
  p_new_founder_participant_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_venture ventures%ROWTYPE;
  v_new_founder participants%ROWTYPE;
BEGIN
  -- Get venture details
  SELECT * INTO v_venture FROM ventures WHERE id = p_venture_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Venture not found');
  END IF;

  -- Get new founder details
  SELECT * INTO v_new_founder FROM participants WHERE id = p_new_founder_participant_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'New founder participant not found');
  END IF;

  -- Check if new founder is in the same game
  IF v_new_founder.game_id != v_venture.game_id THEN
    RETURN json_build_object('error', 'New founder must be in the same game');
  END IF;

  -- Check if new founder has founder role
  IF v_new_founder.role != 'founder' THEN
    RETURN json_build_object('error', 'New owner must have founder role');
  END IF;

  -- Add new founder as owner (if not already a founder of this venture)
  INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
  VALUES (p_venture_id, p_new_founder_participant_id, 'owner', true)
  ON CONFLICT (venture_id, participant_id) 
  DO UPDATE SET role = 'owner', can_manage = true;

  RETURN json_build_object('success', true, 'message', 'Ownership transferred successfully');
END;
$function$;