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
  fcmToken: string | null; // Add FCM token support
}

interface UseUnifiedNotificationsReturn extends UnifiedNotificationState {
  requestPermission: () => Promise<boolean>;
  updatePushToken: (userId: string) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  syncTokenWhenUserLogsIn: (userId: string) => Promise<void>; // Add sync function
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
    fcmToken: null, // Add FCM token support
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
        fcmToken: expo.fcmToken, // Add FCM token support
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
        fcmToken: null, // PWA doesn't use FCM tokens
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
        fcmToken: null, // No FCM token support
      });
    }
  }, [
    expo.isSupported, expo.permission, expo.isLoading, expo.expoPushToken, expo.fcmToken,
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
    if (state.type === 'expo' && (expo.expoPushToken || expo.fcmToken)) {
      return await expo.updatePushToken(userId);
    }
    // PWA notifications don't use expo push tokens
    // They use subscription endpoints which are handled differently
    console.log('PWA notifications use subscription-based system, not expo tokens');
  }, [state.type, expo.updatePushToken, expo.expoPushToken, expo.fcmToken]);

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
    syncTokenWhenUserLogsIn: expo.syncTokenWhenUserLogsIn, // Expose sync function
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
