-- Function to accept secondary trade request
CREATE OR REPLACE FUNCTION accept_secondary_trade(
  p_notification_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_notification notifications%ROWTYPE;
  v_seller_id UUID;
  v_buyer_id UUID;
  v_venture_id UUID;
  v_qty INTEGER;
  v_price NUMERIC;
  v_total_cost NUMERIC;
  v_seller_position positions%ROWTYPE;
  v_buyer_participant participants%ROWTYPE;
BEGIN
  -- Get notification details
  SELECT * INTO v_notification
  FROM notifications
  WHERE id = p_notification_id AND type = 'trade_request' AND status = 'unread';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trade request not found or already processed');
  END IF;
  
  -- Extract trade details from payload
  v_seller_id := v_notification.to_participant_id;
  v_buyer_id := v_notification.from_participant_id;
  v_venture_id := (v_notification.payload->>'venture_id')::UUID;
  v_qty := (v_notification.payload->>'qty')::INTEGER;
  v_price := (v_notification.payload->>'price_per_share')::NUMERIC;
  v_total_cost := v_qty * v_price;
  
  -- Get seller's position
  SELECT * INTO v_seller_position
  FROM positions
  WHERE participant_id = v_seller_id AND venture_id = v_venture_id;
  
  IF NOT FOUND OR v_seller_position.qty_total < v_qty THEN
    RETURN json_build_object('error', 'Seller does not have enough shares');
  END IF;
  
  -- Get buyer's participant info
  SELECT * INTO v_buyer_participant
  FROM participants
  WHERE id = v_buyer_id;
  
  IF v_buyer_participant.current_cash < v_total_cost THEN
    RETURN json_build_object('error', 'Buyer does not have enough cash');
  END IF;
  
  -- Update buyer's cash
  UPDATE participants
  SET current_cash = current_cash - v_total_cost
  WHERE id = v_buyer_id;
  
  -- Update seller's cash
  UPDATE participants
  SET current_cash = current_cash + v_total_cost
  WHERE id = v_seller_id;
  
  -- Update seller's position
  UPDATE positions
  SET qty_total = qty_total - v_qty
  WHERE participant_id = v_seller_id AND venture_id = v_venture_id;
  
  -- Create or update buyer's position
  INSERT INTO positions (participant_id, venture_id, qty_total, avg_cost)
  VALUES (v_buyer_id, v_venture_id, v_qty, v_price)
  ON CONFLICT (participant_id, venture_id)
  DO UPDATE SET
    qty_total = positions.qty_total + v_qty,
    avg_cost = ((positions.qty_total * positions.avg_cost) + (v_qty * v_price)) / (positions.qty_total + v_qty);
  
  -- Create trade record
  INSERT INTO trades (game_id, venture_id, seller_participant_id, buyer_participant_id, qty, price_per_share, market_type)
  VALUES (v_notification.game_id, v_venture_id, v_seller_id, v_buyer_id, v_qty, v_price, 'secondary');
  
  -- Mark notification as read
  UPDATE notifications
  SET status = 'read'
  WHERE id = p_notification_id;
  
  -- Delete seller position if quantity is 0
  DELETE FROM positions
  WHERE participant_id = v_seller_id AND venture_id = v_venture_id AND qty_total = 0;
  
  RETURN json_build_object('success', true, 'message', 'Trade completed successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'Failed to complete trade: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create secondary trade request
CREATE OR REPLACE FUNCTION create_secondary_trade_request(
  p_game_id UUID,
  p_venture_id UUID,
  p_buyer_participant_id UUID,
  p_seller_email TEXT,
  p_qty INTEGER,
  p_price_per_share NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_seller_participant_id UUID;
  v_seller_user_id UUID;
  v_buyer_participant participants%ROWTYPE;
  v_total_cost NUMERIC;
  v_game games%ROWTYPE;
BEGIN
  v_total_cost := p_qty * p_price_per_share;
  
  -- Validate game allows secondary trading
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF NOT v_game.allow_secondary THEN
    RETURN json_build_object('error', 'Secondary trading is not enabled for this game');
  END IF;
  
  -- Find seller by email
  SELECT u.id INTO v_seller_user_id
  FROM users u
  JOIN participants p ON p.user_id = u.id
  WHERE u.email = p_seller_email AND p.game_id = p_game_id AND p.status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Seller not found in this game');
  END IF;
  
  -- Get seller participant ID
  SELECT id INTO v_seller_participant_id
  FROM participants
  WHERE user_id = v_seller_user_id AND game_id = p_game_id;
  
  -- Validate buyer has enough cash
  SELECT * INTO v_buyer_participant
  FROM participants
  WHERE id = p_buyer_participant_id;
  
  IF v_buyer_participant.current_cash < v_total_cost THEN
    RETURN json_build_object('error', 'Insufficient funds');
  END IF;
  
  -- Create notification for seller
  INSERT INTO notifications (
    game_id,
    to_participant_id,
    from_participant_id,
    type,
    payload,
    status
  ) VALUES (
    p_game_id,
    v_seller_participant_id,
    p_buyer_participant_id,
    'trade_request',
    json_build_object(
      'venture_id', p_venture_id,
      'qty', p_qty,
      'price_per_share', p_price_per_share,
      'total_cost', v_total_cost
    ),
    'unread'
  );
  
  RETURN json_build_object('success', true, 'message', 'Trade request sent successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'Failed to send trade request: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;