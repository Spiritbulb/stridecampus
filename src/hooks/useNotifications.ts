import { useState, useEffect } from 'react';
import { supabase, type Notification } from '@/utils/supabaseClient';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Set up real-time subscription for new notifications
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            // Add new notification to local state
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show PWA notification for new notifications
            if (notificationPermission === 'granted') {
              showPwaNotification(newNotification);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId, notificationPermission]);

  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Show a welcome notification when permission is granted
        showPwaNotification({
          id: 'welcome-' + Date.now(),
          user_id: userId || '',
          title: 'Notifications Enabled!',
          message: 'You\'ll now receive notifications from Stride Campus.',
          type: 'system',
          is_read: false,
          created_at: new Date().toISOString(),
          metadata: null,
          sender_id: null,
          recipient_id: null
        } as any);
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showPwaNotification = (notification: Notification) => {
    if (notificationPermission !== 'granted') return;

    const notificationOptions: NotificationOptions = {
      body: notification.message,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: notification.id,
      data: {
        notificationId: notification.id,
        type: notification.type,
        url: window.location.href
      },
      requireInteraction: false
    };

    // Customize based on notification type
    switch (notification.type) {
      case 'message':
        notificationOptions.icon = '/logo.png'; // Could use a message icon
        notificationOptions.requireInteraction = true; // Keep message notifications visible
        break;
      case 'follow':
        notificationOptions.icon = '/logo.png'; // Could use a heart icon
        break;
      case 'announcement':
      case 'event':
        notificationOptions.requireInteraction = true; // Important announcements stay visible
        notificationOptions.icon = '/logo.png';
        break;
      case 'study_reminder':
        notificationOptions.icon = '/logo.png'; // Could use a book icon
        notificationOptions.requireInteraction = true;
        break;
    }

    // Show the notification
    const n = new Notification(notification.title, notificationOptions);

    // Handle click on notification
    n.onclick = () => {
      window.focus();
      
      // Navigate based on notification type
      switch (notification.type) {
        case 'message':
          window.location.href = '/chats';
          break;
        case 'follow':
          // Could navigate to the follower's profile if we had that data
          window.location.href = '/dashboard';
          break;
        case 'announcement':
        case 'event':
        case 'study_reminder':
          window.location.href = '/dashboard';
          break;
        default:
          window.location.href = '/dashboard';
      }
      
      // Mark as read when notification is clicked
      if (notification.id && !notification.id.startsWith('welcome-') && !notification.id.startsWith('test-')) {
        markAsRead(notification.id);
      }
      n.close();
    };

    // Auto-close after different times based on type
    const closeTime = notification.type === 'message' || notification.type === 'announcement' ? 10000 : 6000;
    setTimeout(() => n.close(), closeTime);
  };

  // Manual method to trigger a test notification
  const triggerTestNotification = () => {
    if (notificationPermission !== 'granted') return;

    const testNotification: any = {
      id: 'test-' + Date.now(),
      user_id: userId || '',
      title: 'Test Notification',
      message: 'This is a test notification from Stride Campus!',
      type: 'system',
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: null,
      sender_id: null,
      recipient_id: null
    };

    showPwaNotification(testNotification);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    notificationPermission,
    markAsRead,
    refetch: fetchNotifications,
    requestNotificationPermission,
    triggerTestNotification,
    canNotify: notificationPermission === 'granted'
  };
}