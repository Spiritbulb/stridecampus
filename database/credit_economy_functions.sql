-- Credit Economy Database Functions
-- This file contains the SQL functions needed for the credit economy system

-- Function to process credit transactions atomically
CREATE OR REPLACE FUNCTION process_credit_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_category TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_new_credit_balance INTEGER,
  p_new_level_name TEXT,
  p_new_level_points INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the credit transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    category,
    description,
    reference_id,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_category,
    p_description,
    p_reference_id,
    p_metadata,
    NOW()
  );
  
  -- Update user's credits and level information
  UPDATE users 
  SET 
    credits = p_new_credit_balance,
    level_name = p_new_level_name,
    level_points = p_new_level_points,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update leaderboard if user is verified
  UPDATE leaderboard 
  SET 
    credits = p_new_credit_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If leaderboard entry doesn't exist and user is verified, create it
  INSERT INTO leaderboard (user_id, credits, school_domain, created_at, updated_at)
  SELECT 
    p_user_id, 
    p_new_credit_balance, 
    u.school_domain, 
    NOW(), 
    NOW()
  FROM users u
  WHERE u.id = p_user_id 
    AND u.is_verified = true
    AND NOT EXISTS (SELECT 1 FROM leaderboard WHERE user_id = p_user_id);
    
END;
$$;

-- Function to create transaction and update credits (existing function, keeping for compatibility)
CREATE OR REPLACE FUNCTION create_transaction_and_update_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_new_credit_balance INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the credit transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    reference_id,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    CASE 
      WHEN p_amount > 0 THEN 'earn'
      ELSE 'spend'
    END,
    p_description,
    p_type,
    p_reference_id,
    p_metadata,
    NOW()
  );
  
  -- Update user's credits
  UPDATE users 
  SET 
    credits = p_new_credit_balance,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update leaderboard if user is verified
  UPDATE leaderboard 
  SET 
    credits = p_new_credit_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
END;
$$;

