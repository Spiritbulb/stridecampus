import React from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MessageHandlerProps {
  webViewRef: React.RefObject<any>;
  expoPushToken: string;
  isTokenRegistered: boolean;
  notificationPermission: string;
  onTokenRefresh: (token: string, isRegistered: boolean) => void;
  onPermissionChange: (permission: string) => void;
  registerForPushNotificationsAsync: () => Promise<string | null>;
  syncTokenToDatabase: (token: string) => Promise<void>;
}

export default function MessageHandler({
  webViewRef,
  expoPushToken,
  isTokenRegistered,
  notificationPermission,
  onTokenRefresh,
  onPermissionChange,
  registerForPushNotificationsAsync,
  syncTokenToDatabase
}: MessageHandlerProps) {

  // Enhanced message handler with better error handling and logging
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Message received from WebView:', data);
      
      switch (data.type) {
        case 'REQUEST_PUSH_TOKEN':
        case 'REQUEST_FCM_TOKEN':
          console.log('📤 WebView requesting FCM token...');
          
          // Try to get fresh token if we don't have one or if current one is invalid
          if (!expoPushToken || !isTokenRegistered) {
            console.log('🔄 Generating fresh FCM token for WebView request...');
            try {
              const freshToken = await registerForPushNotificationsAsync();
              if (freshToken) {
                onTokenRefresh(freshToken, true);
                await AsyncStorage.setItem('pureFCMToken', freshToken);
                await AsyncStorage.setItem('pureFCMTokenTimestamp', new Date().toISOString());
                await syncTokenToDatabase(freshToken);
              }
            } catch (error) {
              console.error('❌ Error generating fresh FCM token:', error);
            }
          }
          
          if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'FCM_TOKEN',
              token: expoPushToken,
              isRegistered: isTokenRegistered,
              permission: notificationPermission,
              timestamp: new Date().toISOString()
            }));
            console.log('✅ FCM token sent to WebView:', expoPushToken ? 'Token available' : 'No token');
          }
          break;

        case 'REQUEST_PERMISSION_STATUS':
          console.log('📤 WebView requesting permission status...');
          Notifications.getPermissionsAsync().then(({ status }) => {
            onPermissionChange(status);
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'PERMISSION_STATUS',
                permission: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'default'
              }));
              console.log('✅ Permission status sent to WebView:', status);
            }
          });
          break;
          
        case 'REQUEST_NOTIFICATION_PERMISSION':
        case 'REQUEST_FCM_PERMISSION':
          console.log('📤 WebView requesting FCM notification permission...');
          registerForPushNotificationsAsync().then(token => {
            if (webViewRef.current) {
              if (token) {
                onTokenRefresh(token, true);
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'FCM_TOKEN',
                  token: token,
                  isRegistered: true,
                  permission: 'granted'
                }));
                console.log('✅ New FCM token sent to WebView');
              } else {
                console.warn('⚠️ Permission denied or failed to get FCM token');
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'FCM_PERMISSION_DENIED',
                  message: 'Permission denied or failed to get FCM token'
                }));
              }
            }
          });
          break;

        case 'NAVIGATE_TO_URL':
          console.log('🧭 WebView requesting navigation to:', data.url);
          if (data.url && webViewRef.current) {
            const baseUrl = 'https://app.stridecampus.com';
            const fullUrl = data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;
            webViewRef.current.stopLoading();
            webViewRef.current.reload();
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(`
                window.location.href = '${fullUrl}';
                true;
              `);
            }, 100);
            console.log('✅ Navigation executed to:', fullUrl);
          }
          break;

        case 'AUTH_CALLBACK':
          console.log('🔐 Handling auth callback:', data.url);
          if (data.url && webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              // Handle the auth callback in the web app
              if (window.location.pathname === '/auth/callback') {
                // Extract URL parameters and handle auth
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const error = urlParams.get('error');
                
                if (code) {
                  // Exchange code for session
                  window.supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
                    if (error) {
                      console.error('Auth callback error:', error);
                    } else if (data.session) {
                      console.log('Auth successful, redirecting...');
                      window.location.href = '/arena';
                    }
                  });
                } else if (error) {
                  console.error('Auth error:', error);
                  window.location.href = '/auth';
                }
              } else {
                // Navigate to the callback URL
                window.location.href = '${data.url}';
              }
              true;
            `);
            console.log('✅ Auth callback handled');
          }
          break;

        case 'TEST_NOTIFICATION':
          console.log('🧪 WebView requesting test notification...');
          // Send a test notification
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Test Notification 🎉',
              body: 'This is a test notification from the mobile app!',
              data: { type: 'test', timestamp: new Date().toISOString() },
            },
            trigger: null, // Send immediately
          });
          break;

        case 'TRIGGER_TOKEN_SYNC':
        case 'TRIGGER_FCM_TOKEN_SYNC':
          console.log('🔄 WebView requesting FCM token sync for user:', data.userId);
          // Check for pending FCM token sync
          try {
            const pendingToken = await AsyncStorage.getItem('pendingPureFCMTokenSync');
            if (pendingToken) {
              console.log('🔄 Found pending FCM token, syncing to database...');
              await syncTokenToDatabase(pendingToken);
              await AsyncStorage.removeItem('pendingPureFCMTokenSync');
              
              // Notify WebView that FCM token was synced
              if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'FCM_TOKEN_SYNC_COMPLETED',
                  success: true,
                  token: pendingToken
                }));
              }
            } else {
              console.log('⚠️ No pending FCM token found for sync');
            }
          } catch (error) {
            console.error('❌ Error syncing pending FCM token:', error);
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'FCM_TOKEN_SYNC_COMPLETED',
                success: false,
                error: error instanceof Error ? error.message : String(error)
              }));
            }
          }
          break;
          
        default:
          console.log('❓ Unhandled message from WebView:', data);
      }
    } catch (error) {
      console.error('❌ Error parsing message from WebView:', error);
    }
  };

  return { handleMessage };
}
