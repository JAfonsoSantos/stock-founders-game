-- Rename startups table to ventures and add type column
ALTER TABLE public.startups RENAME TO ventures;

-- Add type column to distinguish between startup/idea/project
ALTER TABLE public.ventures ADD COLUMN type TEXT NOT NULL DEFAULT 'startup';

-- Add check constraint for valid types
ALTER TABLE public.ventures ADD CONSTRAINT ventures_type_check 
CHECK (type IN ('startup', 'idea', 'project'));

-- Update all foreign key references
ALTER TABLE public.founder_members RENAME COLUMN startup_id TO venture_id;
ALTER TABLE public.positions RENAME COLUMN startup_id TO venture_id;
ALTER TABLE public.trades RENAME COLUMN startup_id TO venture_id;
ALTER TABLE public.orders_primary RENAME COLUMN startup_id TO venture_id;

-- Update indexes
DROP INDEX IF EXISTS idx_trades_startup_created;
CREATE INDEX idx_trades_venture_created ON public.trades (venture_id, created_at DESC);

-- Update RLS policies for ventures table
DROP POLICY IF EXISTS "startups_owner_manage" ON public.ventures;
DROP POLICY IF EXISTS "startups_participants_select" ON public.ventures;

CREATE POLICY "ventures_owner_manage" ON public.ventures
FOR ALL USING (is_game_owner(game_id));

CREATE POLICY "ventures_participants_select" ON public.ventures
FOR SELECT USING (is_user_participant_in_game(game_id));

-- Update RPC functions
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
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Delete related records first (to avoid foreign key constraints)
  DELETE FROM public.founder_members WHERE venture_id = ANY(venture_ids);
  DELETE FROM public.positions WHERE venture_id = ANY(venture_ids);
  DELETE FROM public.trades WHERE venture_id = ANY(venture_ids);
  DELETE FROM public.orders_primary WHERE venture_id = ANY(venture_ids);

  -- Delete ventures
  DELETE FROM public.ventures WHERE id = ANY(venture_ids);

  RETURN json_build_object('success', true, 'deleted_count', array_length(venture_ids, 1));
END;
$function$;

-- Update calculate_vwap3_for_startup function
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

-- Update trigger function
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