-- Function to get user's total credits earned
CREATE OR REPLACE FUNCTION get_total_credits_earned(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_earned INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_earned
  FROM credit_transactions
  WHERE user_id = p_user_id AND type = 'earn';
  
  RETURN total_earned;
END;
$$;

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION check_user_credits(p_user_id UUID, p_required_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits
  INTO current_credits
  FROM users
  WHERE id = p_user_id;
  
  RETURN COALESCE(current_credits, 0) >= p_required_amount;
END;
$$;

-- Function to calculate file download cost based on size
CREATE OR REPLACE FUNCTION calculate_file_download_cost(p_file_size_bytes BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  size_mb NUMERIC;
  min_cost INTEGER := 50;
  max_cost INTEGER := 250;
  min_size_mb NUMERIC := 1;
  max_size_mb NUMERIC := 10;
  ratio NUMERIC;
  cost_range INTEGER;
BEGIN
  size_mb := p_file_size_bytes / (1024.0 * 1024.0);
  
  -- Files under 1MB = min cost
  IF size_mb <= min_size_mb THEN
    RETURN min_cost;
  END IF;
  
  -- Files over 10MB = max cost
  IF size_mb >= max_size_mb THEN
    RETURN max_cost;
  END IF;
  
  -- Linear interpolation
  ratio := (size_mb - min_size_mb) / (max_size_mb - min_size_mb);
  cost_range := max_cost - min_cost;
  
  RETURN ROUND(min_cost + (ratio * cost_range));
END;
$$;

-- Trigger to automatically update leaderboard when user verification status changes
CREATE OR REPLACE FUNCTION handle_user_verification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If user becomes verified, add to leaderboard
  IF NEW.is_verified = true AND OLD.is_verified = false THEN
    INSERT INTO leaderboard (user_id, credits, school_domain, created_at, updated_at)
    VALUES (NEW.id, NEW.credits, NEW.school_domain, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      credits = NEW.credits,
      updated_at = NOW();
  END IF;
  
  -- If user becomes unverified, remove from leaderboard
  IF NEW.is_verified = false AND OLD.is_verified = true THEN
    DELETE FROM leaderboard WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for user verification changes
DROP TRIGGER IF EXISTS user_verification_trigger ON users;
CREATE TRIGGER user_verification_trigger
  AFTER UPDATE OF is_verified ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_verification_change();

-- Function to process resource purchase with commission
CREATE OR REPLACE FUNCTION process_resource_purchase(
  p_buyer_id UUID,
  p_resource_id UUID,
  p_cost INTEGER,
  p_commission_rate NUMERIC DEFAULT 0.20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resource_owner_id UUID;
  commission_amount INTEGER;
  buyer_credits INTEGER;
  owner_credits INTEGER;
  result JSONB;
BEGIN
  -- Get resource owner and buyer's current credits
  SELECT user_id INTO resource_owner_id
  FROM library
  WHERE id = p_resource_id;
  
  IF resource_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Resource not found');
  END IF;
  
  -- Check if buyer has enough credits (only for paid resources)
  SELECT credits INTO buyer_credits
  FROM users
  WHERE id = p_buyer_id;
  
  IF p_cost > 0 AND buyer_credits < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;
  
  -- Calculate commission (rounded to nearest integer) - only for paid resources
  commission_amount := CASE 
    WHEN p_cost > 0 THEN ROUND(p_cost * p_commission_rate)
    ELSE 0
  END;
  
  -- Get owner's current credits
  SELECT credits INTO owner_credits
  FROM users
  WHERE id = resource_owner_id;
  
  -- Process the purchase transaction (only if there's a cost)
  IF p_cost > 0 THEN
    PERFORM process_credit_transaction(
      p_buyer_id,
      p_cost,
      'spend',
      'resource_purchase',
      'Purchased resource from library',
      'purchase_' || p_resource_id,
      jsonb_build_object('resource_id', p_resource_id, 'cost', p_cost),
      buyer_credits - p_cost,
      'Novice', -- Will be recalculated properly in the function
      1
    );
  END IF;
  
  -- Process commission payment to owner (only if there's a commission)
  IF commission_amount > 0 THEN
    PERFORM process_credit_transaction(
      resource_owner_id,
      commission_amount,
      'earn',
      'resource_commission',
      'Commission from resource purchase',
      'commission_' || p_resource_id,
      jsonb_build_object('resource_id', p_resource_id, 'commission', commission_amount, 'buyer_id', p_buyer_id),
      owner_credits + commission_amount,
      'Novice', -- Will be recalculated properly in the function
      1
    );
  END IF;
  
  -- Add resource to buyer's archive
  INSERT INTO user_archive (user_id, resource_id, purchased_at, cost_paid, commission_paid)
  VALUES (p_buyer_id, p_resource_id, NOW(), p_cost, commission_amount)
  ON CONFLICT (user_id, resource_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'cost', p_cost,
    'commission', commission_amount,
    'buyer_credits_remaining', buyer_credits - p_cost,
    'owner_credits_gained', commission_amount
  );
END;
$$;

-- Function to get user's archived resources
CREATE OR REPLACE FUNCTION get_user_archive(p_user_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  resource_id UUID,
  resource_data JSONB,
  purchased_at TIMESTAMP WITH TIME ZONE,
  cost_paid INTEGER,
  commission_paid INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.resource_id,
    jsonb_build_object(
      'id', l.id,
      'original_name', l.original_name,
      'description', l.description,
      'resource_type', l.resource_type,
      'file_type', l.file_type,
      'file_size', l.file_size,
      'subject', l.subject,
      'tags', l.tags,
      'url', l.url,
      'youtube_url', l.youtube_url,
      'created_at', l.created_at,
      'users', jsonb_build_object(
        'full_name', u.full_name,
        'school_name', u.school_name,
        'username', u.username,
        'checkmark', u.checkmark
      )
    ) as resource_data,
    ua.purchased_at,
    ua.cost_paid,
    ua.commission_paid
  FROM user_archive ua
  JOIN library l ON ua.resource_id = l.id
  JOIN users u ON l.user_id = u.id
  WHERE ua.user_id = p_user_id
  ORDER BY ua.purchased_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to check if user has purchased a resource
CREATE OR REPLACE FUNCTION has_user_purchased_resource(p_user_id UUID, p_resource_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_archive 
    WHERE user_id = p_user_id AND resource_id = p_resource_id
  );
END;
$$;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_category ON credit_transactions(category);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_credits ON leaderboard(credits DESC);
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_archive_user_id ON user_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_user_archive_resource_id ON user_archive(resource_id);
CREATE INDEX IF NOT EXISTS idx_user_archive_purchased_at ON user_archive(purchased_at DESC);
