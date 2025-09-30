# Supabase Setup Guide for Credit Economy

## Step 1: Check Your Current Database

First, let's see what tables you already have. Go to your Supabase dashboard:

1. **Open Supabase Dashboard** → Your Project → **SQL Editor**
2. **Run this query** to see your current tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Step 2: Create Missing Tables

Based on your code, you need these tables. Run these SQL commands **one by one**:

### A. Create `credit_transactions` table (if it doesn't exist):

```sql
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'bonus', 'penalty')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### B. Create `leaderboard` table (if it doesn't exist):

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0,
  school_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### C. Create `followers` table (if it doesn't exist):

```sql
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);
```

### D. Create `post_votes` table (if it doesn't exist):

```sql
CREATE TABLE IF NOT EXISTS post_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

## Step 3: Add Missing Columns to Users Table

Check if your `users` table has these columns. If not, add them:

```sql
-- Add level_name column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_name TEXT DEFAULT 'Novice';

-- Add level_points column if it doesn't exist  
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_points INTEGER DEFAULT 1;

-- Update existing users to have proper level info
UPDATE users 
SET 
  level_name = 'Novice',
  level_points = 1
WHERE level_name IS NULL OR level_points IS NULL;
```

## Step 4: Create Database Functions

Now run the **main functions**. Copy and paste this entire block:

```sql
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
```

## Step 5: Create Helper Functions

Run these additional functions:

```sql
-- Function to get total credits earned
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
```

## Step 6: Create Indexes for Performance

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_credits ON leaderboard(credits DESC);
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
```

## Step 7: Test the Setup

Run this test query to make sure everything works:

```sql
-- Test the functions
SELECT get_total_credits_earned('your-user-id-here');
SELECT check_user_credits('your-user-id-here', 100);
```

## Step 8: Update Your App

The credit economy system is now ready! Your app will automatically:

1. **Award credits** when users upload resources
2. **Track levels** based on total credits earned
3. **Update leaderboards** in real-time
4. **Handle transactions** atomically

## Troubleshooting

### If you get errors:

1. **"Table doesn't exist"**: Make sure you created all the tables first
2. **"Function already exists"**: That's fine, the `CREATE OR REPLACE` will update it
3. **"Permission denied"**: Make sure you're running as the database owner

### To check if everything worked:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check functions exist  
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

## Next Steps

1. **Test the system** by uploading a resource
2. **Check the leaderboard** updates
3. **Verify level progression** works
4. **Implement download costs** when ready

The credit economy is now fully functional! 🎉
