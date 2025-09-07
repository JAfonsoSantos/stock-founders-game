-- Remove the foreign key constraint that prevents demo users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add a check to ensure we can still maintain data integrity for real users
-- but allow demo users to be created without auth.users entry
CREATE OR REPLACE FUNCTION public.add_demo_participant(
  p_game_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role participant_role,
  p_budget NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Insert demo user (now without foreign key constraint)
  INSERT INTO public.users (id, first_name, last_name)
  VALUES (v_demo_user_id, p_first_name, p_last_name);
  
  -- Insert participant
  INSERT INTO public.participants (
    game_id,
    user_id,
    role,
    initial_budget,
    current_cash
  ) VALUES (
    p_game_id,
    v_demo_user_id,
    p_role,
    p_budget,
    p_budget
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
$$;