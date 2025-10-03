-- Enable Realtime for AI Chat Tables
-- Run this in your Supabase SQL Editor to enable realtime subscriptions for AI chats

-- Enable realtime for ai_chat_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_chat_sessions;

-- Enable realtime for ai_chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_chat_messages;

-- Verify realtime is enabled for AI chat tables
SELECT schemaname, tablename, hasrealtime 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('ai_chat_sessions', 'ai_chat_messages')
ORDER BY tablename;

