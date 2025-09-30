// New notification service that inserts directly into database
// This will trigger the database trigger to queue Expo push notifications

import { supabase } from './supabaseClient';

// Allowed notification types based on database constraint
export type AllowedNotificationType = 'credit_earned' | 'referral_bonus' | 'level_up' | 'welcome' | 'system' | 'follow';

export interface CreateNotificationData {
  user_id: string;
  recipient_id: string;
  sender_id: string;
  type: AllowedNotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  /**
   * Create a notification in the database
   * This will automatically trigger the database trigger to queue Expo push notifications
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          recipient_id: data.recipient_id,
          sender_id: data.sender_id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || null,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      console.log('✅ Notification created in database:', notification.id);
      return notification;
    } catch (error) {
      console.error('❌ Error in createNotification:', error);
      throw error;
    }
  }

  /**
   * Send a message notification (mapped to 'system' type)
   */
  static async sendMessageNotification(recipientId: string, senderId: string, senderName: string, messagePreview: string) {
    return this.createNotification({
      user_id: recipientId,
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'system',
      title: `New message from ${senderName}`,
      message: messagePreview,
      data: {
        originalType: 'message',
        senderId,
        senderName
      }
    });
  }

  /**
   * Send a follow notification
   */
  static async sendFollowNotification(followedUserId: string, followerId: string, followerName: string) {
    return this.createNotification({
      user_id: followedUserId,
      recipient_id: followedUserId,
      sender_id: followerId,
      type: 'follow',
      title: 'New follower!',
      message: `${followerName} started following you`,
      data: {
        followerId,
        followerName
      }
    });
  }

  /**
   * Send a test notification (mapped to 'system' type)
   */
  static async sendTestNotification(userId: string) {
    return this.createNotification({
      user_id: userId,
      recipient_id: userId,
      sender_id: userId,
      type: 'system',
      title: 'Test Notification 🎉',
      message: 'Push notifications are working perfectly!',
      data: {
        originalType: 'test',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send notifications to multiple users
   */
  static async sendBulkNotifications(userIds: string[], notificationData: Omit<CreateNotificationData, 'user_id' | 'recipient_id'>) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      recipient_id: userId,
      sender_id: notificationData.sender_id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      is_read: false
    }));

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error creating bulk notifications:', error);
        throw error;
      }

      console.log(`✅ ${notifications.length} notifications created in database`);
      return data;
    } catch (error) {
      console.error('❌ Error in sendBulkNotifications:', error);
      throw error;
    }
  }

  /**
   * Send announcement to all users (mapped to 'system' type)
   */
  static async sendAnnouncementToAll(title: string, message: string, senderId: string) {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('push_notifications', true);

      if (error) {
        console.error('Error fetching users for announcement:', error);
        throw error;
      }

      if (!users || users.length === 0) {
        console.log('No users found with push notifications enabled');
        return [];
      }

      const userIds = users.map(user => user.id);
      
      return this.sendBulkNotifications(userIds, {
        sender_id: senderId,
        type: 'system',
        title,
        message,
        data: {
          originalType: 'announcement',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error in sendAnnouncementToAll:', error);
      throw error;
    }
  }
}
