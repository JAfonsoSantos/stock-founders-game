-- Add participant status enum and column
CREATE TYPE participant_status AS ENUM ('pending', 'active', 'suspended');

-- Add status column to participants table
ALTER TABLE participants 
ADD COLUMN status participant_status NOT NULL DEFAULT 'pending';

-- Update existing participants to active (assuming they've already joined)
UPDATE participants 
SET status = 'active' 
WHERE created_at < NOW();

-- Create index for better performance on status queries
CREATE INDEX idx_participants_status ON participants(status);