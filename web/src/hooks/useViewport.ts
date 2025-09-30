import { useState, useEffect, useCallback } from 'react';

interface UseViewportProps {
  breakpoint?: number;
  debounceMs?: number;
}

export const useViewport = ({ breakpoint = 768, debounceMs = 250 }: UseViewportProps = {}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const checkViewport = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < breakpoint);
    }
  }, [breakpoint]);

  useEffect(() => {
    // Use a small delay to ensure consistent hydration
    const timer = setTimeout(() => {
      setIsMounted(true);
      checkViewport();
    }, 100);

    const debouncedCheck = debounce(checkViewport, debounceMs);
    window.addEventListener('resize', debouncedCheck);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', debouncedCheck);
    };
  }, [checkViewport, debounceMs]);

  return { isMobile, isMounted };
};

// Optimized debounce function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
