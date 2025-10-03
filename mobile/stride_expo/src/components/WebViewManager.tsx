import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Platform, 
  StatusBar, 
  BackHandler, 
  Alert, 
  ActivityIndicator,
  AppState,
  AppStateStatus
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import NetInfo from '@react-native-community/netinfo';

interface WebViewManagerProps {
  onMessage: (event: any) => void;
  onUserIdChange: (userId: string | null) => void;
  expoPushToken: string;
  isTokenRegistered: boolean;
  notificationPermission: string;
  webViewRef?: React.RefObject<WebView | null>;
  onTokenRequest?: () => Promise<void>;
}

// Constants
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_COUNT = 3;
const LOAD_TIMEOUT_WARNING = 10000; // 10 seconds
const APP_VERSION = '1.0.0';
const WEB_URL = 'https://app.stridecampus.com';

const VALID_MESSAGE_TYPES = [
  'REQUEST_PUSH_TOKEN',
  'REQUEST_FCM_TOKEN',
  'REQUEST_PERMISSION_STATUS',
  'USER_ID_SET',
  'AUTH_CALLBACK',
  'OPEN_EXTERNAL_LINK'
] as const;

type MessageType = typeof VALID_MESSAGE_TYPES[number];

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
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const loadStartTimeRef = useRef<number>(0);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized injected JavaScript for cache management
  const cacheRefreshScript = useMemo(() => `
    (function() {
      const CACHE_MAX_AGE = ${CACHE_MAX_AGE};
      const now = Date.now();
      
      if (window.localStorage) {
        const lastUpdate = localStorage.getItem('lastDataUpdate');
        if (!lastUpdate || (now - parseInt(lastUpdate)) > CACHE_MAX_AGE) {
          window.dispatchEvent(new CustomEvent('forceDataRefresh'));
          localStorage.setItem('lastDataUpdate', now.toString());
        }
      }
    })();
    true;
  `, []);

  const appRefreshScript = useMemo(() => `
    (function() {
      if (window.localStorage) {
        window.localStorage.setItem('lastAppRefresh', Date.now().toString());
      }
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('appRefresh'));
      }
    })();
    true;
  `, []);

  // Optimized deep link handler with useCallback
  const handleDeepLink = useCallback((url: string) => {
    console.log('🔗 Deep link received:', url);
    
    if (url.includes('auth/callback') || url.includes('code=')) {
      const webUrl = url.replace('stridecampus://', `${WEB_URL}/`);
      
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'AUTH_CALLBACK',
        url: webUrl
      }));
    }
  }, []);

  // Deep link setup
  useEffect(() => {
    const linkingListener = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => linkingListener.remove();
  }, [handleDeepLink]);

  // Hardware back button handler
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

  // Optimized cache refresh function
  const refreshWebViewCache = useCallback(() => {
    if (webViewRef.current) {
      console.log('🔄 Refreshing WebView cache');
      webViewRef.current.injectJavaScript(cacheRefreshScript);
    }
  }, [cacheRefreshScript]);

  // Network status monitoring with optimized handling
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && hasError) {
        console.log('🌐 Connection restored, reloading WebView');
        webViewRef.current?.reload();
        setHasError(false);
        setRetryCount(0);
      }
      
      if (webViewRef.current && hasInitialLoad) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'NETWORK_STATUS',
          isOnline: state.isConnected
        }));
      }
    });

    return () => unsubscribe();
  }, [hasError, hasInitialLoad]);

  // App state monitoring
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && hasInitialLoad) {
        console.log('🔄 App came to foreground, refreshing cache');
        refreshWebViewCache();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [hasInitialLoad, refreshWebViewCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      webViewRef.current?.stopLoading();
    };
  }, []);

  // Navigation state change handler
  const onNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    // Hide loading spinner when navigation completes
    if (!navState.loading) {
      setIsLoading(false);
    }
  }, []);

  // Load start handler with timeout monitoring
  const onLoadStart = useCallback(() => {
    // Only show loading for initial load, not for navigation
    if (!hasInitialLoad) {
      setIsLoading(true);
    }
    loadStartTimeRef.current = Date.now();
    setHasError(false);
    
    // Clear previous timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // Set new timeout for load warning
    loadTimeoutRef.current = setTimeout(() => {
      if (!hasInitialLoad) {
        console.warn('⚠️ WebView taking longer than expected to load');
      }
    }, LOAD_TIMEOUT_WARNING);
  }, [hasInitialLoad]);

  // Send initial app data to WebView
  const sendInitialData = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'APP_READY',
        fcmToken: expoPushToken,
        isTokenRegistered,
        notificationPermission,
        platform: Platform.OS,
        version: APP_VERSION
      }));
      console.log('📤 Initial app data sent to WebView');
    }
  }, [expoPushToken, isTokenRegistered, notificationPermission]);

  // Load end handler
  const onLoadEnd = useCallback(() => {
    setIsLoading(false);
    
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    if (!hasInitialLoad) {
      setHasInitialLoad(true);
      const loadTime = Date.now() - loadStartTimeRef.current;
      console.log(`✅ WebView initial load completed in ${loadTime}ms`);
      sendInitialData();
    }
  }, [hasInitialLoad, sendInitialData]);

  // Load progress handler
  const onLoadProgress = useCallback(({ nativeEvent }: any) => {
    if (nativeEvent.progress === 1 && loadStartTimeRef.current > 0) {
      const loadTime = Date.now() - loadStartTimeRef.current;
      console.log(`✅ WebView loading completed in ${loadTime}ms`);
    }
  }, []);

  // Error handler with exponential backoff
  const onError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    
    setHasError(true);
    setIsLoading(false);
    
    if (retryCount < MAX_RETRY_COUNT) {
      const retryDelay = Math.pow(2, retryCount) * 1000;
      console.log(`🔄 Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRY_COUNT})`);
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        webViewRef.current?.reload();
      }, retryDelay);
    } else {
      Alert.alert(
        "Connection Error",
        "Unable to load content. Please check your internet connection.",
        [
          { 
            text: "Retry", 
            onPress: () => {
              setRetryCount(0);
              setHasError(false);
              setIsLoading(true);
              webViewRef.current?.reload();
            }
          },
          { text: "OK" }
        ]
      );
    }
  }, [retryCount]);

  // Message validation
  const validateWebViewMessage = useCallback((data: any): data is { type: MessageType; [key: string]: any } => {
    return data && 
           typeof data === 'object' && 
           VALID_MESSAGE_TYPES.includes(data.type);
  }, []);

  // Enhanced message handler
  const handleMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Message received from WebView:', data);
      
      if (!validateWebViewMessage(data)) {
        console.warn('⚠️ Invalid message format from WebView:', data);
        return;
      }
      
      switch (data.type) {
        case 'REQUEST_PUSH_TOKEN':
        case 'REQUEST_FCM_TOKEN':
          console.log('📤 WebView requesting FCM token...');
          
          if (onTokenRequest) {
            await onTokenRequest();
          }
          
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'FCM_TOKEN',
            token: expoPushToken,
            isRegistered: isTokenRegistered,
            permission: notificationPermission,
            timestamp: new Date().toISOString()
          }));
          break;

        case 'REQUEST_PERMISSION_STATUS':
          console.log('📤 WebView requesting permission status...');
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'PERMISSION_STATUS',
            permission: notificationPermission
          }));
          break;

        case 'OPEN_EXTERNAL_LINK':
          console.log('🔗 Opening external link:', data.url);
          if (data.url) {
            Linking.openURL(data.url).catch(err => {
              console.error('Failed to open URL:', err);
              Alert.alert('Error', 'Unable to open link');
            });
          }
        break;

        case 'USER_ID_SET':
          console.log('👤 User ID received from WebView:', data.userId);
          onUserIdChange(data.userId);
          
          if (data.userId && webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'TRIGGER_FCM_TOKEN_SYNC',
              userId: data.userId
            }));
            
            if (expoPushToken) {
              console.log('📤 Sending FCM token to WebView for immediate sync');
              webViewRef.current.postMessage(JSON.stringify({
                type: 'FCM_TOKEN',
                token: expoPushToken,
                isRegistered: isTokenRegistered,
                permission: notificationPermission,
                userId: data.userId,
                timestamp: new Date().toISOString()
              }));
            }
          }
          break;
          
        default:
          onMessage(event);
      }
    } catch (error) {
      console.error('❌ Error parsing message from WebView:', error);
    }
  }, [
    validateWebViewMessage,
    onTokenRequest,
    expoPushToken,
    isTokenRegistered,
    notificationPermission,
    onUserIdChange,
    onMessage
  ]);

  // On load handler
  const onLoad = useCallback(() => {
    console.log('🔄 WebView loaded, ensuring fresh content');
    webViewRef.current?.injectJavaScript(appRefreshScript);
  }, [appRefreshScript]);

  const onShouldStartLoadWithRequest = useCallback((request: any) => {
    const { url } = request;
    console.log('🔗 Navigation intercepted:', url);
    
    // Allow navigation within your app domain
    if (url.startsWith(WEB_URL)) {
      return true;
    }
    
    // Handle auth callbacks
    if (url.includes('auth/callback') || url.includes('code=')) {
      return true;
    }
    
    // For all other URLs (external links), open in browser
    console.log('🌐 Opening external URL in browser:', url);
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
    });
    
    // Prevent WebView from loading the URL
    return false;
  }, []);

  return (
    <View style={styles.container}>
      {/* Only show loading spinner during initial load */}
      {isLoading && !hasInitialLoad && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      
      <WebView 
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={[styles.webview, isLoading && hasInitialLoad === false && styles.hiddenWebview]}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
        sharedCookiesEnabled
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={onLoadStart}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadEnd={onLoadEnd}
        onLoadProgress={onLoadProgress}
        onError={onError}
        onMessage={handleMessage}
        onLoad={onLoad}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        applicationNameForUserAgent={`StrideCampusApp/${APP_VERSION}`}
        thirdPartyCookiesEnabled
        allowFileAccess
        allowsBackForwardNavigationGestures
        allowsLinkPreview={false}
        mixedContentMode="compatibility"
        mediaPlaybackRequiresUserAction={false}
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
  hiddenWebview: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
});