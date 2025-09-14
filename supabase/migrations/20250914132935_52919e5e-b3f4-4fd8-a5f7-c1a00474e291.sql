-- Add missing secondary trade functions
CREATE OR REPLACE FUNCTION public.create_secondary_trade_request(p_game_id uuid, p_venture_id uuid, p_buyer_email text, p_qty integer, p_price_per_share numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_seller_participant participants%ROWTYPE;
  v_buyer_participant participants%ROWTYPE;
  v_seller_position positions%ROWTYPE;
  v_game games%ROWTYPE;
  v_notification_id UUID;
BEGIN
  SELECT * INTO v_seller_participant FROM participants WHERE game_id = p_game_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'You are not a participant in this game');
  END IF;

  SELECT p.* INTO v_buyer_participant
  FROM participants p JOIN users u ON p.user_id = u.id
  WHERE p.game_id = p_game_id 
    AND (u.first_name || ' ' || u.last_name ILIKE '%' || p_buyer_email || '%' OR u.id::text = p_buyer_email);
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Buyer not found in this game');
  END IF;

  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF NOT v_game.allow_secondary THEN
    RETURN json_build_object('error', 'Secondary trading not allowed in this game');
  END IF;

  SELECT * INTO v_seller_position FROM positions WHERE participant_id = v_seller_participant.id AND venture_id = p_venture_id;
  IF NOT FOUND OR v_seller_position.qty_total < p_qty THEN
    RETURN json_build_object('error', 'Insufficient shares to sell');
  END IF;

  IF v_buyer_participant.current_cash < (p_qty * p_price_per_share) THEN
    RETURN json_build_object('error', 'Buyer has insufficient funds');
  END IF;

  INSERT INTO notifications (game_id, to_participant_id, from_participant_id, type, payload)
  VALUES (
    p_game_id, v_buyer_participant.id, v_seller_participant.id, 'secondary_trade_request',
    json_build_object('venture_id', p_venture_id, 'qty', p_qty, 'price_per_share', p_price_per_share, 'seller_id', v_seller_participant.id)
  ) RETURNING id INTO v_notification_id;

  RETURN json_build_object('success', true, 'notification_id', v_notification_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_secondary_trade(p_notification_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_notification notifications%ROWTYPE;
  v_buyer_participant participants%ROWTYPE;
  v_seller_participant participants%ROWTYPE;
  v_seller_position positions%ROWTYPE;
  v_trade_data JSONB;
  v_venture_id UUID;
  v_qty INTEGER;
  v_price_per_share NUMERIC;
  v_total_cost NUMERIC;
  v_trade_id UUID;
BEGIN
  SELECT * INTO v_notification FROM notifications WHERE id = p_notification_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trade request not found');
  END IF;

  SELECT * INTO v_buyer_participant FROM participants WHERE id = v_notification.to_participant_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Unauthorized to accept this trade');
  END IF;

  v_trade_data := v_notification.payload;
  v_venture_id := (v_trade_data->>'venture_id')::UUID;
  v_qty := (v_trade_data->>'qty')::INTEGER;
  v_price_per_share := (v_trade_data->>'price_per_share')::NUMERIC;
  v_total_cost := v_qty * v_price_per_share;

  SELECT * INTO v_seller_participant FROM participants WHERE id = (v_trade_data->>'seller_id')::UUID;

  SELECT * INTO v_seller_position FROM positions WHERE participant_id = v_seller_participant.id AND venture_id = v_venture_id;
  IF NOT FOUND OR v_seller_position.qty_total < v_qty THEN
    RETURN json_build_object('error', 'Seller no longer has enough shares');
  END IF;

  IF v_buyer_participant.current_cash < v_total_cost THEN
    RETURN json_build_object('error', 'Insufficient funds');
  END IF;

  UPDATE participants SET current_cash = current_cash - v_total_cost WHERE id = v_buyer_participant.id;
  UPDATE participants SET current_cash = current_cash + v_total_cost WHERE id = v_seller_participant.id;
  UPDATE positions SET qty_total = qty_total - v_qty WHERE participant_id = v_seller_participant.id AND venture_id = v_venture_id;

  INSERT INTO positions (participant_id, venture_id, qty_total, avg_cost)
  VALUES (v_buyer_participant.id, v_venture_id, v_qty, v_price_per_share)
  ON CONFLICT (participant_id, venture_id)
  DO UPDATE SET
    avg_cost = ((positions.qty_total * positions.avg_cost) + (v_qty * v_price_per_share)) / (positions.qty_total + v_qty),
    qty_total = positions.qty_total + v_qty, updated_at = now();

  INSERT INTO trades (game_id, venture_id, seller_participant_id, buyer_participant_id, qty, price_per_share, market_type)
  VALUES (v_notification.game_id, v_venture_id, v_seller_participant.id, v_buyer_participant.id, v_qty, v_price_per_share, 'secondary')
  RETURNING id INTO v_trade_id;

  UPDATE notifications SET status = 'accepted' WHERE id = p_notification_id;
  PERFORM calculate_vwap3_for_venture(v_venture_id);

  RETURN json_build_object('success', true, 'trade_id', v_trade_id);
END;
$function$;