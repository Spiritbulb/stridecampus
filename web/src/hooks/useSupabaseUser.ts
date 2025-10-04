// hooks/useSupabaseUser.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';

export function useSupabaseUser(email: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!email) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (fetchError) {
          console.error('Error fetching Supabase user:', fetchError);
          setError(fetchError.message);
          setUser(null);
        } else {
          setUser(data);
          setError(null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to fetch user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [email]);

  return { user, loading, error };
}