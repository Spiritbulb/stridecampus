// Enhanced notification hook with Supabase realtime integration
// This ensures notifications are delivered immediately to both web and mobile
import { useState, useEffect, useCallback } from 'react';
import { supabase, type Notification } from '@/utils/supabaseClient';
import { robustNotificationService } from '@/utils/robustNotificationService';

interface EnhancedNotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  lastNotificationTime: string | null;
}

interface UseEnhancedNotificationsReturn extends EnhancedNotificationState {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  getNotificationStats: () => Promise<any>;
}

export function useEnhancedNotifications(userId: string | undefined): UseEnhancedNotificationsReturn {
  const [state, setState] = useState<EnhancedNotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isConnected: false,
    lastNotificationTime: null,
  });

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.is_read).length;
      const lastNotificationTime = notifications.length > 0 ? notifications[0].created_at : null;

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        lastNotificationTime,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!userId) return;
    
    try {
      const result = await robustNotificationService.sendRobustNotification(userId, {
        title: 'Test Notification 🎉',
        body: 'This is a test notification with robust delivery!',
        data: { type: 'test', timestamp: new Date().toISOString() },
        channelId: 'default',
      }, {
        enableDetailedLogging: true,
        maxRetries: 3,
      });

      console.log('Test notification result:', result);
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, [userId]);

  // Get notification statistics
  const getNotificationStats = useCallback(async () => {
    try {
      return await robustNotificationService.getNotificationStats();
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return null;
    }
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Set up realtime subscription for new notifications
    const notificationSubscription = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 New notification received via realtime:', payload);
          
          const newNotification = payload.new as Notification;
          
          setState(prev => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1,
            lastNotificationTime: newNotification.created_at,
          }));

          // Show browser notification if permission is granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/logo.png',
              tag: `notification-${newNotification.id}`,
              data: newNotification,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Notification updated via realtime:', payload);
          
          const updatedNotification = payload.new as Notification;
          
          setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            ),
            unreadCount: prev.notifications.filter(n => !n.is_read).length,
          }));
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime subscription status:', status);
        setState(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }));
      });

    // Set up broadcast channel for cross-tab communication
    const broadcastChannel = new BroadcastChannel('notifications');
    
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data.type === 'new_notification' && event.data.user_id === userId) {
        console.log('🔔 Notification received via broadcast channel:', event.data);
        
        const notification = event.data.notification;
        const newNotification: Notification = {
          id: `broadcast-${Date.now()}`,
          user_id: userId,
          recipient_id: userId,
          sender_id: userId,
          type: notification.data?.type || 'system',
          title: notification.title,
          message: notification.body,
          is_read: false,
          created_at: notification.timestamp,
        };

        setState(prev => ({
          ...prev,
          notifications: [newNotification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1,
          lastNotificationTime: newNotification.created_at,
        }));
      }
    };

    broadcastChannel.addEventListener('message', handleBroadcastMessage);

    // Cleanup
    return () => {
      notificationSubscription.unsubscribe();
      broadcastChannel.close();
    };
  }, [userId, fetchNotifications]);

  // Set up periodic refresh as fallback
  useEffect(() => {
    if (!userId) return;

    const refreshInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [userId, fetchNotifications]);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    sendTestNotification,
    getNotificationStats,
  };
}

// Utility function to show PWA notification
export function showPwaNotification(notification: Notification) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/logo.png',
      tag: `notification-${notification.id}`,
      data: notification,
    });
  }
}

// Utility function to request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Utility function to check notification support
export function getNotificationSupport() {
  return {
    supported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
  };
}
