import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  showProgress?: boolean;
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ 
  size = 'default', 
  showProgress = true,
  text = 'Loading...',
  className = ''
}: LoadingSpinnerProps) => {
  const { isLoading } = useApp();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(isLoading);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const sizeClasses = {
    small: 'h-8 w-auto',
    default: 'h-16 w-auto',
    large: 'h-24 w-auto'
  };

  const progressBarSizes = {
    small: 'w-32 h-1',
    default: 'w-48 h-1',
    large: 'w-64 h-2'
  };

  // Clean up intervals and timeouts
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Optimized progress simulation
  const simulateProgress = useCallback(() => {
    cleanup(); // Clear any existing intervals
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        // More realistic progress curve - slower as it approaches completion
        const increment = prev < 30 ? Math.random() * 20 : 
                         prev < 60 ? Math.random() * 15 : 
                         prev < 85 ? Math.random() * 8 : 
                         Math.random() * 2;
        
        const newProgress = Math.min(prev + increment, 92); // Cap at 92% during loading
        return newProgress;
      });
    }, 150 + Math.random() * 200); // Variable interval for more natural feel
  }, [cleanup]);

  // Handle loading state changes
  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(0);
      // Small delay before starting progress for better UX
      timeoutRef.current = setTimeout(simulateProgress, 100);
    } else {
      // Complete the progress bar quickly when loading finishes
      setProgress(100);
      cleanup();
      
      // Hide the spinner after a short delay to show completion
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        // Reset progress after hiding for next time
        setTimeout(() => setProgress(0), 100);
      }, 300);
    }

    return cleanup;
  }, [isLoading, simulateProgress, cleanup]);

  // Don't render if not visible (better for performance)
  if (!isVisible) return null;

  return (
    <div 
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
      role="status" 
      aria-live="polite"
      aria-label={text}
    >
      {/* Logo with subtle pulse animation */}
      <div className="relative animate-pulse">
        <img 
          src="/logo-rectangle.png" 
          className={`${sizeClasses[size]} object-contain`}
          alt="Loading"
          loading="eager"
        />
      </div>
      
      {/* Progress bar with better animations */}
      {showProgress && (
        <div className={`${progressBarSizes[size]} bg-gray-200 rounded-full overflow-hidden shadow-inner`}>
          <div 
            className={`h-full bg-gradient-to-r from-[#f23b36] to-[#ff5722] transition-all duration-500 ease-out relative`}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      )}
      
      {/* Screen reader only progress announcement */}
      <span className="sr-only">
        Loading {Math.round(progress)}% complete
      </span>
    </div>
  );
};