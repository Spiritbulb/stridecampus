// app/auth/page.tsx
'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthScreen } from '@/components/onboarding/AuthScreen';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { 
    isAuthenticated, 
    user, 
    isLoading: auth0Loading, 
    getAccessTokenSilently,
    error: auth0Error
  } = useAuth0();
  
  const [isInWebView, setIsInWebView] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // Detect WebView environment
  useEffect(() => {
    const userAgent = navigator.userAgent || '';
    setIsInWebView(userAgent.includes('StrideCampusApp'));
  }, []);

  // Check for Auth0 errors in URL
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      console.error('Auth0 error in URL:', error, errorDescription);
      setCallbackError(errorDescription || `Authentication error: ${error}`);
    }
  }, [searchParams]);

  // Handle Auth0 SDK errors
  useEffect(() => {
    if (auth0Error) {
      console.error('Auth0 SDK error:', auth0Error);
      setCallbackError(auth0Error.message || 'Authentication failed');
    }
  }, [auth0Error]);

  // Handle successful authentication and redirect
  useEffect(() => {
    const handleSuccessfulAuth = async () => {
      // Skip if already processing, still loading, not authenticated, or email not verified
      if (isProcessingAuth || auth0Loading || !isAuthenticated || !user?.email_verified) {
        return;
      }

      // Skip if there's an error
      if (callbackError) {
        return;
      }

      setIsProcessingAuth(true);

      try {
        console.log('✅ User authenticated successfully');
        console.log('User info:', { 
          email: user.email, 
          verified: user.email_verified,
          sub: user.sub 
        });

        // Get access token
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://auth.stridecampus.com/api',
            scope: 'openid profile email'
          }
        });

        console.log('✅ Access token obtained');

        // Handle WebView redirect
        if (isInWebView && window.ReactNativeWebView) {
          console.log('📱 Sending auth data to React Native WebView');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'AUTH_SUCCESS',
            token: token,
            user: {
              id: user.sub,
              email: user.email,
              name: user.name,
              picture: user.picture
            }
          }));
          return;
        }

        // Handle deep link redirect
        console.log('🔗 Attempting deep link redirect');
        const deepLinkUrl = `stridecampus://auth?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(user.sub || '')}`;
        
        // Try to open the app
        window.location.href = deepLinkUrl;
        
        // Fallback to web app after 2 seconds
        setTimeout(() => {
          console.log('⏰ Deep link timeout, redirecting to web app');
          router.push('/arena');
        }, 2000);

      } catch (error: any) {
        console.error('❌ Error in post-auth flow:', error);
        setCallbackError(error.message || 'Failed to complete authentication');
        setIsProcessingAuth(false);
      }
    };

    handleSuccessfulAuth();
  }, [
    isAuthenticated, 
    user, 
    auth0Loading, 
    isProcessingAuth,
    callbackError,
    isInWebView, 
    router, 
    getAccessTokenSilently
  ]);

  const handleBack = () => {
    router.push('/');
  };

  const handleRetry = () => {
    setCallbackError(null);
    setIsProcessingAuth(false);
    // Clear URL params and reload
    window.location.href = window.location.origin + '/auth';
  };

  // Error state
  if (callbackError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-4">
          <div className="text-red-500 text-lg font-medium">Authentication Error</div>
          <p className="text-muted-foreground">{callbackError}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading states during callback processing
  if (auth0Loading) {
    const hasAuthParams = searchParams.has('code') && searchParams.has('state');
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <p className="text-lg font-medium">
            {hasAuthParams ? 'Completing authentication...' : 'Loading...'}
          </p>
          {hasAuthParams && (
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your credentials
            </p>
          )}
        </div>
      </div>
    );
  }

  // Redirecting state after successful auth
  if (isAuthenticated && user?.email_verified && isProcessingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isInWebView ? 'Connecting to app...' : 'Opening Stride Campus app...'}
            </p>
            {!isInWebView && (
              <p className="text-sm text-muted-foreground">
                If the app doesn't open, you'll be redirected to the web version.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show auth screen for unauthenticated users or unverified emails
  return (
    <Layout showNavigation={false}>
      <AuthScreen 
        onBack={handleBack}
        user={user}
        referralCode={referralCode || undefined}
        isLoading={auth0Loading}
      />
    </Layout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}