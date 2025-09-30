'use client';

import { useEffect, useCallback } from 'react';
import { useRefresh } from '@/contexts/RefreshContext';
import { usePathname } from 'next/navigation';

export function usePageRefresh(refreshFunction: () => Promise<void>) {
  const { registerRefreshFunction, unregisterRefreshFunction } = useRefresh();
  const pathname = usePathname();

  // Use pathname as the key for the refresh function
  const pageKey = pathname;

  useEffect(() => {
    registerRefreshFunction(pageKey, refreshFunction);
    
    return () => {
      unregisterRefreshFunction(pageKey);
    };
  }, [pageKey, refreshFunction, registerRefreshFunction, unregisterRefreshFunction]);
}
