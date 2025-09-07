-- Fix remaining function search path issue
CREATE OR REPLACE FUNCTION public.trigger_recalc_vwap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    PERFORM calculate_vwap3_for_startup(NEW.startup_id);
    RETURN NEW;
END;
$$;