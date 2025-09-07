-- Create RPC function for creating primary orders
CREATE OR REPLACE FUNCTION create_primary_order(
  p_game_id UUID,
  p_startup_id UUID,
  p_qty INTEGER,
  p_price_per_share NUMERIC,
  p_auto_accept_min_price NUMERIC DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participant_id UUID;
  v_participant participants%ROWTYPE;
  v_startup startups%ROWTYPE;
  v_game games%ROWTYPE;
  v_order_id UUID;
  v_total_cost NUMERIC;
BEGIN
  -- Get current user's participant record
  SELECT * INTO v_participant
  FROM participants 
  WHERE game_id = p_game_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User is not a participant in this game');
  END IF;
  
  -- Get game info
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  
  IF v_game.status != 'open' THEN
    RETURN json_build_object('error', 'Game is not open for trading');
  END IF;
  
  -- Get startup info
  SELECT * INTO v_startup FROM startups WHERE id = p_startup_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Startup not found');
  END IF;
  
  -- Validate inputs
  IF p_qty <= 0 OR p_qty > v_startup.primary_shares_remaining THEN
    RETURN json_build_object('error', 'Invalid quantity');
  END IF;
  
  IF p_price_per_share <= 0 OR p_price_per_share > v_game.max_price_per_share THEN
    RETURN json_build_object('error', 'Invalid price per share');
  END IF;
  
  v_total_cost := p_qty * p_price_per_share;
  
  IF v_total_cost > v_participant.current_cash THEN
    RETURN json_build_object('error', 'Insufficient funds');
  END IF;
  
  -- Create the order
  INSERT INTO orders_primary (
    game_id,
    startup_id,
    buyer_participant_id,
    qty,
    price_per_share,
    auto_accept_min_price
  ) VALUES (
    p_game_id,
    p_startup_id,
    v_participant.id,
    p_qty,
    p_price_per_share,
    p_auto_accept_min_price
  ) RETURNING id INTO v_order_id;
  
  -- Check for auto-accept
  IF p_auto_accept_min_price IS NOT NULL AND p_price_per_share >= p_auto_accept_min_price THEN
    -- Auto-accept the order
    PERFORM decide_primary_order(v_order_id, 'accepted', v_participant.id);
  END IF;
  
  RETURN json_build_object('success', true, 'order_id', v_order_id);
END;
$$;

-- Create RPC function for deciding primary orders (founder admin only)
CREATE OR REPLACE FUNCTION decide_primary_order(
  p_order_id UUID,
  p_decision TEXT,
  p_decided_by_participant_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders_primary%ROWTYPE;
  v_startup startups%ROWTYPE;
  v_buyer participants%ROWTYPE;
  v_founder_member founder_members%ROWTYPE;
  v_trade_id UUID;
BEGIN
  -- Get order
  SELECT * INTO v_order FROM orders_primary WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;
  
  IF v_order.status != 'pending' THEN
    RETURN json_build_object('error', 'Order is not pending');
  END IF;
  
  -- Get startup
  SELECT * INTO v_startup FROM startups WHERE id = v_order.startup_id;
  
  -- Check if current user is a founder with manage permissions (unless auto-accept)
  IF p_decided_by_participant_id IS NULL THEN
    SELECT * INTO v_founder_member
    FROM founder_members fm
    JOIN participants p ON fm.participant_id = p.id
    WHERE fm.startup_id = v_order.startup_id 
      AND p.user_id = auth.uid()
      AND fm.can_manage = true;
    
    IF NOT FOUND THEN
      RETURN json_build_object('error', 'Only startup founders can decide on orders');
    END IF;
    
    v_founder_member.participant_id := v_founder_member.participant_id;
  ELSE
    v_founder_member.participant_id := p_decided_by_participant_id;
  END IF;
  
  -- Update order status
  UPDATE orders_primary 
  SET 
    status = p_decision::order_status,
    decided_by_participant_id = v_founder_member.participant_id,
    updated_at = now()
  WHERE id = p_order_id;
  
  -- If accepted, execute the trade
  IF p_decision = 'accepted' THEN
    -- Get buyer info
    SELECT * INTO v_buyer FROM participants WHERE id = v_order.buyer_participant_id;
    
    -- Check if buyer still has enough cash
    IF v_buyer.current_cash < (v_order.qty * v_order.price_per_share) THEN
      -- Cancel the order due to insufficient funds
      UPDATE orders_primary SET status = 'canceled' WHERE id = p_order_id;
      RETURN json_build_object('error', 'Buyer has insufficient funds');
    END IF;
    
    -- Check if startup still has enough shares
    IF v_startup.primary_shares_remaining < v_order.qty THEN
      -- Cancel the order due to insufficient shares
      UPDATE orders_primary SET status = 'canceled' WHERE id = p_order_id;
      RETURN json_build_object('error', 'Startup has insufficient shares');
    END IF;
    
    -- Execute the trade
    -- Debit buyer cash
    UPDATE participants 
    SET current_cash = current_cash - (v_order.qty * v_order.price_per_share)
    WHERE id = v_order.buyer_participant_id;
    
    -- Reduce startup shares
    UPDATE startups 
    SET primary_shares_remaining = primary_shares_remaining - v_order.qty
    WHERE id = v_order.startup_id;
    
    -- Create trade record
    INSERT INTO trades (
      game_id,
      startup_id,
      seller_participant_id,
      buyer_participant_id,
      qty,
      price_per_share,
      market_type
    ) VALUES (
      v_order.game_id,
      v_order.startup_id,
      NULL, -- Primary market has no seller
      v_order.buyer_participant_id,
      v_order.qty,
      v_order.price_per_share,
      'primary'
    ) RETURNING id INTO v_trade_id;
    
    -- Update or create position
    INSERT INTO positions (participant_id, startup_id, qty_total, avg_cost)
    VALUES (
      v_order.buyer_participant_id,
      v_order.startup_id,
      v_order.qty,
      v_order.price_per_share
    )
    ON CONFLICT (participant_id, startup_id)
    DO UPDATE SET
      avg_cost = ((positions.qty_total * positions.avg_cost) + (v_order.qty * v_order.price_per_share)) / (positions.qty_total + v_order.qty),
      qty_total = positions.qty_total + v_order.qty,
      updated_at = now();
    
    -- Recalculate VWAP
    PERFORM calculate_vwap3_for_startup(v_order.startup_id);
  END IF;
  
  RETURN json_build_object('success', true, 'status', p_decision);
END;
$$;