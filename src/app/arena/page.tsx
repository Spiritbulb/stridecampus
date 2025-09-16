// app/page.tsx - Make sure to handle the referral code properly
'use client';
import React, { Suspense, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabaseClient';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { SplashScreen } from '@/components/onboarding/SplashScreen';
import { AuthScreen } from '@/components/onboarding/AuthScreen';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useApp } from '@/contexts/AppContext';
import { useSearchParams } from 'next/navigation';

// Create a wrapper component to use useSearchParams
function IndexContent() {
  const { currentScreen, isTransitioning, handleScreenTransition, handleSuccessfulSignUp } = useApp();
  const { session, user, loading: authLoading, signUp, signIn } = useAuth();
  const userId = user?.id;
  const { transactions, loading: transactionsLoading } = useTransactions(userId);
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(userId);
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  const handleSignUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      const { error } = await signUp(email, password, username, referralCode || undefined);
      if (error) throw error;
      handleSuccessfulSignUp();
      toast({
        title: 'Welcome!',
        description: 'Account created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign up',
        variant: 'destructive'
      });
      throw error;
    }
  }, [signUp, handleSuccessfulSignUp, referralCode]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      toast({
        title: 'Welcome back!',
        description: 'Signed in successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign in',
        variant: 'destructive'
      });
      throw error;
    }
  }, [signIn]);

  if (authLoading && transactionsLoading && leaderboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <Layout showNavigation={currentScreen === 'dashboard'}>
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        
        {currentScreen === 'auth' && (
          <AuthScreen 
            onSignUp={handleSignUp}
            onSignIn={handleSignIn}
            onBack={() => handleScreenTransition('splash')}
            user={user}
            referralCode={referralCode || undefined}
            isLoading={authLoading}
          />
        )}
        
        {currentScreen === 'welcome-credits' && user && (
          <WelcomeScreen 
            credits={user.credits}
            onContinue={() => handleScreenTransition('dashboard')}
          />
        )}
        
        {currentScreen === 'dashboard' && user && (
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="large" />
            </div>
          }>
            <Dashboard 
              user={user}
              transactions={transactions}
              leaderboard={leaderboard}
              isLoading={{
                transactions: transactionsLoading,
                leaderboard: leaderboardLoading,
                auth: authLoading
              }}
            />
          </Suspense>
        )}
      </div>
    </Layout>
  );
}

// Main component with Suspense
export default function Index() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    }>
      <IndexContent />
    </Suspense>
  );
}