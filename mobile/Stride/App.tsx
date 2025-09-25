import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        source={{ uri: 'https://stridecampus.com' }}
        style={styles.webview}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
        sharedCookiesEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24
  },
  webview: {
    flex: 1,
  },
});