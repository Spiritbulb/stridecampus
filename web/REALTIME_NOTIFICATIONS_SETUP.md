# Realtime Database Notifications Setup Guide

This guide will help you set up the new realtime notification system where Expo receives notifications directly from your database instead of going through the API.

## Overview

The new system works as follows:
1. **App creates notification** → Inserts into `notifications` table
2. **Database trigger fires** → Queues notification in `notification_queue` table
3. **Notification processor service** → Sends to Expo Push API
4. **Mobile app listens** → Receives via Supabase realtime subscription
5. **Expo displays notification** → Shows local notification to user

## Setup Steps

### 1. Database Setup

Run the SQL commands in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database-triggers.sql
```

This will:
- Create the `notification_queue` table
- Create the `queue_expo_push_notification()` function
- Set up the database trigger
- Enable realtime for both tables

### 2. Notification Processor Service

The notification processor is a Node.js service that processes the queue and sends notifications to Expo.

#### Setup the service:

```bash
# Create a new directory for the service
mkdir notification-processor
cd notification-processor

# Copy the files
cp ../notification-processor.js .
cp ../notification-processor-package.json package.json

# Install dependencies
npm install

# Set up environment variables
echo "SUPABASE_URL=https://laqocctbodlexjkfpfwh.supabase.co" > .env
echo "SUPABASE_SERVICE_KEY=your_service_role_key_here" >> .env
```

#### Run the service:

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

#### Deploy the service:

You can deploy this service to:
- **Vercel** (as a serverless function)
- **Railway** (as a background service)
- **DigitalOcean App Platform**
- **AWS Lambda** (with scheduled triggers)
- **Heroku** (with a worker dyno)

### 3. Mobile App Updates

The mobile app has been updated to:
- Listen for database notifications via Supabase realtime
- Send user ID to the native app from the WebView
- Display notifications immediately when received from database

### 4. Web App Updates

The web app now uses the new `NotificationService` which:
- Inserts notifications directly into the database
- Triggers the database trigger automatically
- Works with both mobile and web notifications

## Key Files Modified

### Mobile App (`mobile/Stride/App.tsx`)
- Added Supabase realtime subscription for notifications
- Added user ID communication with WebView
- Added database notification listener

### Web App
- **`src/utils/notificationService.ts`** - New notification service
- **`src/hooks/useChat.ts`** - Updated to use new service
- **`src/app/admin/announcements/page.tsx`** - Updated to use new service

### Database
- **`database-triggers.sql`** - Database trigger setup
- **`notification-processor.js`** - Queue processor service

## Benefits of the New System

1. **Real-time**: Notifications are delivered instantly via database triggers
2. **Reliable**: Queue system ensures notifications aren't lost
3. **Scalable**: Can handle high volumes of notifications
4. **Unified**: Same system works for both mobile and web
5. **Efficient**: No API calls needed for notification creation

## Testing the System

### 1. Test Database Trigger
```sql
-- Insert a test notification
INSERT INTO notifications (user_id, recipient_id, sender_id, type, title, message, is_read)
VALUES ('your-user-id', 'your-user-id', 'your-user-id', 'test', 'Test', 'Database trigger test', false);
```

Check if a record appears in `notification_queue` table.

### 2. Test Notification Processor
Run the processor service and check the logs for:
- Queue processing
- Expo API calls
- Success/failure status updates

### 3. Test Mobile App
1. Open the mobile app
2. Send a test notification from admin panel
3. Check if notification appears on device
4. Check mobile app logs for realtime subscription status

### 4. Test Web App
1. Open web app
2. Send a test notification
3. Check if in-app notification appears
4. Check browser console for realtime events

## Monitoring

### Database Monitoring
```sql
-- Check notification queue status
SELECT status, COUNT(*) as count 
FROM notification_queue 
GROUP BY status;

-- Check recent notifications
SELECT * FROM notification_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

### Service Monitoring
The notification processor logs:
- Queue processing status
- Expo API responses
- Error messages
- Processing statistics

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check if database trigger is enabled
   - Verify notification processor is running
   - Check user's push notification preferences

2. **Mobile app not receiving notifications**
   - Check Supabase realtime subscription status
   - Verify user ID is being sent from WebView
   - Check mobile app logs for errors

3. **Queue not processing**
   - Check if notification processor service is running
   - Verify Supabase credentials
   - Check for API rate limits

4. **Database trigger not firing**
   - Verify trigger is created and enabled
   - Check function permissions
   - Look for trigger errors in Supabase logs

### Debug Commands

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_queue_expo_push_notification';

-- Check function exists
SELECT * FROM information_schema.routines 
WHERE routine_name = 'queue_expo_push_notification';

-- Test trigger manually
SELECT queue_expo_push_notification();
```

## Migration from Old System

The old API-based system (`/api/push-notifications`) is still available but not used by the new components. You can:

1. Keep both systems running during transition
2. Gradually migrate components to use `NotificationService`
3. Eventually remove the old API endpoint

## Security Considerations

1. **Service Key**: Keep the Supabase service key secure
2. **Queue Access**: Only the processor service should access the queue
3. **Rate Limiting**: Consider implementing rate limits for notification creation
4. **User Permissions**: Verify user permissions before creating notifications

## Performance Optimization

1. **Batch Processing**: The processor handles up to 100 notifications per batch
2. **Indexing**: Database indexes are created for optimal query performance
3. **Cleanup**: Old processed notifications can be cleaned up periodically
4. **Monitoring**: Track processing times and success rates
