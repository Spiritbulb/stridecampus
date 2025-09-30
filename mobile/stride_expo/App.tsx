import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import PureFCMNotificationManager from './src/components/PureFCMNotificationManager';
import WebViewManager from './src/components/WebViewManager';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [userId, setUserId] = useState<string | null>(null);

  // Store refs to notification manager methods
  const notificationManagerRef = useRef<{
    registerForPureFCMNotificationsAsync: () => Promise<string | null>;
    syncPureFCMTokenToDatabase: (token: string) => Promise<void>;
  } | null>(null);

  const handleTokenChange = useCallback((token: string, isRegistered: boolean) => {
    console.log('📱 FCM Token updated:', token ? 'Token available' : 'No token');
    setFcmToken(token);
    setIsTokenRegistered(isRegistered);
    
    // Token will be sent to WebView by WebViewManager when it changes
  }, []);

  const handlePermissionChange = useCallback((permission: string) => {
    console.log('🔔 Permission status changed:', permission);
    setNotificationPermission(permission);
  }, []);

  const handleUserIdChange = useCallback((newUserId: string | null) => {
    console.log('👤 User ID changed:', newUserId);
    setUserId(newUserId);
  }, []);

  // Handler for token requests from WebViewManager
  const handleTokenRequest = useCallback(async () => {
    if (notificationManagerRef.current) {
      try {
        const token = await notificationManagerRef.current.registerForPureFCMNotificationsAsync();
        if (token) {
          handleTokenChange(token, true);
        }
      } catch (error) {
        console.error('❌ Error generating fresh FCM token:', error);
      }
    }
  }, [handleTokenChange]);

  // Enhanced message handler - WebViewManager will handle most WebView communication
  const handleMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Message received from WebView:', data);
      
      switch (data.type) {
        case 'REQUEST_NOTIFICATION_PERMISSION':
        case 'REQUEST_FCM_PERMISSION':
          console.log('📤 WebView requesting FCM notification permission...');
          if (notificationManagerRef.current) {
            const token = await notificationManagerRef.current.registerForPureFCMNotificationsAsync();
            if (token) {
              handleTokenChange(token, true);
            }
          }
          break;

        case 'USER_ID_SET':
          console.log('👤 User ID received from WebView:', data.userId);
          handleUserIdChange(data.userId);
          
          // Sync token when user logs in
          if (data.userId && fcmToken && notificationManagerRef.current) {
            await notificationManagerRef.current.syncPureFCMTokenToDatabase(fcmToken);
          }
          break;

        case 'TRIGGER_TOKEN_SYNC':
        case 'TRIGGER_FCM_TOKEN_SYNC':
          console.log('🔄 WebView requesting FCM token sync for user:', data.userId);
          if (fcmToken && notificationManagerRef.current) {
            try {
              await notificationManagerRef.current.syncPureFCMTokenToDatabase(fcmToken);
            } catch (error) {
              console.error('❌ Error syncing FCM token:', error);
            }
          }
          break;

        default:
          console.log('❓ Unhandled message from WebView:', data);
      }
    } catch (error) {
      console.error('❌ Error parsing message from WebView:', error);
    }
  }, [fcmToken, handleTokenChange, handleUserIdChange]);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={Platform.OS === 'android'}
      />
      
      {/* Render notification manager as component */}
      <PureFCMNotificationManager
        webViewRef={webViewRef}
        onTokenChange={handleTokenChange}
        onPermissionChange={handlePermissionChange}
        userId={userId}
        ref={notificationManagerRef}
      />
      
      {/* Use WebViewManager component instead of direct WebView */}
      <WebViewManager
        onMessage={handleMessage}
        onUserIdChange={handleUserIdChange}
        expoPushToken={fcmToken}
        isTokenRegistered={isTokenRegistered}
        notificationPermission={notificationPermission}
        webViewRef={webViewRef}
        onTokenRequest={handleTokenRequest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});