import { useState, useEffect, useCallback } from 'react';
import { supabase, type CreditTransaction } from '@/utils/supabaseClient';

export interface CreateTransactionData {
  amount: number;
  description: string;
  type: string;
  reference_id?: string; // Optional reference to prevent duplicates
  metadata?: Record<string, any>;
}

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [userId]);

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
        .limit(50);

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createTransaction = useCallback(async (transactionData: CreateTransactionData) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Check for duplicate if reference_id is provided
      if (transactionData.reference_id) {
        const { data: existingTransaction, error: checkError } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('reference_id', transactionData.reference_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
          throw checkError;
        }

        if (existingTransaction) {
          console.log('Transaction with reference_id already exists:', transactionData.reference_id);
          return { data: null, error: new Error('Transaction already exists') };
        }
      }

      // Create the transaction
      const { data, error } = await supabase
        .from('credit_transactions')
        .insert([
          {
            user_id: userId,
            amount: transactionData.amount,
            description: transactionData.description,
            type: transactionData.type,
            reference_id: transactionData.reference_id,
            metadata: transactionData.metadata,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add the new transaction to the local state
      setTransactions(prev => [data, ...prev]);

      return { data, error: null };
    } catch (err) {
      console.error('Error creating transaction:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Failed to create transaction') 
      };
    }
  }, [userId]);

  const updateUserCredits = useCallback(async (newAmount: number) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ credits: newAmount })
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating user credits:', err);
      throw err;
    }
  }, [userId]);

  // Make sure this function is properly implemented
  const createTransactionWithCreditsUpdate = useCallback(async (
    transactionData: CreateTransactionData,
    newCreditBalance: number
  ) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Use a database transaction to ensure atomicity
      const { data, error } = await supabase.rpc('create_transaction_and_update_credits', {
        p_user_id: userId,
        p_amount: transactionData.amount,
        p_description: transactionData.description,
        p_type: transactionData.type,
        p_reference_id: transactionData.reference_id || null,
        p_metadata: transactionData.metadata || {},
        p_new_credit_balance: newCreditBalance
      });

      if (error) throw error;

      // Refresh transactions to get the latest data
      await fetchTransactions();

      return { data, error: null };
    } catch (err) {
      console.error('Error creating transaction with credits update:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Failed to create transaction') 
      };
    }
  }, [userId, fetchTransactions]);


  // Real-time subscription to transactions
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`credit_transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setTransactions(prev => {
            // Check if transaction already exists to avoid duplicates
            const exists = prev.some(t => t.id === payload.new.id);
            if (exists) return prev;
            
            return [payload.new as CreditTransaction, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateUserCredits,
    createTransactionWithCreditsUpdate,
  };
}

// Export the function directly for use in other files
export const createTransactionWithCreditsUpdate = async (
  userId: string,
  transactionData: CreateTransactionData,
  newCreditBalance: number
) => {
  try {
    const { data, error } = await supabase.rpc('create_transaction_and_update_credits', {
      p_user_id: userId,
      p_amount: transactionData.amount,
      p_description: transactionData.description,
      p_type: transactionData.type,
      p_reference_id: transactionData.reference_id || null,
      p_metadata: transactionData.metadata || {},
      p_new_credit_balance: newCreditBalance
    });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error creating transaction with credits update:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Failed to create transaction') 
    };
  }
};