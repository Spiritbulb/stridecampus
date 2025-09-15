'use client';
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Session } from '@supabase/supabase-js';

type ScreenType = 'splash' | 'auth' | 'welcome-credits' | 'dashboard';

interface AppState {
  currentScreen: ScreenType;
  isTransitioning: boolean;
  isLoading: boolean;
  justSignedUp: boolean;
  lastAuthCheck: number;
}

type AppAction =
  | { type: 'SET_SCREEN'; payload: ScreenType }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_JUST_SIGNED_UP'; payload: boolean }
  | { type: 'SET_LAST_AUTH_CHECK'; payload: number }
  | { type: 'RESET_STATE' }
  | { type: 'BATCH_UPDATE'; payload: Partial<AppState> };

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  handleScreenTransition: (nextScreen: ScreenType) => void;
  handleSuccessfulSignUp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Constants
const SCREEN_CACHE_KEY = 'app_currentScreen';
const APP_STATE_CACHE_KEY = 'app_state';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTH_CHECK_THROTTLE = 1000; // 1 second
const TRANSITION_DELAY = 300;

const initialState: AppState = {
  currentScreen: 'splash',
  isTransitioning: false,
  isLoading: true,
  justSignedUp: false,
  lastAuthCheck: 0,
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
      
    case 'BATCH_UPDATE':
      // Only update if there are actual changes
      const hasChanges = Object.keys(action.payload).some(
        key => state[key as keyof AppState] !== action.payload[key as keyof AppState]
      );
      if (!hasChanges) return state;
      return { ...state, ...action.payload };
      
    case 'RESET_STATE':
      return { ...initialState, isLoading: false, lastAuthCheck: Date.now() };
      
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
    return cached;
  }

  // Fallback to legacy screen cache
  const savedScreen = StorageManager.read(SCREEN_CACHE_KEY, null) as unknown as ScreenType;
  return savedScreen ? { currentScreen: savedScreen } : {};
}

export function AppProvider({ children }: { children: React.ReactNode }) {
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

  // Single effect to handle all auth state changes
  useEffect(() => {
    const prevAuth = authStateRef.current;
    const authChanged = (
      prevAuth.session !== session || 
      prevAuth.user !== user || 
      prevAuth.loading !== authLoading
    );
    
    // Update ref
    authStateRef.current = { session, user, loading: authLoading };
    
    // Skip if no auth changes and already initialized
    if (!authChanged && isInitializedRef.current) return;
    
    const now = Date.now();
    
    // Handle initial load
    if (!isInitializedRef.current && !authLoading) {
      isInitializedRef.current = true;
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // If we have persisted state, respect it unless auth state conflicts
      const persistedScreen = state.currentScreen;
      if (session && user) {
        if (persistedScreen !== 'dashboard' && persistedScreen !== 'welcome-credits') {
          handleScreenTransition('dashboard');
        }
      } else if (persistedScreen !== 'auth') {
        handleScreenTransition('auth');
      }
      return;
    }
    
    // Skip rapid auth checks
    if (authLoading || now - state.lastAuthCheck < AUTH_CHECK_THROTTLE) return;
    
    dispatch({ type: 'SET_LAST_AUTH_CHECK', payload: now });
    
    // Handle auth state changes
    if (session && user) {
      // User is authenticated
      if (state.justSignedUp) {
        // Already handled in handleSuccessfulSignUp
        return;
      }
      
      if (state.currentScreen !== 'dashboard') {
        handleScreenTransition('dashboard');
      }
    } else if (!session && !user) {
      // User is not authenticated
      if (state.currentScreen !== 'auth') {
        // Reset state and go to auth
        dispatch({ type: 'RESET_STATE' });
        handleScreenTransition('auth');
        
        // Clear storage
        StorageManager.clear(APP_STATE_CACHE_KEY);
        StorageManager.clear(SCREEN_CACHE_KEY);
      }
    }
  }, [session, user, authLoading, state.currentScreen, state.justSignedUp, state.lastAuthCheck, handleScreenTransition]);

  // Persist state changes (debounced)
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const stateToPersist = {
      currentScreen: state.currentScreen,
      justSignedUp: state.justSignedUp,
      lastAuthCheck: state.lastAuthCheck,
    };
    
    StorageManager.write(APP_STATE_CACHE_KEY, stateToPersist);
  }, [state.currentScreen, state.justSignedUp, state.lastAuthCheck]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextType>(() => ({
    ...state,
    dispatch,
    handleScreenTransition,
    handleSuccessfulSignUp,
  }), [state, handleScreenTransition, handleSuccessfulSignUp]);

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