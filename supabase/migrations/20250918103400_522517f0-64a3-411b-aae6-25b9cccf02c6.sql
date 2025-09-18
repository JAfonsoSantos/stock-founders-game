-- Function to safely delete venture and all related data
CREATE OR REPLACE FUNCTION public.delete_venture_completely(p_venture_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_venture ventures%ROWTYPE;
BEGIN
  -- Get venture details
  SELECT * INTO v_venture FROM ventures WHERE id = p_venture_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Venture not found');
  END IF;

  -- Delete all related data in correct order (respecting foreign key constraints)
  
  -- Delete notifications related to this venture
  DELETE FROM notifications 
  WHERE payload->>'venture_id' = p_venture_id::text;
  
  -- Delete positions
  DELETE FROM positions WHERE venture_id = p_venture_id;
  
  -- Delete trades
  DELETE FROM trades WHERE venture_id = p_venture_id;
  
  -- Delete orders
  DELETE FROM orders_primary WHERE venture_id = p_venture_id;
  
  -- Delete founder members
  DELETE FROM founder_members WHERE venture_id = p_venture_id;
  
  -- Finally delete the venture itself
  DELETE FROM ventures WHERE id = p_venture_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Venture and all related data deleted successfully',
    'venture_name', v_venture.name
  );
END;
$function$;