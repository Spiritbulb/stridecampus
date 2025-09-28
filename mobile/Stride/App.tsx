import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Platform, BackHandler, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure how notifications should be handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string>('');

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification interactions (when user taps on notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // You can handle navigation based on notification data here
      const notificationData = response.notification.request.content.data;
      if (notificationData.url && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'NAVIGATE_TO_URL',
          url: notificationData.url
        }));
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Send push token to WebView when it loads
  useEffect(() => {
    if (hasInitialLoad && expoPushToken && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'EXPO_PUSH_TOKEN',
        token: expoPushToken
      }));
    }
  }, [hasInitialLoad, expoPushToken]);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      // Create notification channels for different types of notifications
      await Promise.all([
        Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#f23b36',
          sound: 'notification_sound.wav',
        }),
        Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#f23b36',
          sound: 'notification_sound.wav',
          description: 'Direct messages and chat notifications',
        }),
        Notifications.setNotificationChannelAsync('social', {
          name: 'Social',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#f23b36',
          description: 'Likes, comments, and social interactions',
        }),
        Notifications.setNotificationChannelAsync('events', {
          name: 'Events',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250, 250, 250],
          lightColor: '#f23b36',
          description: 'Campus events and announcements',
        }),
        Notifications.setNotificationChannelAsync('academic', {
          name: 'Academic',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500],
          lightColor: '#f23b36',
          description: 'Study reminders and academic notifications',
        }),
      ]);
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Push notifications are disabled. You can enable them in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo Push Token:', token);
      } catch (e) {
        console.error('Error getting push token:', e);
        token = `${e}`;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Handle messages from WebView
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'REQUEST_PUSH_TOKEN':
          // WebView is requesting the push token
          if (expoPushToken && webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'EXPO_PUSH_TOKEN',
              token: expoPushToken
            }));
          } else {
            // No token available, send empty response
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'EXPO_PUSH_TOKEN',
              token: null
            }));
          }
          break;

        case 'REQUEST_PERMISSION_STATUS':
          // WebView is requesting permission status
          Notifications.getPermissionsAsync().then(({ status }) => {
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'PERMISSION_STATUS',
                permission: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'default'
              }));
            }
          });
          break;
          
        case 'REQUEST_NOTIFICATION_PERMISSION':
          // WebView is requesting to check/request notification permission
          registerForPushNotificationsAsync().then(token => {
            if (webViewRef.current) {
              if (token) {
                setExpoPushToken(token);
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'EXPO_PUSH_TOKEN',
                  token: token
                }));
              } else {
                // Permission denied or failed
                webViewRef.current.postMessage(JSON.stringify({
                  type: 'NOTIFICATION_PERMISSION_DENIED',
                  message: 'Permission denied or failed to get token'
                }));
              }
            }
          });
          break;

        case 'NAVIGATE_TO_URL':
          // Handle navigation requests from the WebView
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
          }
          break;
          
        default:
          console.log('Unhandled message from WebView:', data);
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  const onNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  const onLoadEnd = () => {
    if (!hasInitialLoad) {
      setHasInitialLoad(true);
    }
  };

  const onError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    
    Alert.alert(
      "Connection Error",
      "Unable to load content. Please check your internet connection.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={Platform.OS === 'android'}
      />
      
      <WebView 
        ref={webViewRef}
        source={{ uri: 'https://app.stridecampus.com' }}
        style={styles.webview}
        allowsInlineMediaPlayback
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        sharedCookiesEnabled={true}
        onNavigationStateChange={onNavigationStateChange}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onMessage={onMessage}
        // Cache settings for offline availability
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        applicationNameForUserAgent="StrideCampusApp/1.0"
        thirdPartyCookiesEnabled={true}
        allowFileAccess={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});