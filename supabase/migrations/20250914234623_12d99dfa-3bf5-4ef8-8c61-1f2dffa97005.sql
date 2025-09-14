-- Create function to notify organizer when new participant joins
CREATE OR REPLACE FUNCTION public.notify_organizer_new_participant()
RETURNS TRIGGER AS $$
DECLARE
  v_game games%ROWTYPE;
  v_user users%ROWTYPE;
BEGIN
  -- Get game details
  SELECT * INTO v_game FROM games WHERE id = NEW.game_id;
  
  -- Get user details
  SELECT * INTO v_user FROM users WHERE id = NEW.user_id;
  
  -- Create notification for game owner when participant has pending status
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (
      game_id,
      to_participant_id,
      from_participant_id,
      type,
      payload
    )
    SELECT 
      NEW.game_id,
      p.id,  -- Send to game owner's participant record
      NEW.id, -- From the new participant
      'participant_approval_request',
      json_build_object(
        'participant_id', NEW.id,
        'user_name', COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
        'user_email', v_user.email,
        'role', NEW.role,
        'initial_budget', NEW.initial_budget
      )
    FROM participants p 
    WHERE p.game_id = NEW.game_id 
    AND p.user_id = v_game.owner_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for participant notifications
DROP TRIGGER IF EXISTS trigger_notify_organizer_new_participant ON participants;
CREATE TRIGGER trigger_notify_organizer_new_participant
  AFTER INSERT ON participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_organizer_new_participant();

-- Create function to approve/reject participants
CREATE OR REPLACE FUNCTION public.approve_reject_participant(
  p_notification_id uuid,
  p_action text -- 'approve' or 'reject'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification notifications%ROWTYPE;
  v_participant participants%ROWTYPE;
  v_game games%ROWTYPE;
  v_participant_id uuid;
BEGIN
  -- Get notification
  SELECT * INTO v_notification FROM notifications WHERE id = p_notification_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Notification not found');
  END IF;
  
  -- Get game and verify ownership
  SELECT * INTO v_game FROM games WHERE id = v_notification.game_id;
  IF v_game.owner_user_id != auth.uid() THEN
    RETURN json_build_object('error', 'Only game owner can approve participants');
  END IF;
  
  -- Get participant from notification payload
  v_participant_id := (v_notification.payload->>'participant_id')::uuid;
  SELECT * INTO v_participant FROM participants WHERE id = v_participant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Participant not found');
  END IF;
  
  -- Update participant status based on action
  IF p_action = 'approve' THEN
    UPDATE participants 
    SET status = 'active', updated_at = now() 
    WHERE id = v_participant_id;
    
    -- Mark notification as accepted
    UPDATE notifications 
    SET status = 'accepted', updated_at = now() 
    WHERE id = p_notification_id;
    
    RETURN json_build_object('success', true, 'message', 'Participant approved');
    
  ELSIF p_action = 'reject' THEN
    -- Delete the participant
    DELETE FROM participants WHERE id = v_participant_id;
    
    -- Mark notification as rejected
    UPDATE notifications 
    SET status = 'rejected', updated_at = now() 
    WHERE id = p_notification_id;
    
    RETURN json_build_object('success', true, 'message', 'Participant rejected');
    
  ELSE
    RETURN json_build_object('error', 'Invalid action. Use approve or reject');
  END IF;
END;
$$;