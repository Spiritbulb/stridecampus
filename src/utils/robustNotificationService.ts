// Enhanced notification service with Supabase realtime integration
// This ensures notifications work reliably from web to mobile app
import { supabase } from './supabaseClient';
import { pushNotificationService, type PushMessage } from './pushNotificationService';

export interface RobustNotificationOptions {
  // Retry configuration
  maxRetries?: number;
  retryDelay?: number;
  
  // Fallback options
  enablePwaFallback?: boolean;
  enableInAppFallback?: boolean;
  
  // Supabase realtime options
  enableRealtimeSync?: boolean;
  
  // Logging
  enableDetailedLogging?: boolean;
}

export interface NotificationDeliveryResult {
  success: boolean;
  expoPushSent: boolean;
  pwaNotificationSent: boolean;
  inAppNotificationCreated: boolean;
  realtimeEventTriggered: boolean;
  errors: string[];
  details: any;
}

class RobustNotificationService {
  private defaultOptions: Required<RobustNotificationOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    enablePwaFallback: true,
    enableInAppFallback: true,
    enableRealtimeSync: true,
    enableDetailedLogging: true,
  };

  /**
   * Send notification with multiple delivery methods and fallbacks
   */
  async sendRobustNotification(
    userId: string,
    message: PushMessage,
    options: RobustNotificationOptions = {}
  ): Promise<NotificationDeliveryResult> {
    const opts = { ...this.defaultOptions, ...options };
    const result: NotificationDeliveryResult = {
      success: false,
      expoPushSent: false,
      pwaNotificationSent: false,
      inAppNotificationCreated: false,
      realtimeEventTriggered: false,
      errors: [],
      details: {},
    };

    if (opts.enableDetailedLogging) {
      console.log('🔔 Sending robust notification:', { userId, message, options: opts });
    }

    try {
      // 1. Get user's notification preferences and tokens
      const userInfo = await this.getUserNotificationInfo(userId);
      if (!userInfo) {
        result.errors.push('User not found');
        return result;
      }

      // 2. Send Expo push notification (primary method for mobile app)
      if (userInfo.expoPushToken && userInfo.pushNotificationsEnabled) {
        try {
          const expoResult = await this.sendWithRetry(
            () => pushNotificationService.sendToToken(userInfo.expoPushToken!, message),
            opts.maxRetries,
            opts.retryDelay
          );
          
          result.expoPushSent = expoResult.success;
          result.details.expoResult = expoResult;
          
          if (opts.enableDetailedLogging) {
            console.log('📱 Expo push result:', expoResult);
          }
        } catch (error) {
          result.errors.push(`Expo push failed: ${error}`);
          if (opts.enableDetailedLogging) {
            console.error('📱 Expo push error:', error);
          }
        }
      }

      // 3. Create in-app notification record (always create for consistency)
      if (opts.enableInAppFallback) {
        try {
          await this.createInAppNotification(userId, message);
          result.inAppNotificationCreated = true;
          
          if (opts.enableDetailedLogging) {
            console.log('💾 In-app notification created');
          }
        } catch (error) {
          result.errors.push(`In-app notification failed: ${error}`);
          if (opts.enableDetailedLogging) {
            console.error('💾 In-app notification error:', error);
          }
        }
      }

      // 4. Trigger Supabase realtime event for immediate web updates
      if (opts.enableRealtimeSync) {
        try {
          await this.triggerRealtimeEvent(userId, message);
          result.realtimeEventTriggered = true;
          
          if (opts.enableDetailedLogging) {
            console.log('⚡ Realtime event triggered');
          }
        } catch (error) {
          result.errors.push(`Realtime event failed: ${error}`);
          if (opts.enableDetailedLogging) {
            console.error('⚡ Realtime event error:', error);
          }
        }
      }

      // 5. Send PWA notification as fallback (for web users)
      if (opts.enablePwaFallback && !result.expoPushSent) {
        try {
          await this.sendPWANotification(userId, message);
          result.pwaNotificationSent = true;
          
          if (opts.enableDetailedLogging) {
            console.log('🌐 PWA notification sent');
          }
        } catch (error) {
          result.errors.push(`PWA notification failed: ${error}`);
          if (opts.enableDetailedLogging) {
            console.error('🌐 PWA notification error:', error);
          }
        }
      }

      // Determine overall success
      result.success = result.expoPushSent || result.pwaNotificationSent || result.inAppNotificationCreated;

      if (opts.enableDetailedLogging) {
        console.log('✅ Robust notification result:', result);
      }

      return result;
    } catch (error) {
      result.errors.push(`General error: ${error}`);
      if (opts.enableDetailedLogging) {
        console.error('❌ Robust notification error:', error);
      }
      return result;
    }
  }

  /**
   * Send notification to multiple users with individual error handling
   */
  async sendRobustNotificationToUsers(
    userIds: string[],
    message: PushMessage,
    options: RobustNotificationOptions = {}
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];
    
    // Process users in parallel with individual error handling
    const promises = userIds.map(async (userId) => {
      try {
        return await this.sendRobustNotification(userId, message, options);
      } catch (error) {
        return {
          success: false,
          expoPushSent: false,
          pwaNotificationSent: false,
          inAppNotificationCreated: false,
          realtimeEventTriggered: false,
          errors: [`Failed to process user ${userId}: ${error}`],
          details: {},
        };
      }
    });

    const userResults = await Promise.allSettled(promises);
    
    userResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          expoPushSent: false,
          pwaNotificationSent: false,
          inAppNotificationCreated: false,
          realtimeEventTriggered: false,
          errors: [`Promise rejected: ${result.reason}`],
          details: {},
        });
      }
    });

    return results;
  }

  /**
   * Send campus-wide notification with robust delivery
   */
  async sendRobustCampusNotification(
    schoolDomain: string,
    message: PushMessage,
    options: RobustNotificationOptions = {}
  ): Promise<NotificationDeliveryResult[]> {
    try {
      // Get all users from the campus
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('school_domain', schoolDomain)
        .eq('push_notifications', true);

      if (error) throw error;

      const userIds = users?.map(user => user.id) || [];
      
      if (userIds.length === 0) {
        return [{
          success: false,
          expoPushSent: false,
          pwaNotificationSent: false,
          inAppNotificationCreated: false,
          realtimeEventTriggered: false,
          errors: ['No users found for campus'],
          details: { schoolDomain, userCount: 0 },
        }];
      }

      return await this.sendRobustNotificationToUsers(userIds, message, options);
    } catch (error) {
      return [{
        success: false,
        expoPushSent: false,
        pwaNotificationSent: false,
        inAppNotificationCreated: false,
        realtimeEventTriggered: false,
        errors: [`Campus notification failed: ${error}`],
        details: { schoolDomain },
      }];
    }
  }

  /**
   * Get user's notification preferences and tokens
   */
  private async getUserNotificationInfo(userId: string) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, expo_push_token, push_notifications, email_notifications')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        id: user.id,
        expoPushToken: user.expo_push_token,
        pushNotificationsEnabled: user.push_notifications,
        emailNotificationsEnabled: user.email_notifications,
      };
    } catch (error) {
      console.error('Error getting user notification info:', error);
      return null;
    }
  }

  /**
   * Create in-app notification record
   */
  private async createInAppNotification(userId: string, message: PushMessage) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        recipient_id: userId,
        sender_id: userId, // Self-sent for system notifications
        type: message.data?.type || 'test',
        title: message.title,
        message: message.body,
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  /**
   * Trigger Supabase realtime event for immediate web updates
   */
  private async triggerRealtimeEvent(userId: string, message: PushMessage) {
    // This creates a realtime event that web clients can listen to
    const channel = supabase.channel('user_notifications');
    await channel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: {
        user_id: userId,
        notification: {
          title: message.title,
          body: message.body,
          data: message.data,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Send PWA notification (fallback for web users)
   */
  private async sendPWANotification(userId: string, message: PushMessage) {
    // This would typically involve sending to a push service
    // For now, we'll create an in-app notification that PWA can display
    await this.createInAppNotification(userId, message);
  }

  /**
   * Retry mechanism for failed operations
   */
  private async sendWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delay: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Validate notification before sending
   */
  validateNotification(message: PushMessage): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message.title || message.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!message.body || message.body.trim().length === 0) {
      errors.push('Body is required');
    }

    if (message.title && message.title.length > 100) {
      errors.push('Title is too long (max 100 characters)');
    }

    if (message.body && message.body.length > 500) {
      errors.push('Body is too long (max 500 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get notification delivery statistics
   */
  async getNotificationStats(): Promise<{
    totalUsers: number;
    usersWithExpoTokens: number;
    usersWithPushEnabled: number;
    recentNotifications: number;
  }> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get users with Expo tokens
      const { count: usersWithExpoTokens } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('expo_push_token', 'is', null);

      // Get users with push enabled
      const { count: usersWithPushEnabled } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('push_notifications', true);

      // Get recent notifications (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      return {
        totalUsers: totalUsers || 0,
        usersWithExpoTokens: usersWithExpoTokens || 0,
        usersWithPushEnabled: usersWithPushEnabled || 0,
        recentNotifications: recentNotifications || 0,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalUsers: 0,
        usersWithExpoTokens: 0,
        usersWithPushEnabled: 0,
        recentNotifications: 0,
      };
    }
  }
}

