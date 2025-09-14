-- Update the pending participant to active status
UPDATE participants 
SET status = 'active'
WHERE user_id = '8efe1527-ade1-4e78-b888-bf5ef6f92506' 
AND game_id = 'd40c6075-89c0-4d4c-93fc-057b7edffd26' 
AND status = 'pending';