// Quick SQL runner for archive functions
// Copy and paste this SQL into your Supabase SQL editor

const ARCHIVE_FUNCTIONS_SQL = `
-- Test the existing process_credit_transaction function first
SELECT public.process_credit_transaction(
  '00000000-0000-0000-0000-000000000000'::uuid,
  10,
  'credit'::text,
  'bonus'::text,
  'test transaction'::text,
  NULL::text,
  '{}'::jsonb,
  100,
  'silver'::text,
  50
);

-- Function to check if user has purchased a resource (updated for int8 resource_id)
CREATE OR REPLACE FUNCTION has_user_purchased_resource(p_user_id UUID, p_resource_id BIGINT)
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

-- Function to process resource purchase with commission (updated for int8 resource_id)
CREATE OR REPLACE FUNCTION process_resource_purchase(
  p_buyer_id UUID,
  p_resource_id BIGINT,
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
  buyer_level_info RECORD;
  owner_level_info RECORD;
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
    -- Get buyer's level info for transaction
    SELECT level_name, level_points INTO buyer_level_info
    FROM users WHERE id = p_buyer_id;
    
    PERFORM process_credit_transaction(
      p_user_id := p_buyer_id,
      p_amount := p_cost,
      p_type := 'spend'::TEXT,
      p_category := 'resource_purchase'::TEXT,
      p_description := 'Purchased resource from library'::TEXT,
      p_reference_id := ('purchase_' || p_resource_id)::TEXT,
      p_metadata := jsonb_build_object('resource_id', p_resource_id, 'cost', p_cost),
      p_new_credit_balance := buyer_credits - p_cost,
      p_new_level_name := buyer_level_info.level_name,
      p_new_level_points := buyer_level_info.level_points
    );
  END IF;
  
  -- Process commission payment to owner (only if there's a commission)
  IF commission_amount > 0 THEN
    -- Get owner's level info for transaction
    SELECT level_name, level_points INTO owner_level_info
    FROM users WHERE id = resource_owner_id;
    
    PERFORM process_credit_transaction(
      p_user_id := resource_owner_id,
      p_amount := commission_amount,
      p_type := 'earn'::TEXT,
      p_category := 'resource_commission'::TEXT,
      p_description := 'Commission from resource purchase'::TEXT,
      p_reference_id := ('commission_' || p_resource_id)::TEXT,
      p_metadata := jsonb_build_object('resource_id', p_resource_id, 'commission', commission_amount, 'buyer_id', p_buyer_id),
      p_new_credit_balance := owner_credits + commission_amount,
      p_new_level_name := owner_level_info.level_name,
      p_new_level_points := owner_level_info.level_points
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

-- Function to get user's archived resources (updated for int8 resource_id)
CREATE OR REPLACE FUNCTION get_user_archive(p_user_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  resource_id BIGINT,
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

-- Create user_archive table if it doesn't exist (updated for int8 resource_id)
CREATE TABLE IF NOT EXISTS user_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id BIGINT NOT NULL REFERENCES library(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cost_paid INTEGER DEFAULT 0,
  commission_paid INTEGER DEFAULT 0,
  UNIQUE(user_id, resource_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_archive_user_id ON user_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_user_archive_resource_id ON user_archive(resource_id);
CREATE INDEX IF NOT EXISTS idx_user_archive_purchased_at ON user_archive(purchased_at DESC);
`;

console.log('📋 Copy this SQL and run it in your Supabase SQL editor:');
console.log('================================================');
console.log(ARCHIVE_FUNCTIONS_SQL);
console.log('================================================');
console.log('✅ This will:');
console.log('1. Test the existing process_credit_transaction function');
console.log('2. Create the archive functions for int8 resource IDs');
console.log('3. Create the user_archive table');
console.log('4. Add performance indexes');
console.log('');
console.log('🚀 After running this, your YouTube video archive will work!');
