'use client';
import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AuthScreen } from '@/components/onboarding/AuthScreen';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/utils/supabaseClient';

// Create a component that uses useSearchParams and wrap it with Suspense
function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { session, loading: authLoading, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const data  = supabase.auth.getUser();
  //@ts-ignore
  const user = data.user;

  // Check if current user needs email verification
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (user && user.email && !user.email_confirmed_at) {
        setNeedsVerification(true);
        setVerificationEmail(user.email);
      } else if (user && user.email_confirmed_at) {
        // User is verified, redirect to main app
        router.push('/arena');
      }
    };

    checkVerificationStatus();
  }, [user, router]);

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event in page:', event, session?.user?.email_confirmed_at);
        
        if (session?.user) {
          if (session.user.email_confirmed_at) {
            // User is verified, redirect to main app
            toast({
              title: 'Email verified!',
              description: 'Welcome to the platform.',
            });
            router.push('/arena');
          } else if (session.user.email) {
            // User exists but not verified
            setNeedsVerification(true);
            setVerificationEmail(session.user.email);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignUp = useCallback(async (email: string, password: string, username: string) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, username, referralCode || undefined);
      if (error) throw error;

      // Set verification state immediately
      setNeedsVerification(true);
      setVerificationEmail(email);

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });

    } catch (error) {
      console.error('Signup error:', error);
      setNeedsVerification(false);
      setVerificationEmail('');
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign up',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signUp, referralCode]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      // Don't show success toast or redirect here - let the auth listener handle it
      // This allows the verification check to happen first
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign in',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signIn]);

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleVerificationComplete = useCallback(() => {
    setNeedsVerification(false);
    setVerificationEmail('');
    toast({
      title: 'Email verified!',
      description: 'Welcome to the platform.',
    });
    router.push('/arena');
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <Layout showNavigation={false}>
      <AuthScreen 
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
        onBack={handleBack}
        user={user}
        referralCode={referralCode || undefined}
        isLoading={isLoading || authLoading}
        needsVerification={needsVerification}
        verificationEmail={verificationEmail}
        onVerificationComplete={handleVerificationComplete}
      />
    </Layout>
  );
}

// Main export with Suspense boundary
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