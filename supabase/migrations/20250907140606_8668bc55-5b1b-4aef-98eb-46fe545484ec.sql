-- Create storage bucket for startup logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'startup-logos', 
  'startup-logos', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Create RLS policies for startup logos
CREATE POLICY "Public can view startup logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'startup-logos');

CREATE POLICY "Game owners can upload startup logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'startup-logos' 
    AND EXISTS (
      SELECT 1 FROM startups s 
      WHERE s.slug = (storage.foldername(name))[1] 
      AND is_game_owner(s.game_id)
    )
  );

CREATE POLICY "Game owners can update startup logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'startup-logos' 
    AND EXISTS (
      SELECT 1 FROM startups s 
      WHERE s.slug = (storage.foldername(name))[1] 
      AND is_game_owner(s.game_id)
    )
  );

-- Enable realtime for key tables
ALTER TABLE startups REPLICA IDENTITY FULL;
ALTER TABLE trades REPLICA IDENTITY FULL;  
ALTER TABLE games REPLICA IDENTITY FULL;
ALTER TABLE positions REPLICA IDENTITY FULL;
ALTER TABLE orders_primary REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE startups;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE positions;
ALTER PUBLICATION supabase_realtime ADD TABLE orders_primary;

-- Create function for secondary market trades
CREATE OR REPLACE FUNCTION create_secondary_trade_request(
  p_game_id UUID,
  p_startup_id UUID,
  p_buyer_email TEXT,
  p_qty INTEGER,
  p_price_per_share NUMERIC
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_seller_participant participants%ROWTYPE;
  v_buyer_participant participants%ROWTYPE;
  v_seller_position positions%ROWTYPE;
  v_game games%ROWTYPE;
  v_notification_id UUID;
BEGIN
  -- Get seller (current user)
  SELECT * INTO v_seller_participant
  FROM participants 
  WHERE game_id = p_game_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'You are not a participant in this game');
  END IF;

  -- Get buyer by email
  SELECT p.* INTO v_buyer_participant
  FROM participants p
  JOIN users u ON p.user_id = u.id
  WHERE p.game_id = p_game_id 
    AND (u.first_name || ' ' || u.last_name ILIKE '%' || p_buyer_email || '%' 
         OR u.id::text = p_buyer_email);
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Buyer not found in this game');
  END IF;

  -- Check game allows secondary trading
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF NOT v_game.allow_secondary THEN
    RETURN json_build_object('error', 'Secondary trading not allowed in this game');
  END IF;

  -- Check seller has enough shares
  SELECT * INTO v_seller_position
  FROM positions 
  WHERE participant_id = v_seller_participant.id AND startup_id = p_startup_id;
  
  IF NOT FOUND OR v_seller_position.qty_total < p_qty THEN
    RETURN json_build_object('error', 'Insufficient shares to sell');
  END IF;

  -- Check buyer has enough cash
  IF v_buyer_participant.current_cash < (p_qty * p_price_per_share) THEN
    RETURN json_build_object('error', 'Buyer has insufficient funds');
  END IF;

  -- Create notification for trade request
  INSERT INTO notifications (
    game_id,
    to_participant_id,
    from_participant_id,
    type,
    payload
  ) VALUES (
    p_game_id,
    v_buyer_participant.id,
    v_seller_participant.id,
    'secondary_trade_request',
    json_build_object(
      'startup_id', p_startup_id,
      'qty', p_qty,
      'price_per_share', p_price_per_share,
      'seller_id', v_seller_participant.id
    )
  ) RETURNING id INTO v_notification_id;

  RETURN json_build_object('success', true, 'notification_id', v_notification_id);
END;
$$;

-- Create function to accept secondary trade
CREATE OR REPLACE FUNCTION accept_secondary_trade(
  p_notification_id UUID
) RETURNS JSON
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_notification notifications%ROWTYPE;
  v_buyer_participant participants%ROWTYPE;
  v_seller_participant participants%ROWTYPE;
  v_seller_position positions%ROWTYPE;
  v_trade_data JSONB;
  v_startup_id UUID;
  v_qty INTEGER;
  v_price_per_share NUMERIC;
  v_total_cost NUMERIC;
  v_trade_id UUID;
BEGIN
  -- Get notification
  SELECT * INTO v_notification FROM notifications WHERE id = p_notification_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trade request not found');
  END IF;

  -- Check user is the intended recipient
  SELECT * INTO v_buyer_participant
  FROM participants 
  WHERE id = v_notification.to_participant_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Unauthorized to accept this trade');
  END IF;

  -- Extract trade data
  v_trade_data := v_notification.payload;
  v_startup_id := (v_trade_data->>'startup_id')::UUID;
  v_qty := (v_trade_data->>'qty')::INTEGER;
  v_price_per_share := (v_trade_data->>'price_per_share')::NUMERIC;
  v_total_cost := v_qty * v_price_per_share;

  -- Get seller
  SELECT * INTO v_seller_participant
  FROM participants 
  WHERE id = (v_trade_data->>'seller_id')::UUID;

  -- Verify seller still has shares
  SELECT * INTO v_seller_position
  FROM positions 
  WHERE participant_id = v_seller_participant.id AND startup_id = v_startup_id;
  
  IF NOT FOUND OR v_seller_position.qty_total < v_qty THEN
    RETURN json_build_object('error', 'Seller no longer has enough shares');
  END IF;

  -- Verify buyer still has cash
  IF v_buyer_participant.current_cash < v_total_cost THEN
    RETURN json_build_object('error', 'Insufficient funds');
  END IF;

  -- Execute trade
  -- Transfer cash
  UPDATE participants 
  SET current_cash = current_cash - v_total_cost
  WHERE id = v_buyer_participant.id;

  UPDATE participants 
  SET current_cash = current_cash + v_total_cost
  WHERE id = v_seller_participant.id;

  -- Transfer shares
  UPDATE positions 
  SET qty_total = qty_total - v_qty
  WHERE participant_id = v_seller_participant.id AND startup_id = v_startup_id;

  -- Update or create buyer position
  INSERT INTO positions (participant_id, startup_id, qty_total, avg_cost)
  VALUES (
    v_buyer_participant.id,
    v_startup_id,
    v_qty,
    v_price_per_share
  )
  ON CONFLICT (participant_id, startup_id)
  DO UPDATE SET
    avg_cost = ((positions.qty_total * positions.avg_cost) + (v_qty * v_price_per_share)) / (positions.qty_total + v_qty),
    qty_total = positions.qty_total + v_qty,
    updated_at = now();

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
    v_notification.game_id,
    v_startup_id,
    v_seller_participant.id,
    v_buyer_participant.id,
    v_qty,
    v_price_per_share,
    'secondary'
  ) RETURNING id INTO v_trade_id;

  -- Mark notification as accepted
  UPDATE notifications 
  SET status = 'accepted' 
  WHERE id = p_notification_id;

  -- Recalculate VWAP
  PERFORM calculate_vwap3_for_startup(v_startup_id);

  RETURN json_build_object('success', true, 'trade_id', v_trade_id);
END;
$$;