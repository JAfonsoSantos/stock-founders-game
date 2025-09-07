-- Fix Security Issues from Linter

-- 1. Fix Function Search Path issues
-- Update functions to have secure search paths
CREATE OR REPLACE FUNCTION public.check_circuit_breaker()
RETURNS TRIGGER AS $$
DECLARE
    game_record games%ROWTYPE;
    previous_price NUMERIC;
    price_change_pct NUMERIC;
BEGIN
    -- Get game settings
    SELECT * INTO game_record 
    FROM games 
    WHERE id = NEW.game_id;
    
    -- Skip if circuit breaker is disabled for this game
    IF NOT game_record.circuit_breaker THEN
        RETURN NEW;
    END IF;
    
    -- Skip if circuit breaker is already active
    IF game_record.circuit_breaker_active AND 
       game_record.circuit_breaker_until > NOW() THEN
        RAISE EXCEPTION 'Trading is paused due to circuit breaker';
    END IF;
    
    -- Get the startup's current VWAP price (before this trade)
    SELECT last_vwap_price INTO previous_price
    FROM startups 
    WHERE id = NEW.startup_id;
    
    -- If there's a previous price, check for extreme changes
    IF previous_price IS NOT NULL AND previous_price > 0 THEN
        price_change_pct := ABS((NEW.price_per_share - previous_price) / previous_price * 100);
        
        -- If price change is more than 200%, activate circuit breaker
        IF price_change_pct > 200 THEN
            -- Pause trading for 60 seconds
            UPDATE games 
            SET circuit_breaker_active = TRUE,
                circuit_breaker_until = NOW() + INTERVAL '60 seconds'
            WHERE id = NEW.game_id;
            
            -- Insert a notification about the circuit breaker
            INSERT INTO notifications (
                game_id,
                to_participant_id,
                type,
                payload
            )
            SELECT 
                NEW.game_id,
                p.id,
                'circuit_breaker_triggered',
                json_build_object(
                    'startup_id', NEW.startup_id,
                    'old_price', previous_price,
                    'new_price', NEW.price_per_share,
                    'change_percent', price_change_pct,
                    'resume_time', NOW() + INTERVAL '60 seconds'
                )
            FROM participants p
            WHERE p.game_id = NEW.game_id;
            
            RAISE NOTICE 'Circuit breaker activated due to extreme price change';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix reset function
CREATE OR REPLACE FUNCTION public.reset_expired_circuit_breakers()
RETURNS void AS $$
BEGIN
    UPDATE games 
    SET circuit_breaker_active = FALSE,
        circuit_breaker_until = NULL
    WHERE circuit_breaker_active = TRUE 
    AND circuit_breaker_until <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;