-- Clean up duplicate founder_members and fix orphan ventures issue
-- This migration fixes the data inconsistency where users were incorrectly linked to multiple ventures

DO $$
DECLARE
  kevel_com_user_id uuid := '9aa4bc5f-1cab-44d1-b57a-1f6806adbf6b'; -- asantos@kevel.com
  kevel_co_user_id uuid := 'bd773a39-d7b5-4fcc-9e62-f768e2b55b15';   -- asantos@kevel.co
  kevel_venture_id uuid := '1e3268e7-3606-403c-8a61-7930a4b24220';   -- Kevel venture
  tuizzi_venture_id uuid := '338da170-7c5a-4369-89c9-86cc518b33be';  -- TUIZZI venture
  kevel_com_participant_id uuid;
  kevel_co_participant_id uuid;
BEGIN
  -- Get participant IDs for both users
  SELECT id INTO kevel_com_participant_id FROM participants WHERE user_id = kevel_com_user_id AND game_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  SELECT id INTO kevel_co_participant_id FROM participants WHERE user_id = kevel_co_user_id AND game_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  -- Log what we're doing
  RAISE NOTICE 'Cleaning up founder_members for Kevel (%) and TUIZZI (%) ventures', kevel_venture_id, tuizzi_venture_id;
  RAISE NOTICE 'Kevel.com participant: %, Kevel.co participant: %', kevel_com_participant_id, kevel_co_participant_id;

  -- Remove ALL existing founder_members for these ventures to start clean
  DELETE FROM founder_members WHERE venture_id IN (kevel_venture_id, tuizzi_venture_id);
  
  -- Create correct founder_members associations
  -- Kevel venture should belong to asantos@kevel.com
  IF kevel_com_participant_id IS NOT NULL THEN
    INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
    VALUES (kevel_venture_id, kevel_com_participant_id, 'owner', true);
    RAISE NOTICE 'Linked Kevel venture to asantos@kevel.com';
  END IF;

  -- TUIZZI venture should belong to asantos@kevel.co
  IF kevel_co_participant_id IS NOT NULL THEN
    INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
    VALUES (tuizzi_venture_id, kevel_co_participant_id, 'owner', true);
    RAISE NOTICE 'Linked TUIZZI venture to asantos@kevel.co';
  END IF;

END $$;

-- Improve the fix_orphan_ventures function to prevent future duplicates
CREATE OR REPLACE FUNCTION public.fix_orphan_ventures()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fixed_count INTEGER := 0;
  venture_record RECORD;
  founder_participant_id UUID;
BEGIN
  -- Process each orphan venture individually to avoid duplicates
  FOR venture_record IN
    SELECT DISTINCT v.id as venture_id, v.game_id, v.name
    FROM ventures v 
    LEFT JOIN founder_members fm ON fm.venture_id = v.id
    WHERE fm.id IS NULL
  LOOP
    -- Find a founder participant for this specific game
    SELECT p.id INTO founder_participant_id
    FROM participants p 
    WHERE p.game_id = venture_record.game_id 
    AND p.role = 'founder'
    AND p.status = 'active'
    -- Prefer participants who don't already have a venture
    AND NOT EXISTS (
      SELECT 1 FROM founder_members fm2 
      WHERE fm2.participant_id = p.id
    )
    LIMIT 1;

    -- If no available founder without venture, get any founder
    IF founder_participant_id IS NULL THEN
      SELECT p.id INTO founder_participant_id
      FROM participants p 
      WHERE p.game_id = venture_record.game_id 
      AND p.role = 'founder'
      AND p.status = 'active'
      LIMIT 1;
    END IF;

    -- Create the founder_members association if we found a participant
    IF founder_participant_id IS NOT NULL THEN
      INSERT INTO founder_members (venture_id, participant_id, role, can_manage)
      VALUES (venture_record.venture_id, founder_participant_id, 'owner', true)
      ON CONFLICT (venture_id, participant_id) DO NOTHING;
      
      fixed_count := fixed_count + 1;
      
      RAISE NOTICE 'Fixed orphan venture: % (%) -> participant %', 
        venture_record.name, venture_record.venture_id, founder_participant_id;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'fixed_ventures', fixed_count,
    'message', 'Fixed ' || fixed_count || ' orphan ventures with improved logic'
  );
END;
$function$;