-- Update create_primary_order function
CREATE OR REPLACE FUNCTION public.create_primary_order(p_game_id uuid, p_venture_id uuid, p_qty integer, p_price_per_share numeric, p_auto_accept_min_price numeric DEFAULT NULL::numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant_id UUID;
  v_participant participants%ROWTYPE;
  v_venture ventures%ROWTYPE;
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
  
  -- Get venture info
  SELECT * INTO v_venture FROM ventures WHERE id = p_venture_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Venture not found');
  END IF;
  
  -- Validate inputs
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
  
  -- Create the order
  INSERT INTO orders_primary (
    game_id,
    venture_id,
    buyer_participant_id,
    qty,
    price_per_share,
    auto_accept_min_price
  ) VALUES (
    p_game_id,
    p_venture_id,
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
$function$;

-- Update decide_primary_order function
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
  -- Get order
  SELECT * INTO v_order FROM orders_primary WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;
  
  IF v_order.status != 'pending' THEN
    RETURN json_build_object('error', 'Order is not pending');
  END IF;
  
  -- Get venture
  SELECT * INTO v_venture FROM ventures WHERE id = v_order.venture_id;
  
  -- Check if current user is a founder with manage permissions (unless auto-accept)
  IF p_decided_by_participant_id IS NULL THEN
    SELECT * INTO v_founder_member
    FROM founder_members fm
    JOIN participants p ON fm.participant_id = p.id
    WHERE fm.venture_id = v_order.venture_id 
      AND p.user_id = auth.uid()
      AND fm.can_manage = true;
    
    IF NOT FOUND THEN
      RETURN json_build_object('error', 'Only venture founders can decide on orders');
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
    
    -- Check if venture still has enough shares
    IF v_venture.primary_shares_remaining < v_order.qty THEN
      -- Cancel the order due to insufficient shares
      UPDATE orders_primary SET status = 'canceled' WHERE id = p_order_id;
      RETURN json_build_object('error', 'Venture has insufficient shares');
    END IF;
    
    -- Execute the trade
    -- Debit buyer cash
    UPDATE participants 
    SET current_cash = current_cash - (v_order.qty * v_order.price_per_share)
    WHERE id = v_order.buyer_participant_id;
    
    -- Reduce venture shares
    UPDATE ventures 
    SET primary_shares_remaining = primary_shares_remaining - v_order.qty
    WHERE id = v_order.venture_id;
    
    -- Create trade record
    INSERT INTO trades (
      game_id,
      venture_id,
      seller_participant_id,
      buyer_participant_id,
      qty,
      price_per_share,
      market_type
    ) VALUES (
      v_order.game_id,
      v_order.venture_id,
      NULL, -- Primary market has no seller
      v_order.buyer_participant_id,
      v_order.qty,
      v_order.price_per_share,
      'primary'
    ) RETURNING id INTO v_trade_id;
    
    -- Update or create position
    INSERT INTO positions (participant_id, venture_id, qty_total, avg_cost)
    VALUES (
      v_order.buyer_participant_id,
      v_order.venture_id,
      v_order.qty,
      v_order.price_per_share
    )
    ON CONFLICT (participant_id, venture_id)
    DO UPDATE SET
      avg_cost = ((positions.qty_total * positions.avg_cost) + (v_order.qty * v_order.price_per_share)) / (positions.qty_total + v_order.qty),
      qty_total = positions.qty_total + v_order.qty,
      updated_at = now();
    
    -- Recalculate VWAP
    PERFORM calculate_vwap3_for_venture(v_order.venture_id);
  END IF;
  
  RETURN json_build_object('success', true, 'status', p_decision);
END;
$function$;

-- Update secondary trade functions
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
  WHERE participant_id = v_seller_participant.id AND venture_id = p_venture_id;
  
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
      'venture_id', p_venture_id,
      'qty', p_qty,
      'price_per_share', p_price_per_share,
      'seller_id', v_seller_participant.id
    )
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
  -- Get notification
  SELECT * INTO v_notification FROM notifications WHERE id = p_notification_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trade request not found');
  END IF;

  -- Check user is the intended recipient
  SELECT * INTO v_buyer_participant
  FROM participants 
  WHERE id = v_notification.to_participant_id AND user_id = auth.uid();
  
  if NOT FOUND THEN
    RETURN json_build_object('error', 'Unauthorized to accept this trade');
  END IF;

  -- Extract trade data
  v_trade_data := v_notification.payload;
  v_venture_id := (v_trade_data->>'venture_id')::UUID;
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
  WHERE participant_id = v_seller_participant.id AND venture_id = v_venture_id;
  
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
  WHERE participant_id = v_seller_participant.id AND venture_id = v_venture_id;

  -- Update or create buyer position
  INSERT INTO positions (participant_id, venture_id, qty_total, avg_cost)
  VALUES (
    v_buyer_participant.id,
    v_venture_id,
    v_qty,
    v_price_per_share
  )
  ON CONFLICT (participant_id, venture_id)
  DO UPDATE SET
    avg_cost = ((positions.qty_total * positions.avg_cost) + (v_qty * v_price_per_share)) / (positions.qty_total + v_qty),
    qty_total = positions.qty_total + v_qty,
    updated_at = now();

  -- Create trade record
  INSERT INTO trades (
    game_id,
    venture_id,
    seller_participant_id,
    buyer_participant_id,
    qty,
    price_per_share,
    market_type
  ) VALUES (
    v_notification.game_id,
    v_venture_id,
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
  PERFORM calculate_vwap3_for_venture(v_venture_id);

  RETURN json_build_object('success', true, 'trade_id', v_trade_id);
END;
$function$;

-- Update leaderboard functions  
CREATE OR REPLACE FUNCTION public.get_venture_leaderboard(p_game_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, game_id uuid, name text, logo_url text, last_vwap_price numeric, total_shares integer, market_cap numeric, shares_sold integer, type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.game_id,
        v.name,
        v.logo_url,
        v.last_vwap_price,
        v.total_shares,
        COALESCE((v.last_vwap_price * (v.total_shares)::numeric), (0)::numeric) AS market_cap,
        (v.total_shares - v.primary_shares_remaining) AS shares_sold,
        v.type
    FROM ventures v
    WHERE 
        -- Security: Only show ventures from accessible games
        (EXISTS (SELECT 1 FROM games g WHERE g.id = v.game_id AND g.owner_user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM participants p WHERE p.game_id = v.game_id AND p.user_id = auth.uid()))
        AND (p_game_id IS NULL OR v.game_id = p_game_id)
    ORDER BY COALESCE((v.last_vwap_price * (v.total_shares)::numeric), (0)::numeric) DESC NULLS LAST;
END;
$function$;

-- Drop old startup functions
DROP FUNCTION IF EXISTS public.get_startup_leaderboard(uuid);
DROP FUNCTION IF EXISTS public.calculate_vwap3_for_startup(uuid);
DROP FUNCTION IF EXISTS public.get_all_startups_admin();
DROP FUNCTION IF EXISTS public.admin_delete_startups(uuid[]);