-- Update add_demo_participant function to create participants with 'active' status when added by organizers
CREATE OR REPLACE FUNCTION public.add_demo_participant(p_game_id uuid, p_email text, p_first_name text, p_last_name text, p_role participant_role, p_budget numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_demo_user_id UUID;
  v_participant_id UUID;
  v_game games%ROWTYPE;
BEGIN
  -- Check if user is game owner
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Game not found');
  END IF;
  
  IF v_game.owner_user_id != auth.uid() THEN
    RETURN json_build_object('error', 'Only game owner can add participants');
  END IF;
  
  -- Generate a demo user ID
  v_demo_user_id := gen_random_uuid();
  
  -- Insert demo user with email
  INSERT INTO public.users (id, first_name, last_name, email)
  VALUES (v_demo_user_id, p_first_name, p_last_name, p_email);
  
  -- Insert participant with 'active' status (organizer-invited participants are auto-approved)
  INSERT INTO public.participants (
    game_id,
    user_id,
    role,
    initial_budget,
    current_cash,
    status
  ) VALUES (
    p_game_id,
    v_demo_user_id,
    p_role,
    p_budget,
    p_budget,
    'active'
  ) RETURNING id INTO v_participant_id;
  
  RETURN json_build_object(
    'success', true,
    'participant_id', v_participant_id,
    'user_id', v_demo_user_id,
    'message', 'Demo participant added successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$function$;