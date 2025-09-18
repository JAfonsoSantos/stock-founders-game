-- Update all pending participants added by organizers to active status
-- This fixes the issue where invited participants still need approval
UPDATE participants 
SET status = 'active'::participant_status, updated_at = now()
WHERE status = 'pending'::participant_status
AND game_id IN (
  SELECT id FROM games 
  WHERE created_at >= '2025-09-18'::date
);