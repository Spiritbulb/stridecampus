-- Database triggers for automatic Expo push notifications
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create a function to queue Expo push notifications
CREATE OR REPLACE FUNCTION queue_expo_push_notification()
RETURNS TRIGGER AS $$
DECLARE
    user_token TEXT;
    user_push_enabled BOOLEAN;
    notification_data JSONB;
BEGIN
    -- Get user's push token and preferences
    SELECT expo_push_token, push_notifications
    INTO user_token, user_push_enabled
    FROM users
    WHERE id = NEW.user_id;
    
    -- Only proceed if user has push notifications enabled and has a token
    IF user_push_enabled AND user_token IS NOT NULL AND user_token != '' THEN
        -- Prepare notification data for the queue
        notification_data := jsonb_build_object(
            'to', user_token,
            'title', NEW.title,
            'body', NEW.message,
            'data', COALESCE(NEW.data, '{}'::jsonb) || jsonb_build_object(
                'type', NEW.type,
                'notificationId', NEW.id,
                'senderId', NEW.sender_id,
                'timestamp', NEW.created_at
            ),
            'channelId', CASE 
                WHEN NEW.type = 'message' THEN 'messages'
                WHEN NEW.type IN ('follow', 'like', 'comment') THEN 'social'
                WHEN NEW.type IN ('event', 'announcement') THEN 'events'
                WHEN NEW.type IN ('academic', 'study') THEN 'academic'
                ELSE 'default'
            END
        );
        
        -- Insert into queue table for processing by the notification processor service
        INSERT INTO notification_queue (
            user_id,
            notification_id,
            expo_push_token,
            notification_data,
            created_at
        ) VALUES (
            NEW.user_id,
            NEW.id,
            user_token,
            notification_data,
            NOW()
        );
        
        -- Log the trigger execution
        RAISE NOTICE 'Expo push notification queued for user % with notification %', NEW.user_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create notification queue table (optional - for reliability and batch processing)
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL,
    notification_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trigger_queue_expo_push_notification ON notifications;
CREATE TRIGGER trigger_queue_expo_push_notification
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION queue_expo_push_notification();

-- 4. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON notification_queue(created_at);

-- 5. Note: The notification queue will be processed by the external Node.js service
-- Run the notification-processor.js service to process pending notifications

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION queue_expo_push_notification() TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_queue TO authenticated;

-- 7. Enable realtime for the notifications table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_queue;
