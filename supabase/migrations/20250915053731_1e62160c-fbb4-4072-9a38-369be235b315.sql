-- Fix orphan ventures by creating missing founder_members records
-- This addresses ventures that exist but don't have founder_members linking them to founders

-- Insert founder_members records for orphan ventures
INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
SELECT DISTINCT v.id as venture_id, 
       p.id as participant_id,
       'owner'::founder_member_role as role,
       true as can_manage
FROM ventures v 
JOIN games g ON v.game_id = g.id 
JOIN participants p ON p.game_id = g.id AND p.role = 'founder'
LEFT JOIN founder_members fm ON fm.venture_id = v.id AND fm.participant_id = p.id
WHERE fm.id IS NULL  -- Only orphan ventures
ON CONFLICT (venture_id, participant_id) DO NOTHING;

-- Create a function to automatically link orphan ventures to founders
CREATE OR REPLACE FUNCTION public.fix_orphan_ventures()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  fixed_count INTEGER;
BEGIN
  -- Insert missing founder_members records
  INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
  SELECT DISTINCT v.id as venture_id, 
         p.id as participant_id,
         'owner'::founder_member_role as role,
         true as can_manage
  FROM ventures v 
  JOIN games g ON v.game_id = g.id 
  JOIN participants p ON p.game_id = g.id AND p.role = 'founder'
  LEFT JOIN founder_members fm ON fm.venture_id = v.id AND fm.participant_id = p.id
  WHERE fm.id IS NULL
  ON CONFLICT (venture_id, participant_id) DO NOTHING;
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'fixed_ventures', fixed_count,
    'message', 'Fixed ' || fixed_count || ' orphan ventures'
  );
END;
$function$;