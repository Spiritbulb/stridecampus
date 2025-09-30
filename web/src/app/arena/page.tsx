'use client';
import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabaseClient';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { SplashScreen } from '@/components/onboarding/SplashScreen';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useApp } from '@/contexts/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmailVerificationModal } from '@/components/auth/EmailVerificationModal';

// Create a wrapper component to use useSearchParams
function IndexContent() {
  const router = useRouter();
  const { 
    currentScreen, 
    isTransitioning, 
    handleScreenTransition, 
    handleNavigateToAuth,
    requiresEmailVerification,
    checkAuthState
  } = useApp();
  
  const { session, user, loading: authLoading } = useAuth();
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
    createTransactionWithCreditsUpdate
  } = useTransactions(userId);
  
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(userId);
  const searchParams = useSearchParams();

  // Check auth state when component mounts or returns from auth page
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Refresh function for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (userId) {
      await Promise.all([
        refetchTransactions(),
        // Add other refresh functions as needed
      ]);
    }
  }, [userId, refetchTransactions]);

  // Register refresh function for pull-to-refresh
  usePageRefresh(handleRefresh);

  // Check if user needs email verification (using context state)
  useEffect(() => {
    if (requiresEmailVerification && currentScreen === 'dashboard') {
      setShowEmailVerification(true);
    } else {
      setShowEmailVerification(false);
    }
  }, [requiresEmailVerification, currentScreen]);

  // Handle successful sign up from auth page
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'verify-email' && user) {
      toast({
        title: 'Check your email',
        description: 'We sent a verification link to your email address.',
      });
    }
    
    // Check if we just returned from auth with a success
    const success = searchParams.get('success');
    if (success === 'true') {
      toast({
        title: 'Success!',
        description: 'Authentication completed successfully.',
      });
    }
  }, [searchParams, user]);

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

  // Helper function to create transactions with proper error handling
  const handleCreateTransaction = useCallback(async (
    amount: number,
    description: string,
    type: 'earned' | 'spent' | 'bonus' | 'refund',
    referenceId?: string
  ) => {
    if (!user) return false;

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
  useEffect(() => {
    if (transactionsError) {
      toast({
        title: 'Failed to Load Transactions',
        description: transactionsError,
        variant: 'destructive'
      });
    }
  }, [transactionsError]);

  // Show loading state while initializing
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <p className="text-muted-foreground">Setting things up...</p>
        </div>
      </div>
    );
  }

  if (!authLoading && !user) {
    handleNavigateToAuth();
    return null;
  }

  return (
    <Layout showNavigation={currentScreen === 'dashboard'}>
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        
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

        {/* Show loading state when transitioning between screens */}
        {isTransitioning && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingSpinner size="large" />
          </div>
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