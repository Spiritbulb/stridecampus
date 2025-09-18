'use client';
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Session } from '@supabase/supabase-js';
import { User } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

type ScreenType = 'auth' | 'welcome-credits' | 'dashboard';

interface AppState {
  currentScreen: ScreenType;
  isTransitioning: boolean;
  isLoading: boolean;
  justSignedUp: boolean;
  lastAuthCheck: number;
  requiresEmailVerification: boolean;
  // Added user state
  user: User | null;
  session: Session | null;
  authLoading: boolean;
}

type AppAction =
  | { type: 'SET_SCREEN'; payload: ScreenType }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_JUST_SIGNED_UP'; payload: boolean }
  | { type: 'SET_LAST_AUTH_CHECK'; payload: number }
  | { type: 'SET_REQUIRES_EMAIL_VERIFICATION'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'RESET_STATE' }
  | { type: 'BATCH_UPDATE'; payload: Partial<AppState> };

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  handleScreenTransition: (nextScreen: ScreenType) => void;
  handleSuccessfulSignUp: () => void;
  handleNavigateToAuth: () => void;
  checkAuthState: () => void;
  // Convenience getters
  isAuthenticated: boolean;
  needsEmailVerification: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Constants
const SCREEN_CACHE_KEY = 'app_currentScreen';
const APP_STATE_CACHE_KEY = 'app_state';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTH_CHECK_THROTTLE = 1000; // 1 second
const TRANSITION_DELAY = 300;

const initialState: AppState = {
  currentScreen: 'dashboard',
  isTransitioning: false,
  isLoading: true,
  justSignedUp: false,
  lastAuthCheck: 0,
  requiresEmailVerification: false,
  user: null,
  session: null,
  authLoading: true,
};

// Optimized storage operations with error handling and debouncing
class StorageManager {
  private static writeTimeouts = new Map<string, NodeJS.Timeout>();
  
  static read<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  
  static write(key: string, value: any, debounceMs = 100): void {
    if (typeof window === 'undefined') return;
    
    // Clear existing timeout
    const existingTimeout = this.writeTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new debounced write
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        this.writeTimeouts.delete(key);
      } catch (error) {
        console.warn(`Failed to persist ${key}:`, error);
      }
    }, debounceMs);
    
    this.writeTimeouts.set(key, timeout);
  }
  
  static clear(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
      // Clear any pending writes
      const timeout = this.writeTimeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.writeTimeouts.delete(key);
      }
    } catch (error) {
      console.warn(`Failed to clear ${key}:`, error);
    }
  }
}

// Optimized reducer with batch updates
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      if (state.currentScreen === action.payload) return state;
      return { ...state, currentScreen: action.payload };
      
    case 'SET_TRANSITIONING':
      if (state.isTransitioning === action.payload) return state;
      return { ...state, isTransitioning: action.payload };
      
    case 'SET_LOADING':
      if (state.isLoading === action.payload) return state;
      return { ...state, isLoading: action.payload };
      
    case 'SET_JUST_SIGNED_UP':
      if (state.justSignedUp === action.payload) return state;
      return { ...state, justSignedUp: action.payload };
      
    case 'SET_LAST_AUTH_CHECK':
      return { ...state, lastAuthCheck: action.payload };
      
    case 'SET_REQUIRES_EMAIL_VERIFICATION':
      if (state.requiresEmailVerification === action.payload) return state;
      return { ...state, requiresEmailVerification: action.payload };

    case 'SET_USER':
      if (state.user === action.payload) return state;
      return { ...state, user: action.payload };

    case 'SET_SESSION':
      if (state.session === action.payload) return state;
      return { ...state, session: action.payload };

    case 'SET_AUTH_LOADING':
      if (state.authLoading === action.payload) return state;
      return { ...state, authLoading: action.payload };
      
    case 'BATCH_UPDATE':
      // Only update if there are actual changes
      const hasChanges = Object.keys(action.payload).some(
        key => state[key as keyof AppState] !== action.payload[key as keyof AppState]
      );
      if (!hasChanges) return state;
      return { ...state, ...action.payload };
      
    case 'RESET_STATE':
      return { 
        ...initialState, 
        isLoading: false, 
        lastAuthCheck: Date.now(),
        user: null,
        session: null,
        authLoading: false
      };
      
    default:
      return state;
  }
}

