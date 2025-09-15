-- Fix duplicate founder_members associations causing loading issues
-- Remove duplicate entries and ensure each user has only one venture

-- First, let's check current state and remove duplicates
DELETE FROM founder_members fm1
WHERE EXISTS (
    SELECT 1 FROM founder_members fm2
    WHERE fm2.participant_id = fm1.participant_id
    AND fm2.id > fm1.id
);

-- Now ensure correct associations:
-- asantos@kevel.co (user_id: 9aa4bc5f-1cab-44d1-b57a-1f6806adbf6b) should only have TUIZZI
-- asantos@kevel.com (user_id: 8efe1527-ade1-4e78-b888-bf5ef6f92506) should only have Kevel

-- Remove incorrect associations first
DELETE FROM founder_members 
WHERE participant_id IN (
    SELECT p.id FROM participants p
    JOIN users u ON p.user_id = u.id
    WHERE u.email = 'asantos@kevel.co'
) AND venture_id IN (
    SELECT id FROM ventures WHERE name = 'Kevel'
);

DELETE FROM founder_members 
WHERE participant_id IN (
    SELECT p.id FROM participants p
    JOIN users u ON p.user_id = u.id
    WHERE u.email = 'asantos@kevel.com'
) AND venture_id IN (
    SELECT id FROM ventures WHERE name = 'TUIZZI'
);

-- Add correct associations if they don't exist
INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
SELECT 
    v.id as venture_id,
    p.id as participant_id,
    'owner'::founder_member_role,
    true
FROM ventures v
CROSS JOIN participants p
JOIN users u ON p.user_id = u.id
WHERE v.name = 'TUIZZI' 
AND u.email = 'asantos@kevel.co'
AND NOT EXISTS (
    SELECT 1 FROM founder_members fm2
    WHERE fm2.venture_id = v.id AND fm2.participant_id = p.id
);

INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
SELECT 
    v.id as venture_id,
    p.id as participant_id,
    'owner'::founder_member_role,
    true
FROM ventures v
CROSS JOIN participants p
JOIN users u ON p.user_id = u.id
WHERE v.name = 'Kevel' 
AND u.email = 'asantos@kevel.com'
AND NOT EXISTS (
    SELECT 1 FROM founder_members fm2
    WHERE fm2.venture_id = v.id AND fm2.participant_id = p.id
);

-- Create a unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_members_unique_participant_venture
ON founder_members (participant_id, venture_id);