// Create and export singleton instance
export const robustNotificationService = new RobustNotificationService();

// Convenience functions
export const sendRobustNotification = {
  toUser: (userId: string, message: PushMessage, options?: RobustNotificationOptions) =>
    robustNotificationService.sendRobustNotification(userId, message, options),
  
  toUsers: (userIds: string[], message: PushMessage, options?: RobustNotificationOptions) =>
    robustNotificationService.sendRobustNotificationToUsers(userIds, message, options),
  
  toCampus: (schoolDomain: string, message: PushMessage, options?: RobustNotificationOptions) =>
    robustNotificationService.sendRobustCampusNotification(schoolDomain, message, options),
};

// Common notification templates with robust delivery
export const robustNotifications = {
  newMessage: (userId: string, senderName: string, messagePreview: string) =>
    sendRobustNotification.toUser(userId, {
      title: `New message from ${senderName}`,
      body: messagePreview,
      data: { type: 'message', senderName },
      channelId: 'messages',
    }),

  newFollower: (userId: string, followerName: string) =>
    sendRobustNotification.toUser(userId, {
      title: 'New follower! 🎉',
      body: `${followerName} started following you`,
      data: { type: 'follow', followerName },
      channelId: 'social',
    }),

  campusEvent: (schoolDomain: string, eventTitle: string, eventTime: string) =>
    sendRobustNotification.toCampus(schoolDomain, {
      title: `📢 Campus Event: ${eventTitle}`,
      body: `Starting ${eventTime}`,
      data: { type: 'event', eventTitle },
      channelId: 'events',
    }),

  studyReminder: (userId: string, subject: string, dueDate: string) =>
    sendRobustNotification.toUser(userId, {
      title: `📚 Study Reminder: ${subject}`,
      body: `Due ${dueDate}`,
      data: { type: 'study_reminder', subject },
      channelId: 'academic',
    }),

  systemAnnouncement: (userIds: string[], title: string, body: string) =>
    sendRobustNotification.toUsers(userIds, {
      title: `📢 ${title}`,
      body,
      data: { type: 'announcement' },
      channelId: 'events',
    }),
};
