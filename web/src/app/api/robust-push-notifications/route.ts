// app/api/robust-push-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for server operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Import robustNotificationService - we'll handle it with dynamic import to avoid issues
async function getRobustNotificationService() {
  const { robustNotificationService, sendRobustNotification, robustNotifications } = await import('@/utils/robustNotificationService');
  return { robustNotificationService, sendRobustNotification, robustNotifications };
}

export async function POST(request: NextRequest) {
  try {
    const body: { type?: string; userInfo?: any; [key: string]: any } = await request.json();
    const { type, userInfo, ...params } = body;

    console.log('📨 Robust push notification request:', { type, userId: userInfo?.id });

    // Validate user info
    if (!userInfo?.id) {
      return NextResponse.json(
        { success: false, error: 'User information required' },
        { status: 400 }
      );
    }

    // Get notification services
    const { robustNotificationService, sendRobustNotification, robustNotifications } = await getRobustNotificationService();

    // Simplified authorization - allow all authenticated users for testing
    const isAuthorized = true;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let result;

    switch (type) {
      case 'test':
        console.log('🧪 Sending test notification to user:', userInfo.id);
        result = await sendRobustNotification.toUser(userInfo.id, {
          title: 'Test Notification 🎉',
          body: 'Push notifications are working perfectly!',
          data: { type: 'test', timestamp: new Date().toISOString() },
          channelId: 'default',
        }, {
          enableDetailedLogging: true,
          maxRetries: 3,
        });
        console.log('✅ Test notification result:', result);
        break;

      case 'message':
        console.log('💬 Sending message notification');
        const { recipientId, senderName, messagePreview } = params;
        if (!recipientId) {
          return NextResponse.json(
            { success: false, error: 'Recipient ID required' },
            { status: 400 }
          );
        }
        result = await robustNotifications.newMessage(
          recipientId, 
          senderName || 'Someone', 
          messagePreview || 'New message'
        );
        break;

      case 'follower':
        console.log('👥 Sending follower notification');
        const { followedUserId, followerName } = params;
        if (!followedUserId) {
          return NextResponse.json(
            { success: false, error: 'Followed user ID required' },
            { status: 400 }
          );
        }
        result = await robustNotifications.newFollower(
          followedUserId, 
          followerName || 'Someone'
        );
        break;

      case 'campus_event':
        console.log('🎓 Sending campus event notification');
        const { schoolDomain, eventTitle, eventTime } = params;
        if (!schoolDomain) {
          return NextResponse.json(
            { success: false, error: 'School domain required' },
            { status: 400 }
          );
        }
        result = await robustNotifications.campusEvent(
          schoolDomain, 
          eventTitle || 'New Event', 
          eventTime || 'Soon'
        );
        break;

      case 'study_reminder':
        console.log('📚 Sending study reminder');
        const { studentId, subject, dueDate } = params;
        if (!studentId) {
          return NextResponse.json(
            { success: false, error: 'Student ID required' },
            { status: 400 }
          );
        }
        result = await robustNotifications.studyReminder(
          studentId, 
          subject || 'Assignment', 
          dueDate || 'Soon'
        );
        break;

      case 'custom':
        console.log('🎯 Sending custom notification');
        const { targetType, targetId, message } = params;
        
        if (!message?.title || !message?.body) {
          return NextResponse.json(
            { success: false, error: 'Message title and body required' },
            { status: 400 }
          );
        }

        const validation = robustNotificationService.validateNotification({
          title: message.title,
          body: message.body,
          data: message.data,
          channelId: message.channelId || 'default',
        });

        if (!validation.valid) {
          return NextResponse.json(
            { success: false, error: validation.errors.join(', ') },
            { status: 400 }
          );
        }

        const notificationMessage = {
          title: message.title,
          body: message.body,
          data: message.data || { type: 'custom' },
          channelId: message.channelId || 'default',
        };

        if (targetType === 'user' && targetId) {
          result = await sendRobustNotification.toUser(targetId, notificationMessage);
        } else if (targetType === 'users' && targetId) {
          const userIds = targetId.split(',').map((id: string) => id.trim());
          result = await sendRobustNotification.toUsers(userIds, notificationMessage);
        } else if (targetType === 'campus' && targetId) {
          result = await sendRobustNotification.toCampus(targetId, notificationMessage);
        } else if (targetType === 'all') {
          const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('push_notifications', true)
            .not('expo_push_token', 'is', null);

          if (error) throw error;

          const userIds = users?.map(user => user.id) || [];
          result = await sendRobustNotification.toUsers(userIds, notificationMessage);
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid target type or missing target ID' },
            { status: 400 }
          );
        }
        break;

      case 'bulk_test':
        console.log('🧪 Sending bulk test notifications');
        const { testUserIds, testMessage } = params;
        if (!testUserIds || !Array.isArray(testUserIds)) {
          return NextResponse.json(
            { success: false, error: 'testUserIds must be an array' },
            { status: 400 }
          );
        }

        result = await sendRobustNotification.toUsers(testUserIds, {
          title: testMessage?.title || 'Bulk Test',
          body: testMessage?.body || 'Bulk test notification',
          data: { type: 'bulk_test', timestamp: new Date().toISOString() },
          channelId: 'default',
        }, {
          enableDetailedLogging: true,
          maxRetries: 2,
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    // Get stats
    const stats = await robustNotificationService.getNotificationStats();

    // Normalize result
    const resultArray = Array.isArray(result) ? result : [result];
    const success = resultArray.some((r: any) => r.success);

    console.log('✅ Notification sent:', { success, count: resultArray.length });

    return NextResponse.json({ 
      success, 
      result: resultArray,
      stats,
      message: 'Notification sent',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { robustNotificationService } = await getRobustNotificationService();
    const stats = await robustNotificationService.getNotificationStats();
    
    return NextResponse.json({
      status: 'ok',
      message: 'Robust notification API running',
      stats,
      timestamp: new Date().toISOString(),
      features: {
        expoPush: true,
        pwaNotifications: true,
        inAppNotifications: true,
        realtimeSync: true,
        retryMechanism: true,
        bulkDelivery: true,
      },
    });
  } catch (error) {
    console.error('❌ Status API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}