import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Platform, BackHandler, Alert, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBack && webViewRef.current) {
          //@ts-ignore
          webViewRef.current.goBack();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  //@ts-ignore
  const onNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  const onLoadEnd = () => {
    if (!hasInitialLoad) {
      setHasInitialLoad(true);
    }
  };

  //@ts-ignore
  const onError = (syntheticEvent) => {
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
        // Cache settings for offline availability
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK" // This will use cache when available
        applicationNameForUserAgent="StrideCampusApp/1.0"
        // Additional caching options
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