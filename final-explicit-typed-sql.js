// Final SQL with ALL parameters explicitly typed
// Run this in the Supabase SQL editor

const FINAL_EXPLICIT_TYPED_SQL = `
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
    RETURN jsonb_build_object('success'::TEXT, false::BOOLEAN, 'error'::TEXT, 'Resource not found'::TEXT);
  END IF;
  
  -- Check if buyer has enough credits (only for paid resources)
  SELECT credits INTO buyer_credits
  FROM users
  WHERE id = p_buyer_id;
  
  IF p_cost > 0 AND buyer_credits < p_cost THEN
    RETURN jsonb_build_object('success'::TEXT, false::BOOLEAN, 'error'::TEXT, 'Insufficient credits'::TEXT);
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
      p_user_id := p_buyer_id::UUID,
      p_amount := p_cost::INTEGER,
      p_type := 'spend'::TEXT,
      p_category := 'resource_purchase'::TEXT,
      p_description := 'Purchased resource from library'::TEXT,
      p_reference_id := ('purchase_' || p_resource_id)::TEXT,
      p_metadata := jsonb_build_object('resource_id'::TEXT, p_resource_id::BIGINT, 'cost'::TEXT, p_cost::INTEGER),
      p_new_credit_balance := (buyer_credits - p_cost)::INTEGER,
      p_new_level_name := buyer_level_info.level_name::TEXT,
      p_new_level_points := buyer_level_info.level_points::INTEGER
    );
  END IF;
  
  -- Process commission payment to owner (only if there's a commission)
  IF commission_amount > 0 THEN
    -- Get owner's level info for transaction
    SELECT level_name, level_points INTO owner_level_info
    FROM users WHERE id = resource_owner_id;
    
    PERFORM process_credit_transaction(
      p_user_id := resource_owner_id::UUID,
      p_amount := commission_amount::INTEGER,
      p_type := 'earn'::TEXT,
      p_category := 'resource_commission'::TEXT,
      p_description := 'Commission from resource purchase'::TEXT,
      p_reference_id := ('commission_' || p_resource_id)::TEXT,
      p_metadata := jsonb_build_object('resource_id'::TEXT, p_resource_id::BIGINT, 'commission'::TEXT, commission_amount::INTEGER, 'buyer_id'::TEXT, p_buyer_id::UUID),
      p_new_credit_balance := (owner_credits + commission_amount)::INTEGER,
      p_new_level_name := owner_level_info.level_name::TEXT,
      p_new_level_points := owner_level_info.level_points::INTEGER
    );
  END IF;
  
  -- Add resource to buyer's archive
  INSERT INTO user_archive (user_id, resource_id, purchased_at, cost_paid, commission_paid)
  VALUES (p_buyer_id::UUID, p_resource_id::BIGINT, NOW()::TIMESTAMP WITH TIME ZONE, p_cost::INTEGER, commission_amount::INTEGER)
  ON CONFLICT (user_id, resource_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success'::TEXT, true::BOOLEAN,
    'cost'::TEXT, p_cost::INTEGER,
    'commission'::TEXT, commission_amount::INTEGER,
    'buyer_credits_remaining'::TEXT, (buyer_credits - p_cost)::INTEGER,
    'owner_credits_gained'::TEXT, commission_amount::INTEGER
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
    ua.resource_id::BIGINT,
    jsonb_build_object(
      'id'::TEXT, l.id::BIGINT,
      'original_name'::TEXT, l.original_name::TEXT,
      'description'::TEXT, l.description::TEXT,
      'resource_type'::TEXT, l.resource_type::TEXT,
      'file_type'::TEXT, l.file_type::TEXT,
      'file_size'::TEXT, l.file_size::BIGINT,
      'subject'::TEXT, l.subject::TEXT,
      'tags'::TEXT, l.tags::TEXT,
      'url'::TEXT, l.url::TEXT,
      'youtube_url'::TEXT, l.youtube_url::TEXT,
      'created_at'::TEXT, l.created_at::TIMESTAMP WITH TIME ZONE,
      'users'::TEXT, jsonb_build_object(
        'full_name'::TEXT, u.full_name::TEXT,
        'school_name'::TEXT, u.school_name::TEXT,
        'username'::TEXT, u.username::TEXT,
        'checkmark'::TEXT, u.checkmark::BOOLEAN
      )
    )::JSONB as resource_data,
    ua.purchased_at::TIMESTAMP WITH TIME ZONE,
    ua.cost_paid::INTEGER,
    ua.commission_paid::INTEGER
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

console.log('🎯 FINAL SQL with ALL parameters explicitly typed:');
console.log('================================================');
console.log(FINAL_EXPLICIT_TYPED_SQL);
console.log('================================================');
console.log('✅ Every parameter is now explicitly typed:');
console.log('- UUID parameters: ::UUID');
console.log('- TEXT parameters: ::TEXT');
console.log('- INTEGER parameters: ::INTEGER');
console.log('- BIGINT parameters: ::BIGINT');
console.log('- BOOLEAN parameters: ::BOOLEAN');
console.log('- JSONB parameters: ::JSONB');
console.log('- TIMESTAMP parameters: ::TIMESTAMP WITH TIME ZONE');
console.log('');
console.log('🚀 This should eliminate all type ambiguity errors!');
