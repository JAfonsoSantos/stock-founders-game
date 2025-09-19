-- Function to transfer venture idea ownership between users
CREATE OR REPLACE FUNCTION public.transfer_venture_idea_ownership(
  p_venture_idea_id uuid,
  p_new_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_venture_idea venture_ideas%ROWTYPE;
  v_new_user users%ROWTYPE;
BEGIN
  -- Check if user is super admin (only they should be able to do this)
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized: Only super admin can transfer venture idea ownership');
  END IF;

  -- Get the venture idea
  SELECT * INTO v_venture_idea FROM venture_ideas WHERE id = p_venture_idea_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Venture idea not found');
  END IF;

  -- Get the new user
  SELECT * INTO v_new_user FROM users WHERE id = p_new_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'New user not found');
  END IF;

  -- Transfer ownership
  UPDATE venture_ideas 
  SET user_id = p_new_user_id, updated_at = now()
  WHERE id = p_venture_idea_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Venture idea ownership transferred successfully',
    'venture_name', v_venture_idea.name,
    'old_user_id', v_venture_idea.user_id,
    'new_user_id', p_new_user_id,
    'new_user_name', COALESCE(v_new_user.first_name || ' ' || v_new_user.last_name, v_new_user.email)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'Failed to transfer ownership: ' || SQLERRM);
END;
$function$;