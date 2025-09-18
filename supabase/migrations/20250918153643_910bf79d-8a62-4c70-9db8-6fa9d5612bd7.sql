-- Update existing participants that were added by organizers to 'active' status
-- (participants created via add_demo_participant function should be automatically active)
UPDATE participants 
SET status = 'active', updated_at = now()
WHERE status = 'pending'
AND EXISTS (
  SELECT 1 FROM games g 
  WHERE g.id = participants.game_id 
  AND g.owner_user_id = auth.uid()
);