// app/page.tsx - Updated to check email verification from auth user
'use client';
import React, { Suspense, useCallback, useState, useEffect } from 'react';
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
import { EmailVerificationModal } from '@/components/auth/EmailVerificationModal'; // New component

// Create a wrapper component to use useSearchParams
function IndexContent() {
  const { currentScreen, isTransitioning, handleScreenTransition, handleSuccessfulSignUp } = useApp();
  const { session, user, loading: authLoading, signUp, signIn } = useAuth();
  const userId = user?.id;
  
  // State for email verification modal
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Enhanced useTransactions hook with additional functionality
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions,
    createTransaction,
    createTransactionWithCreditsUpdate
  } = useTransactions(userId);
  
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(userId);
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  // Check if user needs email verification
  useEffect(() => {
    if (session?.user && !session.user.email_confirmed_at && currentScreen === 'dashboard') {
      setShowEmailVerification(true);
    } else {
      setShowEmailVerification(false);
    }
  }, [session, currentScreen]);

  const handleResendVerification = useCallback(async () => {
    if (!session?.user?.email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Verification email sent',
        description: 'Check your inbox for the verification link.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend verification email',
        variant: 'destructive'
      });
    } finally {
      setIsResending(false);
    }
  }, [session]);

  const handleSignUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      const { error } = await signUp(email, password, username, referralCode || undefined);
      if (error) throw error;

      // Create a welcome bonus transaction if sign up is successful
      if (userId) {
        await createTransaction({
          amount: 100, // Welcome bonus
          description: 'Welcome bonus',
          type: 'bonus',
          reference_id: `welcome_bonus_${userId}`, // Prevent duplicate welcome bonuses
        });
      }

      handleSuccessfulSignUp();
      toast({
        title: 'Welcome!',
        description: 'Account created successfully. You received 100 credits!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign up',
        variant: 'destructive'
      });
      throw error;
    }
  }, [signUp, handleSuccessfulSignUp, referralCode, userId, createTransaction]);

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

  // Helper function to create transactions with proper error handling
  const handleCreateTransaction = useCallback(async (
    amount: number,
    description: string,
    type: 'earned' | 'spent' | 'bonus' | 'refund',
    referenceId?: string
  ) => {
    if (!user) return;

    try {
      const newBalance = user.credits + amount;
      
      const { data, error } = await createTransactionWithCreditsUpdate(
        {
          amount,
          description,
          type,
          reference_id: referenceId,
        },
        newBalance
      );

      if (error) {
        toast({
          title: 'Transaction Failed',
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Transaction Successful',
        description: `${amount > 0 ? 'Earned' : 'Spent'} ${Math.abs(amount)} credits`,
      });

      return true;
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: 'Transaction Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [user, createTransactionWithCreditsUpdate]);

  // Show error toast if transactions fail to load
  React.useEffect(() => {
    if (transactionsError) {
      toast({
        title: 'Failed to Load Transactions',
        description: transactionsError,
        variant: 'destructive'
      });
    }
  }, [transactionsError]);

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
              onCreateTransaction={handleCreateTransaction}
              onRefetchTransactions={refetchTransactions}
            />
            
            {/* Email Verification Modal */}
            <EmailVerificationModal
              isOpen={showEmailVerification}
              onClose={() => setShowEmailVerification(false)}
              onResend={handleResendVerification}
              isResending={isResending}
              email={session?.user?.email}
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