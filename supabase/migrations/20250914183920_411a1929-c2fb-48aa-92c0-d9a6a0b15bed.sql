-- Create game invitation notification for asantos@kevel.com to join "The Unconference"
INSERT INTO notifications (
  game_id, 
  to_participant_id, 
  from_participant_id, 
  type, 
  payload, 
  status
) VALUES (
  'b391e151-1033-4cad-af57-5066fd7c9e6b', 
  '61091671-d95f-439f-b91e-01877ded3ef8', 
  '159e2939-5911-4430-939d-ea0a8c29b4cc', 
  'game_invitation', 
  '{"game_name": "The Unconference", "game_id": "b391e151-1033-4cad-af57-5066fd7c9e6b", "inviter_name": "Game Organizer"}'::jsonb, 
  'unread'
);