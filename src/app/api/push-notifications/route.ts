// app/api/push-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification, pushNotificationService } from '@/utils/pushNotificationService';
import { supabase } from '@/utils/supabaseClient';

// Helper function to send PWA notifications to users
async function sendPWANotificationToUser(userId: string, notification: {
  title: string;
  body: string;
  data?: any;
}) {
  try {
    // Create in-app notification record for PWA users
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        recipient_id: userId,
        sender_id: userId, // Self-sent for admin notifications
        type: notification.data?.type || 'admin',
        title: notification.title,
        message: notification.body,
        is_read: false
      });

    if (error) {
      console.error('Error creating PWA notification record:', error);
    }
  } catch (error) {
    console.error('Error sending PWA notification:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userInfo, ...params } = body;

    // Check admin authorization using user info from frontend
    if (!userInfo) {
      return NextResponse.json(
        { error: 'User information required' },
        { status: 400 }
      );
    }

    const isAdmin = userInfo.email?.endsWith('@stridecampus.com') || 
                   userInfo.role === 'admin' ||
                   // Temporary bypass for testing - REMOVE IN PRODUCTION
                   userInfo.id === 'your-user-id-here'; // Replace with your actual user ID

    // Debug logging
    console.log('🔍 API Admin Debug:', {
      userId: userInfo.id,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      emailEndsWithStrideCampus: userInfo.email?.endsWith('@stridecampus.com'),
      roleIsAdmin: userInfo.role === 'admin',
      isAdmin
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let result;

    switch (type) {
      case 'test':
        // Send test notification to current user
        result = await sendPushNotification.toUser(userInfo.id, {
          title: 'Test Notification 🎉',
          body: 'Push notifications are working perfectly!',
          data: { type: 'test' }
        });
        
        // Also send PWA notification for web users
        await sendPWANotificationToUser(userInfo.id, {
          title: 'Test Notification 🎉',
          body: 'Push notifications are working perfectly!',
          data: { type: 'test' }
        });
        break;

      case 'message':
        // Send message notification
        const { recipientId, senderName, messagePreview } = params;
        result = await sendPushNotification.newMessage(recipientId, senderName, messagePreview);
        
        // Also send PWA notification
        await sendPWANotificationToUser(recipientId, {
          title: `New message from ${senderName}`,
          body: messagePreview,
          data: { type: 'message' }
        });
        break;

      case 'interaction':
        // Send post interaction notification
        const { userId, interactionType, userName } = params;
        result = await sendPushNotification.postInteraction(userId, interactionType, userName);
        break;

      case 'follower':
        // Send new follower notification
        const { followedUserId, followerName } = params;
        result = await sendPushNotification.newFollower(followedUserId, followerName);
        
        // Also send PWA notification
        await sendPWANotificationToUser(followedUserId, {
          title: 'New follower!',
          body: `${followerName} started following you`,
          data: { type: 'follow' }
        });
        break;

      case 'campus_event':
        // Send campus-wide event notification
        const { schoolDomain, eventTitle, eventTime } = params;
        result = await sendPushNotification.campusEvent(schoolDomain, eventTitle, eventTime);
        break;

      case 'study_reminder':
        // Send study reminder
        const { studentId, subject, dueDate } = params;
        result = await sendPushNotification.studyReminder(studentId, subject, dueDate);
        break;

      case 'custom':
        // Send custom notification
        const { targetType, targetId, message } = params;
        
        if (targetType === 'user') {
          result = await pushNotificationService.sendToUser(targetId, message);
          // Also send PWA notification
          await sendPWANotificationToUser(targetId, message);
        } else if (targetType === 'users') {
          // Handle comma-separated user IDs
          const userIds = typeof targetId === 'string' ? targetId.split(',').map(id => id.trim()) : targetId;
          result = await pushNotificationService.sendToUsers(userIds, message);
          // Also send PWA notifications
          for (const userId of userIds) {
            await sendPWANotificationToUser(userId, message);
          }
        } else if (targetType === 'campus') {
          result = await pushNotificationService.sendToCampus(targetId, message);
          // For campus notifications, we'd need to get all users from that campus
          // This is a simplified version - you might want to enhance this
        } else if (targetType === 'all') {
          // Send to all users with push notifications enabled
          const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .eq('push_notifications', true)
            .not('expo_push_token', 'is', null);

          if (error) {
            throw new Error('Failed to fetch users for broadcast');
          }

          const userIds = users?.map(user => user.id) || [];
          result = await pushNotificationService.sendToUsers(userIds, message);
          
          // Also send PWA notifications to all users
          for (const userId of userIds) {
            await sendPWANotificationToUser(userId, message);
          }
        } else {
          return NextResponse.json(
            { error: 'Invalid target type' },
            { status: 400 }
          );
        }
        break;

      case 'announcement':
        // Send announcement to all or specific group
        const { announcementType, announcementTitle, announcementBody, announcementData } = params;
        
        let announcementResult;
        if (announcementType === 'all') {
          // Broadcast to all users
          const { data: allUsers, error: usersError } = await supabase
            .from('users')
            .select('id')
            .eq('push_notifications', true)
            .not('expo_push_token', 'is', null);

          if (usersError) {
            throw new Error('Failed to fetch users for announcement');
          }

          const allUserIds = allUsers?.map(user => user.id) || [];
          announcementResult = await pushNotificationService.sendToUsers(allUserIds, {
            title: announcementTitle,
            body: announcementBody,
            data: announcementData || { type: 'announcement' },
            channelId: 'events'
          });
        }
        result = announcementResult;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Push notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check notification status
export async function GET(request: NextRequest) {
  try {
    // This endpoint doesn't require authentication - it's just for checking system status
    return NextResponse.json({
      status: 'ok',
      message: 'Push notification API is running',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Push notification status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}