-- Enable Realtime for Chat Tables
-- Run this in your Supabase SQL Editor to enable realtime subscriptions

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for chats table  
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- Enable realtime for chat_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;

-- Verify realtime is enabled
SELECT schemaname, tablename, hasrealtime 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'chats', 'chat_participants');
