// Utility functions for testing the notification system
import { sendPushNotification, pushNotificationService } from './pushNotificationService';

export interface NotificationTest {
  name: string;
  description: string;
  test: () => Promise<any>;
}

export const notificationTests: NotificationTest[] = [
  {
    name: 'Test Direct Message Notification',
    description: 'Sends a test message notification to simulate a new chat message',
    test: async () => {
      return await fetch('/api/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test'
        })
      });
    }
  },
  {
    name: 'Test Follower Notification',
    description: 'Simulates a new follower notification',
    test: async () => {
      // This would need a real user ID in production
      return await fetch('/api/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          targetType: 'user',
          targetId: 'test-user-id',
          message: {
            title: 'New Follower! 🎉',
            body: 'Someone started following you on Stride Campus',
            data: { type: 'follow' },
            channelId: 'social'
          }
        })
      });
    }
  },
  {
    name: 'Test Campus Announcement',
    description: 'Sends a campus-wide announcement notification',
    test: async () => {
      return await fetch('/api/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          targetType: 'all',
          message: {
            title: '📢 Campus Announcement',
            body: 'This is a test announcement for all Stride Campus users!',
            data: { type: 'announcement' },
            channelId: 'events'
          }
        })
      });
    }
  },
  {
    name: 'Test Study Reminder',
    description: 'Sends a study reminder notification',
    test: async () => {
      return await fetch('/api/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          targetType: 'user',
          targetId: 'test-user-id',
          message: {
            title: '📚 Study Reminder',
            body: 'Don\'t forget to review your notes for tomorrow\'s exam!',
            data: { type: 'study_reminder', subject: 'Computer Science' },
            channelId: 'academic'
          }
        })
      });
    }
  }
];

// Helper function to test notification system status
export async function checkNotificationSystemStatus() {
  try {
    const response = await fetch('/api/push-notifications', {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      status: data,
      message: 'Notification system is accessible'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check notification system status'
    };
  }
}

// Helper function to validate push token format
export function validatePushToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token) || /^ExpoPushToken\[.+\]$/.test(token);
}

// Helper function to simulate different notification scenarios
export class NotificationSimulator {
  static async simulateNewMessage(senderId: string, receiverId: string, messageContent: string) {
    return await fetch('/api/push-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'message',
        recipientId: receiverId,
        senderName: 'Test User',
        messagePreview: messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent
      })
    });
  }

  static async simulateNewFollower(followerId: string, followedUserId: string) {
    return await fetch('/api/push-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'follower',
        followedUserId: followedUserId,
        followerName: 'Test Follower'
      })
    });
  }

  static async simulateCampusEvent(campusDomain: string, eventTitle: string) {
    return await fetch('/api/push-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'campus_event',
        schoolDomain: campusDomain,
        eventTitle: eventTitle,
        eventTime: new Date().toLocaleString()
      })
    });
  }

  static async simulateCustomNotification(targetType: 'user' | 'users' | 'campus' | 'all', targetId: string, title: string, body: string, customData = {}) {
    return await fetch('/api/push-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'custom',
        targetType,
        targetId: targetType === 'all' ? undefined : targetId,
        message: {
          title,
          body,
          data: { type: 'custom', ...customData },
          channelId: 'default'
        }
      })
    });
  }
}

// Debug helper to log notification system info
export function logNotificationSystemInfo() {
  console.group('🔔 Notification System Info');
  
  // Check if we're in mobile app
  const isInExpoWebView = /StrideCampusApp/.test(navigator.userAgent);
  console.log('Environment:', isInExpoWebView ? 'Mobile App (Expo)' : 'Web Browser');
  
  // Check web notification support
  if (typeof window !== 'undefined') {
    console.log('Web Notifications Supported:', 'Notification' in window);
    console.log('Service Worker Supported:', 'serviceWorker' in navigator);
    console.log('Push Manager Supported:', 'PushManager' in window);
    
    if ('Notification' in window) {
      console.log('Notification Permission:', Notification.permission);
    }
  }
  
  // Check for React Native WebView
  console.log('React Native WebView Available:', typeof (window as any).ReactNativeWebView !== 'undefined');
  
  console.groupEnd();
}
