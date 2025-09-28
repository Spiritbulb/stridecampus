import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface PWANotificationState {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  registration: ServiceWorkerRegistration | null;
  isLoading: boolean;
}

interface UsePWANotificationsReturn extends PWANotificationState {
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

export function usePWANotifications(): UsePWANotificationsReturn {
  const [state, setState] = useState<PWANotificationState>({
    isSupported: false,
    permission: 'default',
    registration: null,
    isLoading: false,
  });

  // Check if PWA notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 
        'serviceWorker' in navigator && 
        'Notification' in window && 
        'PushManager' in window;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied'
      }));
    };

    checkSupport();

    // Register service worker for PWA notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          setState(prev => ({ ...prev, registration }));
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('PWA notifications are not supported');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ 
        ...prev, 
        permission: permission as 'granted' | 'denied' | 'default',
        isLoading: false 
      }));
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting PWA notification permission:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported]);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!state.isSupported || state.permission !== 'granted') {
      toast({
        title: "Error",
        description: "Notifications not available or permission not granted.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Send a test notification via service worker
      if (state.registration && state.registration.active) {
        state.registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Test Notification 🎉',
          body: 'PWA notifications are working!',
          data: { url: '/dashboard' }
        });
        
        toast({
          title: "Test notification sent!",
          description: "You should see a notification shortly.",
        });
      } else {
        // Fallback to direct notification
        new Notification('Test Notification 🎉', {
          body: 'PWA notifications are working!',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'test-notification'
        });
        
        toast({
          title: "Test notification shown!",
          description: "Notification displayed successfully.",
        });
      }
    } catch (error) {
      console.error('Error sending PWA test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification. Please try again.",
        variant: "destructive",
      });
    }
  }, [state.isSupported, state.permission, state.registration]);

  return {
    ...state,
    requestPermission,
    sendTestNotification,
  };
}

// Function to show PWA notifications
export function showPWANotification(
  title: string, 
  body: string, 
  options: {
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: { action: string; title: string; icon?: string }[];
  } = {}
) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: options.icon || '/logo.png',
      badge: options.badge || '/logo.png',
      tag: options.tag || 'stride-notification',
      data: options.data,
      requireInteraction: true,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
      
      notification.close();
    };

    return notification;
  }

  return null;
}