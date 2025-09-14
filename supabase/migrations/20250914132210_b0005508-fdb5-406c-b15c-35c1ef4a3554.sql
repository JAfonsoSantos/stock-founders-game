-- Recreate all functions with venture nomenclature
CREATE OR REPLACE FUNCTION public.get_all_ventures_admin()
 RETURNS TABLE(id uuid, name text, slug text, logo_url text, created_at timestamp with time zone, game_id uuid, type text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT v.id, v.name, v.slug, v.logo_url, v.created_at, v.game_id, v.type
  FROM public.ventures v
  WHERE public.is_super_admin();
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_ventures(venture_ids uuid[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  DELETE FROM public.founder_members WHERE venture_id = ANY(venture_ids);
  DELETE FROM public.positions WHERE venture_id = ANY(venture_ids);
  DELETE FROM public.trades WHERE venture_id = ANY(venture_ids);
  DELETE FROM public.orders_primary WHERE venture_id = ANY(venture_ids);
  DELETE FROM public.ventures WHERE id = ANY(venture_ids);

  RETURN json_build_object('success', true, 'deleted_count', array_length(venture_ids, 1));
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_vwap3_for_venture(venture_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    vwap_price NUMERIC;
BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN NULL
            ELSE SUM(qty * price_per_share) / SUM(qty)
        END
    INTO vwap_price
    FROM (
        SELECT qty, price_per_share
        FROM trades
        WHERE venture_id = venture_uuid
        ORDER BY created_at DESC
        LIMIT 3
    ) recent_trades;
    
    UPDATE ventures 
    SET last_vwap_price = vwap_price,
        updated_at = NOW()
    WHERE id = venture_uuid;
    
    RETURN vwap_price;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_recalc_vwap()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    PERFORM calculate_vwap3_for_venture(NEW.venture_id);
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_primary_order(p_game_id uuid, p_venture_id uuid, p_qty integer, p_price_per_share numeric, p_auto_accept_min_price numeric DEFAULT NULL::numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant participants%ROWTYPE;
  v_venture ventures%ROWTYPE;
  v_game games%ROWTYPE;
  v_order_id UUID;
  v_total_cost NUMERIC;
BEGIN
  SELECT * INTO v_participant FROM participants WHERE game_id = p_game_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User is not a participant in this game');
  END IF;
  
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF v_game.status != 'open' THEN
    RETURN json_build_object('error', 'Game is not open for trading');
  END IF;
  
  SELECT * INTO v_venture FROM ventures WHERE id = p_venture_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Venture not found');
  END IF;
  
  IF p_qty <= 0 OR p_qty > v_venture.primary_shares_remaining THEN
    RETURN json_build_object('error', 'Invalid quantity');
  END IF;
  
  IF p_price_per_share <= 0 OR p_price_per_share > v_game.max_price_per_share THEN
    RETURN json_build_object('error', 'Invalid price per share');
  END IF;
  
  v_total_cost := p_qty * p_price_per_share;
  IF v_total_cost > v_participant.current_cash THEN
    RETURN json_build_object('error', 'Insufficient funds');
  END IF;
  
  INSERT INTO orders_primary (game_id, venture_id, buyer_participant_id, qty, price_per_share, auto_accept_min_price)
  VALUES (p_game_id, p_venture_id, v_participant.id, p_qty, p_price_per_share, p_auto_accept_min_price)
  RETURNING id INTO v_order_id;
  
  IF p_auto_accept_min_price IS NOT NULL AND p_price_per_share >= p_auto_accept_min_price THEN
    PERFORM decide_primary_order(v_order_id, 'accepted', v_participant.id);
  END IF;
  
  RETURN json_build_object('success', true, 'order_id', v_order_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decide_primary_order(p_order_id uuid, p_decision text, p_decided_by_participant_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order orders_primary%ROWTYPE;
  v_venture ventures%ROWTYPE;
  v_buyer participants%ROWTYPE;
  v_founder_member founder_members%ROWTYPE;
  v_trade_id UUID;
BEGIN
  SELECT * INTO v_order FROM orders_primary WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;
  
  IF v_order.status != 'pending' THEN
    RETURN json_build_object('error', 'Order is not pending');
  END IF;
  
  SELECT * INTO v_venture FROM ventures WHERE id = v_order.venture_id;
  
  IF p_decided_by_participant_id IS NULL THEN
    SELECT * INTO v_founder_member
    FROM founder_members fm
    JOIN participants p ON fm.participant_id = p.id
    WHERE fm.venture_id = v_order.venture_id AND p.user_id = auth.uid() AND fm.can_manage = true;
    
    IF NOT FOUND THEN
      RETURN json_build_object('error', 'Only venture founders can decide on orders');
    END IF;
    v_founder_member.participant_id := v_founder_member.participant_id;
  ELSE
    v_founder_member.participant_id := p_decided_by_participant_id;
  END IF;
  
  UPDATE orders_primary SET status = p_decision::order_status, decided_by_participant_id = v_founder_member.participant_id, updated_at = now() WHERE id = p_order_id;
  
  IF p_decision = 'accepted' THEN
    SELECT * INTO v_buyer FROM participants WHERE id = v_order.buyer_participant_id;
    
    IF v_buyer.current_cash < (v_order.qty * v_order.price_per_share) THEN
      UPDATE orders_primary SET status = 'canceled' WHERE id = p_order_id;
      RETURN json_build_object('error', 'Buyer has insufficient funds');
    END IF;
    
    IF v_venture.primary_shares_remaining < v_order.qty THEN
      UPDATE orders_primary SET status = 'canceled' WHERE id = p_order_id;
      RETURN json_build_object('error', 'Venture has insufficient shares');
    END IF;
    
    UPDATE participants SET current_cash = current_cash - (v_order.qty * v_order.price_per_share) WHERE id = v_order.buyer_participant_id;
    UPDATE ventures SET primary_shares_remaining = primary_shares_remaining - v_order.qty WHERE id = v_order.venture_id;
    
    INSERT INTO trades (game_id, venture_id, seller_participant_id, buyer_participant_id, qty, price_per_share, market_type)
    VALUES (v_order.game_id, v_order.venture_id, NULL, v_order.buyer_participant_id, v_order.qty, v_order.price_per_share, 'primary')
    RETURNING id INTO v_trade_id;
    
    INSERT INTO positions (participant_id, venture_id, qty_total, avg_cost)
    VALUES (v_order.buyer_participant_id, v_order.venture_id, v_order.qty, v_order.price_per_share)
    ON CONFLICT (participant_id, venture_id)
    DO UPDATE SET
      avg_cost = ((positions.qty_total * positions.avg_cost) + (v_order.qty * v_order.price_per_share)) / (positions.qty_total + v_order.qty),
      qty_total = positions.qty_total + v_order.qty,
      updated_at = now();
    
    PERFORM calculate_vwap3_for_venture(v_order.venture_id);
  END IF;
  
  RETURN json_build_object('success', true, 'status', p_decision);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_venture_leaderboard(p_game_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, game_id uuid, name text, logo_url text, last_vwap_price numeric, total_shares integer, market_cap numeric, shares_sold integer, type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        v.id, v.game_id, v.name, v.logo_url, v.last_vwap_price, v.total_shares,
        COALESCE((v.last_vwap_price * (v.total_shares)::numeric), (0)::numeric) AS market_cap,
        (v.total_shares - v.primary_shares_remaining) AS shares_sold,
        v.type
    FROM ventures v
    WHERE 
        (EXISTS (SELECT 1 FROM games g WHERE g.id = v.game_id AND g.owner_user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM participants p WHERE p.game_id = v.game_id AND p.user_id = auth.uid()))
        AND (p_game_id IS NULL OR v.game_id = p_game_id)
    ORDER BY COALESCE((v.last_vwap_price * (v.total_shares)::numeric), (0)::numeric) DESC NULLS LAST;
END;
$function$;