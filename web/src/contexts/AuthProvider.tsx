// app/Auth0Provider.tsx
'use client';

import { Auth0Provider as BaseAuth0Provider } from '@auth0/auth0-react';

// Extend Window interface for React Native WebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export function Auth0Provider({ children }: { children: React.ReactNode }) {
  // Get the redirect URI - this should always point to /auth
  const redirectUri = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth`
    : '';

  return (
    <BaseAuth0Provider
      domain="auth.stridecampus.com"
      clientId="98bO7G6N6xcnEjIYzbRM4TSchtqWEqiY"
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: 'https://auth.stridecampus.com/api',
        scope: 'openid profile email offline_access'
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      // Remove onRedirectCallback to let the /auth page handle post-login flow
    >
      {children}
    </BaseAuth0Provider>
  );
}