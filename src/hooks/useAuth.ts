import { useState, useEffect, useCallback } from 'react';
import {
  fetchUserProfile,
  updateLoginStreak,
  initializeAuth,
  getUserByUsername,
  signUp,
  signIn,
  signOut,
  updateUser,
  refreshUser,
  setupAuthListener,
  userProfileCache
} from '@/utils/auth';
import { supabase, type User } from '@/utils/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { isValidSchoolEmail, isUsernameAvailable } from '@/utils/auth';
import { useExpoPushNotifications } from './useExpoPushNotifications';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Get notification hook for FCM token sync
  const { syncTokenWhenUserLogsIn } = useExpoPushNotifications();

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const init = async () => {
      try {
        const { session: freshSession, user: freshUser } = await initializeAuth();
        if (isMounted) {
          setSession(freshSession);
          setUser(freshUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };
//@ts-ignore
    timeoutId = setTimeout(() => {
      if (isMounted && !initialized) {
        console.warn('Auth initialization timeout');
        setLoading(false);
        setInitialized(true);
      }
    }, 10000);

    init();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Listen for auth changes
  useEffect(() => {
    if (!initialized) return;

    const subscription = setupAuthListener(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.id);
      
      setSession(newSession);
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        setLoading(true);
        try {
          const userProfile = await fetchUserProfile(newSession.user.id);
          setUser(userProfile);
          
          // Sync FCM token when user logs in
          console.log('🔄 User signed in, syncing FCM token...');
          syncTokenWhenUserLogsIn(newSession.user.id).catch(error => {
            console.error('Background FCM token sync failed:', error);
          });
          
          // Update login streak in background
          updateLoginStreak(newSession.user.id).catch(error => {
            console.error('Background login streak update failed:', error);
          });
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        userProfileCache.clear();
        setLoading(false);
      } else if (event === 'USER_UPDATED' && newSession?.user) {
        const userProfile = await fetchUserProfile(newSession.user.id, true);
        setUser(userProfile);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  const wrappedSignUp = useCallback(async (email: string, password: string, username: string, referralCode?: string) => {
    setLoading(true);
    try {
      const result = await signUp(email, password, username, referralCode);
      if (result.data?.user) {
        const userProfile = await fetchUserProfile(result.data.user.id);
        setUser(userProfile);
        
        // Sync FCM token when user signs up
        console.log('🔄 User signed up, syncing FCM token...');
        syncTokenWhenUserLogsIn(result.data.user.id).catch(error => {
          console.error('Background FCM token sync failed:', error);
        });
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [syncTokenWhenUserLogsIn]);

  const wrappedSignIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.data?.user) {
        // Sync FCM token when user signs in
        console.log('🔄 User signed in via wrappedSignIn, syncing FCM token...');
        syncTokenWhenUserLogsIn(result.data.user.id).catch(error => {
          console.error('Background FCM token sync failed:', error);
        });
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [syncTokenWhenUserLogsIn]);

  const wrappedSignOut = useCallback(async () => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const wrappedUpdateUser = useCallback(async (updatedFields: Partial<User>) => {
    if (!user) return { data: null, error: new Error('No user logged in') };
    
    setLoading(true);
    try {
      const result = await updateUser(user, updatedFields);
      if (result.data) {
        setUser(result.data);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const wrappedRefreshUser = useCallback(() => {
    if (session?.user) {
      return fetchUserProfile(session.user.id, true).then(user => {
        setUser(user);
        return user;
      });
    }
    return Promise.resolve(null);
  }, [session?.user]);

  return {
    session,
    user,
    loading,
    initialized,
    signUp: wrappedSignUp,
    signIn: wrappedSignIn,
    signOut: wrappedSignOut,
    refreshUser: wrappedRefreshUser,
    updateUser: wrappedUpdateUser,
    getUserByUsername,
    isValidSchoolEmail,
    isUsernameAvailable
  };
}