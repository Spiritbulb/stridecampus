// hooks/useAuth.ts
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@/utils/supabaseClient';

/**
 * Custom hook that wraps Auth0 and provides Supabase user data
 * Maintains compatibility with existing Supabase-based code
 */
export function useAuth() {
  const { 
    user: auth0User, 
    isAuthenticated, 
    isLoading: auth0Loading,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0();

  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Supabase user when Auth0 user is authenticated
  useEffect(() => {
    const fetchSupabaseUser = async () => {
      if (!isAuthenticated || !auth0User?.email) {
        setSupabaseUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', auth0User.email)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // User doesn't exist in Supabase yet - this should be handled by sync
            console.log('User not yet synced to Supabase, waiting...');
            setError('User profile being created...');
          } else {
            console.error('Error fetching Supabase user:', fetchError);
            setError(fetchError.message);
          }
          setSupabaseUser(null);
        } else {
          setSupabaseUser(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching Supabase user:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        setSupabaseUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSupabaseUser();
  }, [isAuthenticated, auth0User]);

  // Create a session object for backward compatibility
  const session = useMemo(() => {
    if (!isAuthenticated || !auth0User) return null;
    
    return {
      user: {
        id: auth0User.sub || '',
        email: auth0User.email || '',
        email_verified: auth0User.email_verified,
        user_metadata: auth0User,
      },
      access_token: '', // Will be fetched when needed
    };
  }, [isAuthenticated, auth0User]);

  // Logout function
  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  // Sign in function (redirects to Auth0)
  const signIn = async (email: string, password?: string) => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/auth',
        login_hint: email
      }
    });
  };

  // Sign up function (redirects to Auth0)
  const signUp = async (email: string, password?: string) => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/auth',
        screen_hint: 'signup',
        login_hint: email
      }
    });
  };

  // Get access token
  const getAccessToken = async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };

  return {
    // Auth0 data
    session,
    isAuthenticated,
    auth0User,
    
    // Supabase user data (for backward compatibility)
    user: supabaseUser,
    
    // Loading states
    loading: auth0Loading || loading,
    error,
    
    // Auth methods
    signIn,
    signUp,
    logout,
    getAccessToken,
    loginWithRedirect,
  };
}