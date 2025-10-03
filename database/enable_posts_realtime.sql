-- Enable Realtime for Posts, Votes, and Comments
-- Run this in your Supabase SQL Editor to enable realtime subscriptions

-- Enable realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Enable realtime for post_votes table
ALTER PUBLICATION supabase_realtime ADD TABLE post_votes;

-- Enable realtime for comment_votes table
ALTER PUBLICATION supabase_realtime ADD TABLE comment_votes;

-- Enable realtime for comments table
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Enable realtime for post_shares table (if it exists)
ALTER PUBLICATION supabase_realtime ADD TABLE post_shares;

-- Verify realtime is enabled for all tables
SELECT schemaname, tablename, hasrealtime 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('posts', 'post_votes', 'comment_votes', 'comments', 'post_shares')
ORDER BY tablename;

