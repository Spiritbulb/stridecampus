// utils/pushNotificationService.ts
import { supabase } from './supabaseClient';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

export interface PushNotificationResult {
  success: boolean;
  id?: string;
  message?: string;
  details?: any;
}

class PushNotificationService {
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
  private readonly MAX_BATCH_SIZE = 100; // Expo's limit

  /**
   * Send a push notification to a single user
   */
  async sendToUser(userId: string, message: PushMessage): Promise<PushNotificationResult> {
    try {
      // Get user's push token
      const { data: user, error } = await supabase
        .from('users')
        .select('expo_push_token, push_notifications')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.push_notifications || !user.expo_push_token) {
        return { success: false, message: 'Push notifications not enabled for user' };
      }

      return await this.sendToToken(user.expo_push_token, message);
    } catch (error) {
      console.error('Error sending push notification to user:', error);
      return { success: false, message: 'Failed to send notification', details: error };
    }
  }

  /**
   * Send a push notification to multiple users
   */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<PushNotificationResult[]> {
    try {
      // Get push tokens for all users
      const { data: users, error } = await supabase
        .from('users')
        .select('id, expo_push_token, push_notifications')
        .in('id', userIds)
        .eq('push_notifications', true)
        .not('expo_push_token', 'is', null);

      if (error || !users) {
        return [{ success: false, message: 'Failed to fetch users' }];
      }

      const tokens = users.map(user => user.expo_push_token).filter(Boolean);
      return await this.sendToTokens(tokens, message);
    } catch (error) {
      console.error('Error sending push notifications to users:', error);
      return [{ success: false, message: 'Failed to send notifications', details: error }];
    }
  }

  /**
   * Send push notification to users by school/campus
   */
  async sendToCampus(schoolDomain: string, message: PushMessage): Promise<PushNotificationResult[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('expo_push_token')
        .eq('school_domain', schoolDomain)
        .eq('push_notifications', true)
        .not('expo_push_token', 'is', null);

      if (error || !users) {
        return [{ success: false, message: 'Failed to fetch campus users' }];
      }

      const tokens = users.map(user => user.expo_push_token).filter(Boolean);
      return await this.sendToTokens(tokens, message);
    } catch (error) {
      console.error('Error sending push notifications to campus:', error);
      return [{ success: false, message: 'Failed to send campus notifications', details: error }];
    }
  }

  /**
   * Send push notification to a single token
   */
  async sendToToken(token: string, message: PushMessage): Promise<PushNotificationResult> {
    console.log('📱 Attempting to send push notification to token:', token.substring(0, 20) + '...');
    
    if (!this.isValidExpoPushToken(token)) {
      console.error('❌ Invalid push token format:', token);
      return { success: false, message: 'Invalid push token format' };
    }

    const pushMessage = {
      to: token,
      sound: message.sound || 'default',
      title: message.title,
      body: message.body,
      data: message.data || {},
      badge: message.badge,
      priority: message.priority || 'default',
      channelId: message.channelId,
    };

    try {
      console.log('📤 Sending push notification to Expo:', {
        to: token.substring(0, 20) + '...',
        title: message.title,
        body: message.body,
        channelId: message.channelId
      });

      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushMessage),
      });

      const result = await response.json();
      console.log('📱 Expo push response:', result);

      if (result.data && result.data[0]) {
        const pushResult = result.data[0];
        if (pushResult.status === 'ok') {
          console.log('✅ Push notification sent successfully:', pushResult.id);
          return { 
            success: true, 
            id: pushResult.id,
            message: 'Notification sent successfully',
            details: pushResult
          };
        } else {
          console.error('❌ Push notification failed:', pushResult.message);
          return { 
            success: false, 
            message: pushResult.message || 'Failed to send notification',
            details: pushResult 
          };
        }
      }

      console.error('❌ Unexpected response format from Expo:', result);
      return { 
        success: false, 
        message: 'Unexpected response format from Expo push service',
        details: result 
      };
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return { 
        success: false, 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error 
      };
    }
  }

  /**
   * Send push notifications to multiple tokens (batched)
   */
  async sendToTokens(tokens: string[], message: PushMessage): Promise<PushNotificationResult[]> {
    const validTokens = tokens.filter(token => this.isValidExpoPushToken(token));
    
    if (validTokens.length === 0) {
      return [{ success: false, message: 'No valid push tokens provided' }];
    }

    const results: PushNotificationResult[] = [];
    
    // Process tokens in batches
    for (let i = 0; i < validTokens.length; i += this.MAX_BATCH_SIZE) {
      const batch = validTokens.slice(i, i + this.MAX_BATCH_SIZE);
      const batchResults = await this.sendBatch(batch, message);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Send a batch of push notifications
   */
  private async sendBatch(tokens: string[], message: PushMessage): Promise<PushNotificationResult[]> {
    const pushMessages = tokens.map(token => ({
      to: token,
      sound: message.sound || 'default',
      title: message.title,
      body: message.body,
      data: message.data || {},
      badge: message.badge,
      priority: message.priority || 'default',
      channelId: message.channelId,
    }));

    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushMessages),
      });

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        return result.data.map((pushResult: any, index: number) => {
          if (pushResult.status === 'ok') {
            return { 
              success: true, 
              id: pushResult.id,
              message: 'Notification sent successfully' 
            };
          } else {
            return { 
              success: false, 
              message: pushResult.message || 'Failed to send notification',
              details: { ...pushResult, token: tokens[index] }
            };
          }
        });
      }

      return [{ success: false, message: 'Unexpected response format', details: result }];
    } catch (error) {
      console.error('Error sending push notification batch:', error);
      return tokens.map(() => ({ success: false, message: 'Network error', details: error }));
    }
  }

  /**
   * Validate Expo push token format
   */
  private isValidExpoPushToken(token: string): boolean {
    return /^ExponentPushToken\[.+\]$/.test(token) || /^ExpoPushToken\[.+\]$/.test(token);
  }

  /**
   * Clean up invalid push tokens from the database
   */
  async cleanupInvalidTokens(): Promise<void> {
    try {
      // This would typically be run as a scheduled job
      const { data: users, error } = await supabase
        .from('users')
        .select('id, expo_push_token')
        .not('expo_push_token', 'is', null);

      if (error || !users) return;

      const invalidTokenUsers = users.filter(user => 
        user.expo_push_token && !this.isValidExpoPushToken(user.expo_push_token)
      );

      if (invalidTokenUsers.length > 0) {
        const userIds = invalidTokenUsers.map(user => user.id);
        await supabase
          .from('users')
          .update({ expo_push_token: null, push_notifications: false })
          .in('id', userIds);

        console.log(`Cleaned up ${invalidTokenUsers.length} invalid push tokens`);
      }
    } catch (error) {
      console.error('Error cleaning up invalid tokens:', error);
    }
  }
}

