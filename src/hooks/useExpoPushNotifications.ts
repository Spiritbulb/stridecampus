import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/hooks/use-toast';

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
        
        switch (data.type) {
          case 'EXPO_PUSH_TOKEN':
            setState(prev => ({
              ...prev,
              expoPushToken: data.token,
              permission: data.token ? 'granted' : prev.permission,
              isSupported: true,
            }));
            break;
            
          case 'PERMISSION_STATUS':
            setState(prev => {
              const newPermission = data.permission;
              // If permission changed from denied/default to granted, request token
              if (prev.permission !== 'granted' && newPermission === 'granted') {
                // Request fresh token when permission is granted
                setTimeout(() => {
                  if ((window as any).ReactNativeWebView) {
                    (window as any).ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'REQUEST_PUSH_TOKEN'
                    }));
                  }
                }, 100);
              }
              
              return {
                ...prev,
                permission: newPermission,
                isSupported: true,
              };
            });
            break;
            
          case 'NOTIFICATION_PERMISSION_DENIED':
            setState(prev => ({
              ...prev,
              permission: 'denied',
              isSupported: true,
              isLoading: false,
            }));
            toast({
              title: "Permission Denied",
              description: data.message || "Push notification permission was denied",
              variant: "destructive",
            });
            break;
            
          case 'NAVIGATE_TO_URL':
            // Handle navigation from notifications
            if (data.url) {
              window.location.href = data.url;
            }
            break;
            
          default:
            console.log('Unhandled message from native app:', data);
        }
      } catch (error) {
        console.error('Error parsing message from native app:', error);
      }
    };

    // For React Native WebView
    if (
      typeof window !== 'undefined' &&
      typeof (window as any).ReactNativeWebView !== 'undefined'
    ) {
      window.addEventListener('message', handleMessage);

      // Request the current push token and permission status
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'REQUEST_PUSH_TOKEN'
      }));
      
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'REQUEST_PERMISSION_STATUS'
      }));
    }

    // Check if we're in Expo WebView
    setState(prev => ({
      ...prev,
      isSupported: isInExpoWebView(),
    }));

    // Set up periodic permission status checks (every 5 seconds)
    let permissionCheckInterval: number | null = null;
    
    if (isInExpoWebView() && (window as any).ReactNativeWebView) {
      permissionCheckInterval = setInterval(() => {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REQUEST_PERMISSION_STATUS'
        }));
      }, 5000);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleMessage);
      }
      if (permissionCheckInterval) {
        clearInterval(permissionCheckInterval);
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
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REQUEST_NOTIFICATION_PERMISSION'
        }));
      }

      // Wait for the response with a longer timeout
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds total
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        // Check if we got a response
        if (state.permission === 'granted' && state.expoPushToken) {
          setState(prev => ({ ...prev, isLoading: false }));
          return true;
        }
        
        if (state.permission === 'denied') {
          setState(prev => ({ ...prev, isLoading: false }));
          return false;
        }
      }
      
      // Timeout - check final state
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
          push_notifications: true,
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
      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Test notification sent!",
          description: "You should receive a notification shortly.",
        });
      } else {
        throw new Error(data.error || 'Failed to send notification');
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