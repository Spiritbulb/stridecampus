import { useState, useEffect } from 'react';
import { supabase, type CreditTransaction } from '@/utils/supabaseClient';

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  const fetchTransactions = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    loading,
    refetch: fetchTransactions
  };
}