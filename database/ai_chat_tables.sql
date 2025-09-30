-- AI Chat Sessions and Messages Tables for Supabase
-- This replaces the JSON database implementation with performance optimizations

-- Create AI chat sessions table
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  is_active BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI chat messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance-optimized indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_updated ON ai_chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_active ON ai_chat_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_message_count ON ai_chat_sessions(message_count);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_created ON ai_chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_is_user ON ai_chat_messages(is_user);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_active_updated ON ai_chat_sessions(user_id, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_user_created ON ai_chat_messages(session_id, is_user, created_at ASC);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_recent ON ai_chat_sessions(user_id, updated_at DESC) WHERE updated_at > NOW() - INTERVAL '30 days';
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_recent ON ai_chat_messages(session_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '7 days';

-- Create updated_at trigger for ai_chat_sessions
CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_sessions_updated_at();

-- Create function to update message count when messages are added/deleted
CREATE OR REPLACE FUNCTION update_ai_chat_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ai_chat_sessions 
    SET message_count = message_count + 1, updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ai_chat_sessions 
    SET message_count = message_count - 1, updated_at = NOW()
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update message count
CREATE TRIGGER trigger_update_ai_chat_session_message_count
  AFTER INSERT OR DELETE ON ai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_session_message_count();

-- Create function to ensure only one active session per user
CREATE OR REPLACE FUNCTION ensure_single_active_session()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a session as active, deactivate all other sessions for this user
  IF NEW.is_active = true THEN
    UPDATE ai_chat_sessions 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one active session per user
CREATE TRIGGER trigger_ensure_single_active_session
  BEFORE INSERT OR UPDATE ON ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_session();

-- Row Level Security (RLS) policies
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own AI chat sessions
CREATE POLICY "Users can view their own AI chat sessions" ON ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI chat sessions" ON ai_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI chat sessions" ON ai_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI chat sessions" ON ai_chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only access messages from their own sessions
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
