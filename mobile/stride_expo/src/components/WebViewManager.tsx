import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar, BackHandler, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';

interface WebViewManagerProps {
  onMessage: (event: any) => void;
  onUserIdChange: (userId: string | null) => void;
  expoPushToken: string;
  isTokenRegistered: boolean;
  notificationPermission: string;
  webViewRef?: React.RefObject<WebView | null>;
  onTokenRequest?: () => Promise<void>;
}

export default function WebViewManager({ 
  onMessage, 
  onUserIdChange, 
  expoPushToken, 
  isTokenRegistered, 
  notificationPermission,
  webViewRef: externalWebViewRef,
  onTokenRequest
}: WebViewManagerProps) {
  const internalWebViewRef = useRef<WebView | null>(null);
  const webViewRef = externalWebViewRef || internalWebViewRef;
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Handle deep links for email verification
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      // Check if it's an auth callback URL
      if (url.includes('auth/callback') || url.includes('code=')) {
        // Extract the URL parameters and send to WebView
        const webUrl = url.replace('stridecampus://', 'https://app.stridecampus.com/');
        
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'AUTH_CALLBACK',
            url: webUrl
          }));
        }
      }
    };

    // Listen for deep links when app is already running
    const linkingListener = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link when app is opened from a closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      linkingListener.remove();
    };
  }, []);

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
      console.log('✅ WebView initial load completed');
      
      // Send initial data to WebView
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'APP_READY',
          fcmToken: expoPushToken, // Using FCM token
          isTokenRegistered: isTokenRegistered,
          notificationPermission: notificationPermission,
          platform: Platform.OS,
          version: '1.0.0'
        }));
        console.log('📤 Initial app data sent to WebView');
      }
      
      // Set up periodic cache refresh to ensure real-time updates
      setupCacheRefresh();
    }
  };

  // Enhanced cache management for real-time updates
  const setupCacheRefresh = () => {
    // Clear cache every 2 minutes to ensure fresh content
    const cacheRefreshInterval = setInterval(() => {
      if (webViewRef.current) {
        console.log('🔄 Refreshing WebView cache for real-time updates');
        webViewRef.current.injectJavaScript(`
          // Clear various caches
          if (window.caches) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
          
          // Clear localStorage cache markers
          if (window.localStorage) {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.includes('cache') || key.includes('timestamp')) {
                localStorage.removeItem(key);
              }
            });
          }
          
          // Force refresh of critical data
          if (window.location && window.location.reload) {
            // Only reload if we're not in the middle of user interaction
            if (!document.activeElement || document.activeElement.tagName === 'BODY') {
              window.location.reload();
            }
          }
          
          true;
        `);
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    // Store interval ID for cleanup
    return () => clearInterval(cacheRefreshInterval);
  };

  const onError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    
    Alert.alert(
      "Connection Error",
      "Unable to load content. Please check your internet connection.",
      [{ text: "OK" }]
    );
  };

  // Enhanced message handler with better error handling and logging
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Message received from WebView:', data);
      
      switch (data.type) {
        case 'REQUEST_PUSH_TOKEN':
        case 'REQUEST_FCM_TOKEN':
          console.log('📤 WebView requesting FCM token...');
          
          // If we have a token request handler, use it
          if (onTokenRequest) {
            await onTokenRequest();
          }
          
          // Send current token to WebView
          if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'FCM_TOKEN',
              token: expoPushToken,
              isRegistered: isTokenRegistered,
              permission: notificationPermission,
              timestamp: new Date().toISOString()
            }));
          }
          break;

        case 'REQUEST_PERMISSION_STATUS':
          console.log('📤 WebView requesting permission status...');
          if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'PERMISSION_STATUS',
              permission: notificationPermission
            }));
          }
          break;

        case 'USER_ID_SET':
          console.log('👤 User ID received from WebView:', data.userId);
          onUserIdChange(data.userId);
          
          // When user ID is set, trigger FCM token sync if we have a pending token
          if (data.userId && webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'TRIGGER_FCM_TOKEN_SYNC',
              userId: data.userId
            }));
          }
          
          // Also send the current FCM token to the web app for immediate sync
          if (data.userId && expoPushToken && webViewRef.current) {
            console.log('📤 Sending FCM token to WebView for immediate sync with user ID:', data.userId);
            webViewRef.current.postMessage(JSON.stringify({
              type: 'FCM_TOKEN',
              token: expoPushToken,
              isRegistered: isTokenRegistered,
              permission: notificationPermission,
              userId: data.userId,
              timestamp: new Date().toISOString()
            }));
          }
          break;
          
        default:
          // Pass other messages to parent handler
          onMessage(event);
      }
    } catch (error) {
      console.error('❌ Error parsing message from WebView:', error);
    }
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
        onMessage={handleMessage}
        // Enhanced cache settings for better performance and real-time updates
        cacheEnabled={false} // Disable cache to ensure real-time updates
        cacheMode="LOAD_NO_CACHE" // Always load fresh content
        applicationNameForUserAgent="StrideCampusApp/1.0"
        thirdPartyCookiesEnabled={true}
        allowFileAccess={true}
        // Enhanced WebView settings for better notification support
        allowsBackForwardNavigationGestures={true}
        allowsLinkPreview={false}
        // Add debugging for development
        onLoadStart={() => console.log('🔄 WebView loading started')}
        onLoadProgress={(event) => {
          if (event.nativeEvent.progress === 1) {
            console.log('✅ WebView loading completed');
          }
        }}
        // Enhanced settings for resilience and real-time updates
        mixedContentMode="compatibility"
        mediaPlaybackRequiresUserAction={false}
        // Force fresh content on every load
        onLoad={() => {
          console.log('🔄 WebView loaded, ensuring fresh content');
          webViewRef.current?.injectJavaScript(`
            // Clear any stale cache data
            if (window.localStorage) {
              const now = Date.now();
              window.localStorage.setItem('lastAppRefresh', now.toString());
            }
            
            // Force refresh of critical app data
            if (window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('appRefresh'));
            }
            
            true;
          `);
        }}
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
