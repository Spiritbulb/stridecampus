-- Row Level Security policies for comment_votes table
-- Run this in your Supabase SQL Editor to fix the 406 error

-- Enable RLS on comment_votes table
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all comment votes (for counting)
CREATE POLICY "Users can view comment votes" ON comment_votes
  FOR SELECT USING (true);

-- Policy: Users can insert their own comment votes
CREATE POLICY "Users can insert their own comment votes" ON comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comment votes
CREATE POLICY "Users can update their own comment votes" ON comment_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own comment votes
CREATE POLICY "Users can delete their own comment votes" ON comment_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_user ON comment_votes(comment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_vote_type ON comment_votes(vote_type);

