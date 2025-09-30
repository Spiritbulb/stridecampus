'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';

interface RefreshContextType {
  registerRefreshFunction: (key: string, refreshFn: () => Promise<void>) => void;
  unregisterRefreshFunction: (key: string) => void;
  getRefreshFunction: (key: string) => (() => Promise<void>) | undefined;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

interface RefreshProviderProps {
  children: ReactNode;
}

export function RefreshProvider({ children }: RefreshProviderProps) {
  const refreshFunctions = React.useRef<Map<string, () => Promise<void>>>(new Map());

  const registerRefreshFunction = useCallback((key: string, refreshFn: () => Promise<void>) => {
    refreshFunctions.current.set(key, refreshFn);
  }, []);

  const unregisterRefreshFunction = useCallback((key: string) => {
    refreshFunctions.current.delete(key);
  }, []);

  const getRefreshFunction = useCallback((key: string) => {
    return refreshFunctions.current.get(key);
  }, []);

  const value = {
    registerRefreshFunction,
    unregisterRefreshFunction,
    getRefreshFunction,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}
