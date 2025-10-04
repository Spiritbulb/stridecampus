'use client';
import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useApp } from '@/contexts/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@/utils/supabaseClient';

// Create a wrapper component to use useSearchParams
function IndexContent() {
  const router = useRouter();
  const { 
    currentScreen, 
    isTransitioning, 
    handleScreenTransition, 
    handleNavigateToAuth,
    user: appUser,
    isAuthenticated,
    isLoading: authLoading,
    needsEmailVerification
  } = useApp();
  
  const { loginWithRedirect } = useAuth0();
  const searchParams = useSearchParams();
  
  // Get Supabase user data
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loadingSupabaseUser, setLoadingSupabaseUser] = useState(true);
  
  // State for email verification modal
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const userId = supabaseUser?.id;
  
  // Fetch Supabase user data when authenticated
  useEffect(() => {
    const fetchSupabaseUser = async () => {
      if (!isAuthenticated || !appUser?.email) {
        setLoadingSupabaseUser(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', appUser.email)
          .single();
        
        if (error) {
          console.error('Error fetching Supabase user:', error);
        } else {
          setSupabaseUser(data);
        }
      } catch (error) {
        console.error('Error fetching Supabase user:', error);
      } finally {
        setLoadingSupabaseUser(false);
      }
    };
    
    fetchSupabaseUser();
  }, [isAuthenticated, appUser]);
  
  // Enhanced useTransactions hook with additional functionality
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions,
    createTransactionWithCreditsUpdate
  } = useTransactions(userId);
  
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(userId);

  // Refresh function for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (userId) {
      await Promise.all([
        refetchTransactions(),
        // Refetch Supabase user to get latest credits
        (async () => {
          if (appUser?.email) {
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('email', appUser.email)
              .single();
            if (data) setSupabaseUser(data);
          }
        })()
      ]);
    }
  }, [userId, refetchTransactions, appUser]);

  // Register refresh function for pull-to-refresh
  usePageRefresh(handleRefresh);

  // Handle URL params
  useEffect(() => {
    const message = searchParams.get('message');
    const success = searchParams.get('success');
    
    if (message === 'verify-email') {
      setShowEmailVerification(true);
      toast({
        title: 'Check your email',
        description: 'We sent a verification link to your email address.',
      });
    }
    
    if (success === 'true') {
      toast({
        title: 'Success!',
        description: 'Authentication completed successfully.',
      });
    }
  }, [searchParams]);

  // Show email verification modal if needed
  useEffect(() => {
    if (needsEmailVerification) {
      setShowEmailVerification(true);
    }
  }, [needsEmailVerification]);

  const handleResendVerification = useCallback(async () => {
    if (!appUser?.email) return;
    
    setIsResending(true);
    try {
      // Trigger Auth0 verification email resend
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          login_hint: appUser.email
        }
      });
      
      toast({
        title: 'Verification email sent',
        description: 'Check your inbox for the verification link.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend verification email',
        variant: 'destructive'
      });
    } finally {
      setIsResending(false);
    }
  }, [appUser, loginWithRedirect]);

  // Helper function to create transactions with proper error handling
  const handleCreateTransaction = useCallback(async (
    amount: number,
    description: string,
    type: 'earned' | 'spent' | 'bonus' | 'refund',
    referenceId?: string
  ) => {
    if (!supabaseUser) return false;

    try {
      const newBalance = supabaseUser.credits + amount;
      
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

      // Update local user state
      setSupabaseUser(prev => prev ? { ...prev, credits: newBalance } : null);

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
  }, [supabaseUser, createTransactionWithCreditsUpdate]);

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
  if (authLoading || loadingSupabaseUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <p className="text-muted-foreground">Setting things up...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!authLoading && !isAuthenticated) {
    handleNavigateToAuth();
    return null;
  }

  // Show email verification notice
  if (needsEmailVerification) {
    return (
      <Layout showNavigation={false}>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Verify Your Email</h1>
              <p className="text-muted-foreground">
                We sent a verification link to <strong>{appUser?.email}</strong>
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in your email to verify your account and continue.
              </p>
              
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>
              
              <button
                onClick={() => router.push('/auth')}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading if Supabase user not yet loaded
  if (!supabaseUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout showNavigation={currentScreen === 'dashboard'}>
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        
        {currentScreen === 'welcome-credits' && (
          <WelcomeScreen 
            credits={supabaseUser.credits}
            onContinue={() => handleScreenTransition('dashboard')}
          />
        )}
        
        {currentScreen === 'dashboard' && (
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="large" />
            </div>
          }>
            <Dashboard 
              user={supabaseUser}
              transactions={transactions}
              leaderboard={leaderboard}
              isLoading={{
                transactions: transactionsLoading,
                leaderboard: leaderboardLoading,
                auth: authLoading || loadingSupabaseUser
              }}
              onCreateTransaction={handleCreateTransaction}
              onRefetchTransactions={refetchTransactions}
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