// Create and export a singleton instance
export const pushNotificationService = new PushNotificationService();

// Convenience functions for common use cases
export const sendPushNotification = {
  toUser: (userId: string, message: PushMessage) => 
    pushNotificationService.sendToUser(userId, message),
  
  toUsers: (userIds: string[], message: PushMessage) => 
    pushNotificationService.sendToUsers(userIds, message),
  
  toCampus: (schoolDomain: string, message: PushMessage) => 
    pushNotificationService.sendToCampus(schoolDomain, message),

  // Common notification types
  newMessage: (userId: string, senderName: string, messagePreview: string) =>
    pushNotificationService.sendToUser(userId, {
      title: `New message from ${senderName}`,
      body: messagePreview,
      data: { type: 'message', senderId: userId },
      channelId: 'messages'
    }),

  postInteraction: (userId: string, interactionType: 'like' | 'comment' | 'share', userName: string) =>
    pushNotificationService.sendToUser(userId, {
      title: `${userName} ${interactionType}d your post`,
      body: `Check out the interaction on your post`,
      data: { type: 'interaction', interactionType },
      channelId: 'social'
    }),

  newFollower: (userId: string, followerName: string) =>
    pushNotificationService.sendToUser(userId, {
      title: 'New follower!',
      body: `${followerName} started following you`,
      data: { type: 'follow' },
      channelId: 'social'
    }),

  campusEvent: (schoolDomain: string, eventTitle: string, eventTime: string) =>
    pushNotificationService.sendToCampus(schoolDomain, {
      title: `Campus Event: ${eventTitle}`,
      body: `Starting ${eventTime}`,
      data: { type: 'event' },
      channelId: 'events'
    }),

  studyReminder: (userId: string, subject: string, dueDate: string) =>
    pushNotificationService.sendToUser(userId, {
      title: `Study Reminder: ${subject}`,
      body: `Due ${dueDate}`,
      data: { type: 'study_reminder', subject },
      channelId: 'academic'
    })
};