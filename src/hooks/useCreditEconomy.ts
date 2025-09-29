import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { 
  getUserCreditSummary, 
  checkUserCredits, 
  calculateFileDownloadCost,
  generateNiaChatBonus,
  type LevelInfo,
  TransactionType,
  TransactionCategory
} from '@/utils/creditEconomy';

export interface CreditSummary {
  currentCredits: number;
  totalEarned: number;
  levelInfo: LevelInfo;
  recentTransactions: any[];
}

export function useCreditEconomy(userId: string | undefined) {
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's credit summary
  const fetchCreditSummary = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const summary = await getUserCreditSummary(userId);
      setCreditSummary(summary);
    } catch (err) {
      console.error('Error fetching credit summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credit data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Check if user has enough credits for a transaction
  const hasEnoughCredits = useCallback(async (requiredAmount: number): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      return await checkUserCredits(userId, requiredAmount);
    } catch (err) {
      console.error('Error checking user credits:', err);
      return false;
    }
  }, [userId]);

  // Calculate file download cost
  const getFileDownloadCost = useCallback((fileSizeBytes: number): number => {
    return calculateFileDownloadCost(fileSizeBytes);
  }, []);

  // Generate random Nia chat bonus
  const getNiaChatBonus = useCallback((): number => {
    return generateNiaChatBonus();
  }, []);

  // Refresh credit summary
  const refreshCredits = useCallback(() => {
    fetchCreditSummary();
  }, [fetchCreditSummary]);

  // Listen for real-time credit updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('credit-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_transactions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refresh credit summary when transactions change
          fetchCreditSummary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCreditSummary]);

  // Initial fetch
  useEffect(() => {
    fetchCreditSummary();
  }, [fetchCreditSummary]);

  return {
    creditSummary,
    loading,
    error,
    hasEnoughCredits,
    getFileDownloadCost,
    getNiaChatBonus,
    refreshCredits
  };
}

// Hook for level progression display
export function useLevelProgression(userId: string | undefined) {
  const { creditSummary, loading } = useCreditEconomy(userId);

  const getLevelProgress = useCallback(() => {
    if (!creditSummary) return null;

    const { levelInfo, totalEarned } = creditSummary;
    
    return {
      currentLevel: levelInfo.level,
      levelName: levelInfo.name,
      creditsToNext: levelInfo.creditsToNext,
      progressPercentage: levelInfo.progressPercentage,
      totalEarned,
      isMaxLevel: levelInfo.level === 10
    };
  }, [creditSummary]);

  return {
    levelProgress: getLevelProgress(),
    loading
  };
}

// Hook for credit transaction history
export function useCreditTransactions(userId: string | undefined, limit: number = 20) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions
  };
}
