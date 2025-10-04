'use client';
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

type ScreenType = 'auth' | 'welcome-credits' | 'dashboard';

interface AppUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  nickname?: string;
  sub?: string;
}

interface AppState {
  currentScreen: ScreenType;
  isTransitioning: boolean;
  justSignedUp: boolean;
}

type AppAction =
  | { type: 'SET_SCREEN'; payload: ScreenType }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'SET_JUST_SIGNED_UP'; payload: boolean }
  | { type: 'BATCH_UPDATE'; payload: Partial<AppState> };

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  handleScreenTransition: (nextScreen: ScreenType) => void;
  handleSuccessfulSignUp: () => void;
  handleNavigateToAuth: () => void;
  // Auth0 pass-through
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsEmailVerification: boolean;
  loginWithRedirect: (options?: any) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TRANSITION_DELAY = 300;
const SCREEN_CACHE_KEY = 'app_currentScreen';

const initialState: AppState = {
  currentScreen: 'dashboard',
  isTransitioning: false,
  justSignedUp: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      if (state.currentScreen === action.payload) return state;
      return { ...state, currentScreen: action.payload };
      
    case 'SET_TRANSITIONING':
      if (state.isTransitioning === action.payload) return state;
      return { ...state, isTransitioning: action.payload };
      
    case 'SET_JUST_SIGNED_UP':
      if (state.justSignedUp === action.payload) return state;
      return { ...state, justSignedUp: action.payload };
      
    case 'BATCH_UPDATE':
      const hasChanges = Object.keys(action.payload).some(
        key => state[key as keyof AppState] !== action.payload[key as keyof AppState]
      );
      if (!hasChanges) return state;
      return { ...state, ...action.payload };
      
    default:
      return state;
  }
}

// Load only the current screen from cache
function loadPersistedState(): Partial<AppState> {
  if (typeof window === 'undefined') return {};
  
  try {
    const savedScreen = localStorage.getItem(SCREEN_CACHE_KEY);
    if (savedScreen && ['auth', 'welcome-credits', 'dashboard'].includes(savedScreen)) {
      return { currentScreen: savedScreen as ScreenType };
    }
  } catch {
    // Ignore storage errors
  }
  
  return {};
}

