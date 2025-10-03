-- Row Level Security policies for AI Chat tables
-- Run this in your Supabase SQL Editor to set up proper RLS policies

-- Enable RLS on ai_chat_sessions table (if not already enabled)
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_chat_messages table (if not already enabled)
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own AI chat sessions" ON ai_chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own AI chat sessions" ON ai_chat_sessions;
DROP POLICY IF EXISTS "Users can update their own AI chat sessions" ON ai_chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own AI chat sessions" ON ai_chat_sessions;

DROP POLICY IF EXISTS "Users can view messages from their own sessions" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their own sessions" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their own sessions" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can delete messages from their own sessions" ON ai_chat_messages;

-- AI Chat Sessions Policies
CREATE POLICY "Users can view their own AI chat sessions" ON ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI chat sessions" ON ai_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI chat sessions" ON ai_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI chat sessions" ON ai_chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- AI Chat Messages Policies
CREATE POLICY "Users can view messages from their own sessions" ON ai_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions 
      WHERE id = ai_chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their own sessions" ON ai_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions 
      WHERE id = ai_chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their own sessions" ON ai_chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions 
      WHERE id = ai_chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their own sessions" ON ai_chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions 
      WHERE id = ai_chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

-- Create additional indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_updated ON ai_chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_created ON ai_chat_messages(session_id, created_at ASC);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('ai_chat_sessions', 'ai_chat_messages')
ORDER BY tablename, policyname;

