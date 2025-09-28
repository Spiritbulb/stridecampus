import { useState, useEffect, useCallback } from 'react';
import { useExpoPushNotifications } from './useExpoPushNotifications';
import { usePWANotifications } from './usePwaNotifications';
import { toast } from '@/hooks/use-toast';

interface UnifiedNotificationState {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  type: 'expo' | 'pwa' | 'none';
  isLoading: boolean;
  expoPushToken: string | null;
}

interface UseUnifiedNotificationsReturn extends UnifiedNotificationState {
  requestPermission: () => Promise<boolean>;
  updatePushToken: (userId: string) => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export function useUnifiedNotifications(): UseUnifiedNotificationsReturn {
  const expo = useExpoPushNotifications();
  const pwa = usePWANotifications();
  
  const [state, setState] = useState<UnifiedNotificationState>({
    isSupported: false,
    permission: 'default',
    type: 'none',
    isLoading: false,
    expoPushToken: null,
  });

  // Determine which notification system to use
  useEffect(() => {
    // Prefer Expo notifications if available (mobile app)
    if (expo.isSupported) {
      setState({
        isSupported: expo.isSupported,
        permission: expo.permission,
        type: 'expo',
        isLoading: expo.isLoading,
        expoPushToken: expo.expoPushToken,
      });
    } 
    // Fallback to PWA notifications (web browser)
    else if (pwa.isSupported) {
      setState({
        isSupported: pwa.isSupported,
        permission: pwa.permission,
        type: 'pwa',
        isLoading: pwa.isLoading,
        expoPushToken: null,
      });
    }
    // No notification support
    else {
      setState({
        isSupported: false,
        permission: 'denied',
        type: 'none',
        isLoading: false,
        expoPushToken: null,
      });
    }
  }, [
    expo.isSupported, expo.permission, expo.isLoading, expo.expoPushToken,
    pwa.isSupported, pwa.permission, pwa.isLoading
  ]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (state.type === 'expo') {
      return await expo.requestPermission();
    } else if (state.type === 'pwa') {
      return await pwa.requestPermission();
    } else {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device/browser.",
        variant: "destructive",
      });
      return false;
    }
  }, [state.type, expo.requestPermission, pwa.requestPermission]);

  const updatePushToken = useCallback(async (userId: string): Promise<void> => {
    if (state.type === 'expo' && expo.expoPushToken) {
      return await expo.updatePushToken(userId);
    }
    // PWA notifications don't use expo push tokens
    // They use subscription endpoints which are handled differently
    console.log('PWA notifications use subscription-based system, not expo tokens');
  }, [state.type, expo.updatePushToken, expo.expoPushToken]);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (state.type === 'expo') {
      return await expo.sendTestNotification();
    } else if (state.type === 'pwa') {
      return await pwa.sendTestNotification();
    } else {
      toast({
        title: "Error",
        description: "No notification system available.",
        variant: "destructive",
      });
    }
  }, [state.type, expo.sendTestNotification, pwa.sendTestNotification]);

  return {
    ...state,
    requestPermission,
    updatePushToken,
    sendTestNotification,
  };
}

// Utility function to detect the environment
export function getNotificationEnvironment(): 'expo' | 'pwa' | 'none' {
  // Check if we're in Expo WebView
  if (typeof navigator !== 'undefined' && /StrideCampusApp/.test(navigator.userAgent)) {
    return 'expo';
  }
  
  // Check if PWA notifications are supported
  if (
    typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'Notification' in window && 
    'PushManager' in window
  ) {
    return 'pwa';
  }
  
  return 'none';
}
