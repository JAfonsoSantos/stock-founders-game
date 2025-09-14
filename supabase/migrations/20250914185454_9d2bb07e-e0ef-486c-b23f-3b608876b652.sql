-- Create a fresh game invitation notification for asantos@kevel.co
INSERT INTO notifications (
  game_id, 
  to_participant_id, 
  from_participant_id, 
  type, 
  payload, 
  status
) VALUES (
  'd40c6075-89c0-4d4c-93fc-057b7edffd26', 
  'f8fc4e87-1346-49bb-a367-15935c00c4c0', 
  '159e2939-5911-4430-939d-ea0a8c29b4cc', 
  'game_invitation', 
  '{"game_name": "The Unconference", "game_id": "d40c6075-89c0-4d4c-93fc-057b7edffd26", "inviter_name": "Game Organizer"}'::jsonb, 
  'unread'
);