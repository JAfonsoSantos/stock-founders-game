-- Function to check if participant is the only founder of any ventures
CREATE OR REPLACE FUNCTION public.check_orphan_ventures_for_participant(p_participant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  orphan_ventures json[];
  venture_record RECORD;
BEGIN
  -- Find ventures where this participant is the only founder
  FOR venture_record IN
    SELECT v.id, v.name, v.game_id
    FROM ventures v
    JOIN founder_members fm ON fm.venture_id = v.id
    WHERE fm.participant_id = p_participant_id
    AND (
      SELECT COUNT(*) FROM founder_members fm2 WHERE fm2.venture_id = v.id
    ) = 1
  LOOP
    orphan_ventures := array_append(
      orphan_ventures, 
      json_build_object(
        'id', venture_record.id,
        'name', venture_record.name,
        'game_id', venture_record.game_id
      )
    );
  END LOOP;

  RETURN json_build_object(
    'has_orphan_ventures', array_length(orphan_ventures, 1) > 0,
    'ventures', COALESCE(orphan_ventures, '{}')
  );
END;
$function$

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
$function$

-- Function to safely delete venture and all related data
CREATE OR REPLACE FUNCTION public.delete_venture_completely(p_venture_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_venture ventures%ROWTYPE;
BEGIN
  -- Get venture details
  SELECT * INTO v_venture FROM ventures WHERE id = p_venture_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Venture not found');
  END IF;

  -- Delete all related data in correct order (respecting foreign key constraints)
  
  -- Delete notifications related to this venture
  DELETE FROM notifications 
  WHERE payload->>'venture_id' = p_venture_id::text;
  
  -- Delete positions
  DELETE FROM positions WHERE venture_id = p_venture_id;
  
  -- Delete trades
  DELETE FROM trades WHERE venture_id = p_venture_id;
  
  -- Delete orders
  DELETE FROM orders_primary WHERE venture_id = p_venture_id;
  
  -- Delete founder members
  DELETE FROM founder_members WHERE venture_id = p_venture_id;
  
  -- Finally delete the venture itself
  DELETE FROM ventures WHERE id = p_venture_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Venture and all related data deleted successfully',
    'venture_name', v_venture.name
  );
END;
$function$

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
$function$