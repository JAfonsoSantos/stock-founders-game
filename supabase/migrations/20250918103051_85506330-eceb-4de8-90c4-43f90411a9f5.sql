-- Function to check if participant is the only founder of any ventures
CREATE OR REPLACE FUNCTION public.check_orphan_ventures_for_participant(p_participant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  orphan_ventures json[];
  venture_record RECORD;
BEGIN
  -- Find ventures where this participant is the only founder
  FOR venture_record IN
    SELECT v.id, v.name, v.game_id
    FROM ventures v
    JOIN founder_members fm ON fm.venture_id = v.id
    WHERE fm.participant_id = p_participant_id
    AND (
      SELECT COUNT(*) FROM founder_members fm2 WHERE fm2.venture_id = v.id
    ) = 1
  LOOP
    orphan_ventures := array_append(
      orphan_ventures, 
      json_build_object(
        'id', venture_record.id,
        'name', venture_record.name,
        'game_id', venture_record.game_id
      )
    );
  END LOOP;

  RETURN json_build_object(
    'has_orphan_ventures', array_length(orphan_ventures, 1) > 0,
    'ventures', COALESCE(orphan_ventures, '{}')
  );
END;
$function$;