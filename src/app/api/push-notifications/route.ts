// app/api/push-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendPushNotification, pushNotificationService } from '@/utils/pushNotificationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, ...params } = body;

    let result;

    switch (type) {
      case 'test':
        // Send test notification to current user
        result = await sendPushNotification.toUser(session.user.id, {
          title: 'Test Notification 🎉',
          body: 'Push notifications are working perfectly!',
          data: { type: 'test' }
        });
        break;

      case 'message':
        // Send message notification
        const { recipientId, senderName, messagePreview } = params;
        result = await sendPushNotification.newMessage(recipientId, senderName, messagePreview);
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
        } else if (targetType === 'users') {
          result = await pushNotificationService.sendToUsers(targetId, message);
        } else if (targetType === 'campus') {
          result = await pushNotificationService.sendToCampus(targetId, message);
        } else {
          return NextResponse.json(
            { error: 'Invalid target type' },
            { status: 400 }
          );
        }
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
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's push notification settings
    const { data: user, error } = await supabase
      .from('users')
      .select('expo_push_token, push_notifications, email_notifications, marketing_emails')
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      pushEnabled: user.push_notifications && !!user.expo_push_token,
      emailEnabled: user.email_notifications,
      marketingEnabled: user.marketing_emails,
      hasValidToken: !!user.expo_push_token,
      tokenExists: !!user.expo_push_token
    });

  } catch (error) {
    console.error('Push notification status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}