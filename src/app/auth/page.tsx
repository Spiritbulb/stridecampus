'use client';
import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AuthScreen } from '@/components/onboarding/AuthScreen';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { session, user, loading: authLoading, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = useCallback(async (email: string, password: string, username: string) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, username, referralCode || undefined);
      if (error) throw error;

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
      
      // Redirect to verification page or back to home
      router.push('/?message=verify-email');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign up',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signUp, referralCode, router]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      toast({
        title: 'Welcome back!',
        description: 'Signed in successfully.',
      });
      
      // Redirect to dashboard
      router.push('/');
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
  }, [signIn, router]);

  const handleBack = useCallback(() => {
    router.push('/');
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
      />
    </Layout>
  );
}