// Load persisted state with validation
function loadPersistedState(): Partial<AppState> {
  if (typeof window === 'undefined') return {};

  // Try new cache format first
  const cached = StorageManager.read<Partial<AppState>>(APP_STATE_CACHE_KEY, {});
  if (cached?.lastAuthCheck && Date.now() - cached.lastAuthCheck < CACHE_DURATION) {
    // Don't persist user/session data for security
    const { user, session, authLoading, ...safeCached } = cached;
    return safeCached;
  }

  // Fallback to legacy screen cache
  const savedScreen = StorageManager.read(SCREEN_CACHE_KEY, null) as unknown as ScreenType;
  return savedScreen ? { currentScreen: savedScreen } : {};
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
    (init) => ({
      ...init,
      ...loadPersistedState(),
    })
  );
  
  const { session, user, loading: authLoading } = useAuth();

  // Refs for tracking state to prevent unnecessary effects
  const authStateRef = useRef({ session, user, loading: authLoading });
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Sync auth state from useAuth hook to context
  useEffect(() => {
    const prevAuth = authStateRef.current;
    const authChanged = (
      prevAuth.session !== session || 
      prevAuth.user !== user || 
      prevAuth.loading !== authLoading
    );

    if (authChanged) {
      authStateRef.current = { session, user, loading: authLoading };
      
      dispatch({ type: 'BATCH_UPDATE', payload: {
        user,
        session,
        authLoading
      }});
    }
  }, [session, user, authLoading]);

  // Memoized screen transition handler
  const handleScreenTransition = useCallback((nextScreen: ScreenType) => {
    if (state.currentScreen === nextScreen) return;
    
    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    dispatch({ type: 'SET_TRANSITIONING', payload: true });
    
    transitionTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'BATCH_UPDATE', payload: { 
        currentScreen: nextScreen, 
        isTransitioning: false 
      }});
    }, TRANSITION_DELAY);
  }, [state.currentScreen]);

  // Memoized sign up handler
  const handleSuccessfulSignUp = useCallback(() => {
    dispatch({ type: 'BATCH_UPDATE', payload: {
      justSignedUp: true,
      lastAuthCheck: Date.now()
    }});
    handleScreenTransition('welcome-credits');
  }, [handleScreenTransition]);

  // Navigate to auth page
  const handleNavigateToAuth = useCallback(() => {
    router.push('/auth');
  }, [router]);

  // Check auth state manually
  const checkAuthState = useCallback(() => {
    const now = Date.now();
    if (now - state.lastAuthCheck < AUTH_CHECK_THROTTLE) return;
    
    dispatch({ type: 'SET_LAST_AUTH_CHECK', payload: now });
    
    if (state.session && state.user) {
      // Check if email needs verification
      const needsVerification = !state.session.user.email_confirmed_at;
      dispatch({ type: 'SET_REQUIRES_EMAIL_VERIFICATION', payload: needsVerification });
      
      if (state.justSignedUp && !needsVerification) {
        handleScreenTransition('welcome-credits');
      } else if (state.currentScreen !== 'dashboard' && state.currentScreen !== 'welcome-credits') {
        handleScreenTransition('dashboard');
      }
    } else {
      // Not authenticated
      dispatch({ type: 'SET_REQUIRES_EMAIL_VERIFICATION', payload: false });
      if (state.currentScreen !== 'dashboard') {
        handleNavigateToAuth();
      }
    }
  }, [state.session, state.user, state.lastAuthCheck, state.justSignedUp, state.currentScreen, handleScreenTransition]);

  // Single effect to handle all auth state changes
  useEffect(() => {
    const prevAuth = authStateRef.current;
    const authChanged = (
      prevAuth.session !== session || 
      prevAuth.user !== user || 
      prevAuth.loading !== authLoading
    );
    
    // Skip if no auth changes and already initialized
    if (!authChanged && isInitializedRef.current) return;
    
    const now = Date.now();
    
    // Handle initial load - show loading state until auth is determined
    if (!isInitializedRef.current) {
      if (authLoading) {
        // Still loading, don't change screen yet
        return;
      }
      
      isInitializedRef.current = true;
      dispatch({ type: 'SET_LOADING', payload: false });
      
      checkAuthState();
      return;
    }
    
    // Skip rapid auth checks
    if (authLoading || now - state.lastAuthCheck < AUTH_CHECK_THROTTLE) return;
    
    checkAuthState();
  }, [session, user, authLoading, state.lastAuthCheck, checkAuthState]);

  // Persist state changes (debounced) - excluding sensitive data
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const stateToPersist = {
      currentScreen: state.currentScreen,
      justSignedUp: state.justSignedUp,
      lastAuthCheck: state.lastAuthCheck,
      requiresEmailVerification: state.requiresEmailVerification,
      // Don't persist user/session for security
    };
    
    StorageManager.write(APP_STATE_CACHE_KEY, stateToPersist);
  }, [state.currentScreen, state.justSignedUp, state.lastAuthCheck, state.requiresEmailVerification]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Memoized convenience getters
  const isAuthenticated = useMemo(() => !!(state.user && state.session), [state.user, state.session]);
  const needsEmailVerification = useMemo(() => 
    isAuthenticated && !state.session?.user.email_confirmed_at, 
    [isAuthenticated, state.session]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextType>(() => ({
    ...state,
    dispatch,
    handleScreenTransition,
    handleSuccessfulSignUp,
    handleNavigateToAuth,
    checkAuthState,
    isAuthenticated,
    needsEmailVerification,
  }), [
    state, 
    handleScreenTransition, 
    handleSuccessfulSignUp, 
    handleNavigateToAuth, 
    checkAuthState,
    isAuthenticated,
    needsEmailVerification
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