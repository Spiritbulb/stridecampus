import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/hooks/use-toast';

// Extend Window interface for React Native WebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

interface PushNotificationState {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  expoPushToken: string | null;
  isLoading: boolean;
}

interface UseExpoPushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  updatePushToken: (userId: string) => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export function useExpoPushNotifications(): UseExpoPushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    expoPushToken: null,
    isLoading: false,
  });

  // Check if we're in a mobile webview (Expo)
  const isInExpoWebView = useCallback(() => {
    return /StrideCampusApp/.test(navigator.userAgent);
  }, []);

  // Listen for messages from the native app
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'EXPO_PUSH_TOKEN') {
          setState(prev => ({
            ...prev,
            expoPushToken: data.token,
            permission: 'granted',
            isSupported: true,
          }));
        }
      } catch (error) {
        console.error('Error parsing message from native app:', error);
      }
    };

    // For React Native WebView
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.addEventListener('message', handleMessage);
      
      // Request the current push token
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'REQUEST_PUSH_TOKEN'
      }));
    }

    // Check if we're in Expo WebView
    setState(prev => ({
      ...prev,
      isSupported: isInExpoWebView(),
    }));

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleMessage);
      }
    };
  }, [isInExpoWebView]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isInExpoWebView()) {
      console.warn('Push notifications are only supported in the mobile app');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission from the native app
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REQUEST_NOTIFICATION_PERMISSION'
        }));
      }

      // Wait a bit for the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hasPermission = state.permission === 'granted' && !!state.expoPushToken;
      
      setState(prev => ({ ...prev, isLoading: false }));
      return hasPermission;
    } catch (error) {
      console.error('Error requesting push notification permission:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [isInExpoWebView, state.permission, state.expoPushToken]);

  const updatePushToken = useCallback(async (userId: string): Promise<void> => {
    if (!state.expoPushToken) {
      console.warn('No push token available');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          expo_push_token: state.expoPushToken,
          push_notifications_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      console.log('Push token updated successfully');
    } catch (error) {
      console.error('Error updating push token:', error);
      throw error;
    }
  }, [state.expoPushToken]);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!state.expoPushToken) {
      toast({
        title: "Error",
        description: "No push token available. Please enable notifications first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const message = {
        to: state.expoPushToken,
        sound: 'default',
        title: 'Test Notification 🎉',
        body: 'Push notifications are working great!',
        data: { url: '/dashboard' },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      
      if (data.data && data.data[0].status === 'ok') {
        toast({
          title: "Test notification sent!",
          description: "You should receive a notification shortly.",
        });
      } else {
        throw new Error(data.data?.[0]?.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification. Please try again.",
        variant: "destructive",
      });
    }
  }, [state.expoPushToken]);

  return {
    ...state,
    requestPermission,
    updatePushToken,
    sendTestNotification,
  };
}

// Utility function to send notifications from your backend
export async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}