import React, { useRef } from 'react';
import { View, StyleSheet, StatusBar, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = React.useState(false);

  // Handle back button press
  React.useEffect(() => {
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

  const onNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
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
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
        sharedCookiesEnabled
        onNavigationStateChange={onNavigationStateChange}
        // Cache settings
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ONLY"
        applicationNameForUserAgent="StrideCampusApp/1.0"
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