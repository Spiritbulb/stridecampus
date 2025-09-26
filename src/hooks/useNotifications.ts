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
      icon: '/logo.png', // Use your logo
      badge: '/logo.png',
      tag: notification.id, // Prevent duplicate notifications
      data: {
        notificationId: notification.id,
        url: window.location.href
      }
    };

    // Show the notification
    const n = new Notification(notification.title, notificationOptions);

    // Handle click on notification
    n.onclick = () => {
      window.focus();
      // Mark as read when notification is clicked
      if (notification.id && !notification.id.startsWith('welcome-')) {
        markAsRead(notification.id);
      }
      n.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => n.close(), 5000);
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