// Sync Auth0 user with Supabase
async function syncUserWithSupabase(auth0User: any) {
  try {
    if (!auth0User?.email) {
      console.warn('⚠️ No email provided for user sync');
      return;
    }

    // Check if user exists by email (not by Auth0 ID)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, username, is_verified, last_login_date')
      .eq('email', auth0User.email)
      .single();

    // PGRST116 = no rows returned (user doesn't exist)
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', fetchError);
      return;
    }

    // Extract school info from email if it's a .edu address
    const emailParts = auth0User.email.split('@');
    const domain = emailParts[1];
    const isSchoolEmail = domain?.endsWith('.edu');
    
    const schoolDomain = isSchoolEmail ? domain : null;
    const schoolName = isSchoolEmail 
      ? domain.split('.edu')[0].split('.').map((s: string) => 
          s.charAt(0).toUpperCase() + s.slice(1)
        ).join(' ')
      : null;

    if (!existingUser) {
      // Generate unique username from email
      const baseUsername = auth0User.nickname || emailParts[0];
      const randomSuffix = Math.floor(Math.random() * 10000);
      const username = `${baseUsername}${randomSuffix}`.toLowerCase().replace(/[^a-z0-9_]/g, '');

      // Generate unique referral code
      const referralCode = `${username.substring(0, 4)}${Date.now().toString(36)}`.toUpperCase();

      // Create new user with proper schema fields
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: auth0User.email,
          auth0_sub: auth0User.sub, // Store Auth0 ID as text (optional)
          username: username,
          full_name: auth0User.name || auth0User.email.split('@')[0],
          avatar_url: auth0User.picture || null,
          school_email: isSchoolEmail ? auth0User.email : null,
          school_domain: schoolDomain,
          school_name: schoolName,
          credits: 50, // Welcome credits
          level_name: 'Freshman',
          level_points: 0,
          referral_code: referralCode,
          is_verified: auth0User.email_verified || false,
          checkmark: false,
          login_streak: 1,
          last_login_date: new Date().toISOString(),
          email_notifications: true,
          push_notifications: true,
          marketing_emails: true,
          profile_visibility: 'public',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error creating user in Supabase:', insertError);
      } else {
        console.log('✅ User created in Supabase:', auth0User.email);
        console.log('🎁 Welcome credits awarded: 50');
      }
    } else {
      // Update last login and login streak
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = existingUser.last_login_date 
        ? new Date(existingUser.last_login_date).toISOString().split('T')[0]
        : null;

      const updates: any = {
        is_verified: auth0User.email_verified || existingUser.is_verified,
        updated_at: new Date().toISOString()
      };

      // Update login streak if it's a new day
      if (lastLogin !== today) {
        updates.last_login_date = new Date().toISOString();
        
        // Check if streak continues (last login was yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastLogin === yesterdayStr) {
          // Continue streak - will be incremented by trigger
          console.log('🔥 Login streak continues');
        } else if (lastLogin && lastLogin < yesterdayStr) {
          // Streak broken - will be reset to 1 by trigger
          console.log('💔 Login streak reset');
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Error updating user in Supabase:', updateError);
      } else {
        console.log('✅ User login recorded:', auth0User.email);
      }
    }
  } catch (error) {
    console.error('❌ Error syncing user with Supabase:', error);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
    (init) => ({ ...init, ...loadPersistedState() })
  );
  
  const { 
    user: auth0User, 
    isAuthenticated, 
    isLoading,
    loginWithRedirect: auth0Login,
    logout: auth0Logout
  } = useAuth0();

  // Transform Auth0 user to AppUser format
  const user: AppUser | null = useMemo(() => {
    if (!auth0User) return null;
    return {
      id: auth0User.sub || '',
      email: auth0User.email || '',
      name: auth0User.name,
      picture: auth0User.picture,
      email_verified: auth0User.email_verified,
      nickname: auth0User.nickname,
      sub: auth0User.sub
    };
  }, [auth0User]);

  const needsEmailVerification = useMemo(() => 
    isAuthenticated && user && !user.email_verified,
    [isAuthenticated, user]
  );

  // Sync user with Supabase when authenticated
  useEffect(() => {
    if (isAuthenticated && auth0User && auth0User.email_verified) {
      syncUserWithSupabase(auth0User);
    }
  }, [isAuthenticated, auth0User]);

  // Screen transition handler
  const handleScreenTransition = useCallback((nextScreen: ScreenType) => {
    if (state.currentScreen === nextScreen) return;
    
    dispatch({ type: 'SET_TRANSITIONING', payload: true });
    
    setTimeout(() => {
      dispatch({ 
        type: 'BATCH_UPDATE', 
        payload: { 
          currentScreen: nextScreen, 
          isTransitioning: false 
        }
      });
    }, TRANSITION_DELAY);
  }, [state.currentScreen]);

  // Sign up success handler
  const handleSuccessfulSignUp = useCallback(() => {
    dispatch({ type: 'SET_JUST_SIGNED_UP', payload: true });
    handleScreenTransition('welcome-credits');
  }, [handleScreenTransition]);

  // Navigate to auth page
  const handleNavigateToAuth = useCallback(() => {
    router.push('/auth');
  }, [router]);

  // Auth0 wrapper methods
  const loginWithRedirect = useCallback(async (options?: any) => {
    try {
      await auth0Login({
        authorizationParams: {
          redirect_uri: window.location.origin + '/auth'
        },
        ...options
      });
    } catch (error) {
      console.error('Auth0 login error:', error);
      throw error;
    }
  }, [auth0Login]);

  const logout = useCallback(() => {
    // Clear local state
    dispatch({ type: 'SET_JUST_SIGNED_UP', payload: false });
    
    // Logout from Auth0
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }, [auth0Logout]);

  // Persist current screen
  useEffect(() => {
    try {
      localStorage.setItem(SCREEN_CACHE_KEY, state.currentScreen);
    } catch {
      // Ignore storage errors
    }
  }, [state.currentScreen]);

  // Handle post-signup flow
  useEffect(() => {
    if (state.justSignedUp && isAuthenticated && user?.email_verified) {
      handleScreenTransition('welcome-credits');
    }
  }, [state.justSignedUp, isAuthenticated, user, handleScreenTransition]);

  const contextValue = useMemo<AppContextType>(() => ({
    ...state,
    dispatch,
    handleScreenTransition,
    handleSuccessfulSignUp,
    handleNavigateToAuth,
    user,
    isAuthenticated,
    isLoading,
    needsEmailVerification: !!needsEmailVerification,
    loginWithRedirect,
    logout,
  }), [
    state, 
    handleScreenTransition, 
    handleSuccessfulSignUp, 
    handleNavigateToAuth,
    user,
    isAuthenticated,
    isLoading,
    needsEmailVerification,
    loginWithRedirect,
    logout
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}