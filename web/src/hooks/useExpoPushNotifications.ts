import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/hooks/use-toast';

interface PushNotificationState {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  expoPushToken: string | null;
  fcmToken: string | null;
  isLoading: boolean;
}

interface UseExpoPushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  updatePushToken: (userId: string) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  syncTokenWhenUserLogsIn: (userId: string) => Promise<void>;
}

export function useExpoPushNotifications(): UseExpoPushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    expoPushToken: null,
    fcmToken: null,
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
        console.log('📨 Received message from native app:', data);
        
        switch (data.type) {
          case 'APP_READY':
            console.log('📱 Native app is ready with data:', data);
            setState(prev => ({
              ...prev,
              expoPushToken: data.expoPushToken || data.fcmToken, // Support both token types
              fcmToken: data.fcmToken || data.expoPushToken, // Support both token types
              permission: data.notificationPermission,
              isSupported: true,
              isLoading: false,
            }));
            
            // If we have a token, automatically update it in the database
            if (data.expoPushToken || data.fcmToken) {
              console.log('🔄 Auto-updating push token from APP_READY');
              // We'll update this when we have a user ID
            }
            break;
            
          case 'EXPO_PUSH_TOKEN':
          case 'FCM_TOKEN':
            console.log('📱 Received push token:', data.token ? 'Token available' : 'No token');
            setState(prev => ({
              ...prev,
              expoPushToken: data.token, // Store in expoPushToken for compatibility
              fcmToken: data.token, // Also store as FCM token
              permission: data.token ? 'granted' : prev.permission,
              isSupported: true,
              isLoading: false,
            }));
            
            // If we have a token and user ID, automatically sync to database
            if (data.token && data.userId) {
              console.log('🔄 Auto-syncing FCM token with user ID:', data.userId);
              // Use the syncTokenWhenUserLogsIn function
              setTimeout(() => {
                syncTokenWhenUserLogsIn(data.userId).catch(error => {
                  console.error('❌ Auto-sync failed:', error);
                });
              }, 100);
            } else if (data.token) {
              console.log('🔄 Auto-updating push token from', data.type);
              // We'll update this when we have a user ID
            }
            break;
            
          case 'TOKEN_REFRESHED':
          case 'PURE_FCM_TOKEN_REFRESHED':
            console.log('🔄 Token was refreshed by native app:', data.token ? 'New token available' : 'No token');
            setState(prev => ({
              ...prev,
              expoPushToken: data.token, // Store in expoPushToken for compatibility
              fcmToken: data.token, // Also store as FCM token
              permission: data.token ? 'granted' : prev.permission,
              isSupported: true,
            }));
            
            // If we have a token, automatically update it in the database
            if (data.token) {
              console.log('🔄 Auto-updating refreshed push token');
              // We'll update this when we have a user ID
            }
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
                      type: 'REQUEST_PUSH_TOKEN' // Mobile app handles both FCM and Expo
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
          case 'FCM_PERMISSION_DENIED':
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
            
          case 'PURE_FCM_NOTIFICATION_RECEIVED':
          case 'FCM_NOTIFICATION_RECEIVED':
            console.log('🔔 FCM notification received in web app:', data.notification);
            // Handle FCM notification in web app
            break;
            
          case 'PURE_FCM_DATABASE_NOTIFICATION_RECEIVED':
          case 'FCM_DATABASE_NOTIFICATION_RECEIVED':
            console.log('🔔 FCM database notification received in web app:', data.notification);
            // Handle FCM database notification in web app
            break;
            
          case 'FCM_TOKEN_SYNC_COMPLETED':
            console.log('🔄 FCM token sync completed:', data.success ? 'Success' : 'Failed');
            if (data.success) {
              console.log('✅ FCM token synced successfully');
            } else {
              console.error('❌ FCM token sync failed:', data.error);
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
      // Request permission from the native app (supports both FCM and Expo)
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REQUEST_NOTIFICATION_PERMISSION' // Mobile app handles both FCM and Expo
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
  }, [isInExpoWebView, state.permission, state.expoPushToken, state.fcmToken]);

  const updatePushToken = useCallback(async (userId: string): Promise<void> => {
    const token = state.expoPushToken || state.fcmToken; // Use either token type
    if (!token) {
      console.warn('No push token available');
      return;
    }

    try {
      console.log('🔄 Updating push token in database for user:', userId);
      console.log('📱 Token being updated:', token);
      
      const { data, error } = await supabase
        .from('users')
        .update({ 
          expo_push_token: token, // Store in expo_push_token column for compatibility
          push_notifications: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Error updating push token:', error);
        throw error;
      }

      console.log('✅ Push token updated successfully in database');
      console.log('📊 Updated user data:', data);
    } catch (error) {
      console.error('❌ Error updating push token:', error);
      throw error;
    }
  }, [state.expoPushToken, state.fcmToken]);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    const token = state.expoPushToken || state.fcmToken; // Use either token type
    if (!token) {
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
  }, [state.expoPushToken, state.fcmToken]);

  // Critical function to sync token when user logs in
  const syncTokenWhenUserLogsIn = useCallback(async (userId: string): Promise<void> => {
    const token = state.expoPushToken || state.fcmToken;
    
    if (!token) {
      console.log('⚠️ No token available for sync when user logs in');
      return;
    }

    try {
      console.log('🔄 User logged in, syncing FCM token to database...');
      console.log('👤 User ID:', userId);
      console.log('📱 Token to sync:', token);
      
      const { data, error } = await supabase
        .from('users')
        .update({ 
          expo_push_token: token,
          push_notifications: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Error syncing token when user logs in:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ FCM token synced successfully when user logged in');
      console.log('📊 Updated user data:', data);
      
      // Notify mobile app that sync was successful
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'FCM_TOKEN_SYNC_COMPLETED',
          success: true,
          token: token,
          userId: userId
        }));
      }
    } catch (error) {
      console.error('❌ Error in syncTokenWhenUserLogsIn:', error);
      
      // Notify mobile app that sync failed
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'FCM_TOKEN_SYNC_COMPLETED',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          userId: userId
        }));
      }
    }
  }, [state.expoPushToken, state.fcmToken]);

  return {
    ...state,
    requestPermission,
    updatePushToken,
    sendTestNotification,
    syncTokenWhenUserLogsIn,
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