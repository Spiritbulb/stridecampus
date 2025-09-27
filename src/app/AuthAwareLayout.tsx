// components/layout/AuthAwareLayout.tsx
'use client';

import { useApp } from '@/contexts/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import AppSidebar from '@/components/sidebar/AppSidebar';
import NoAuthNavbar from '@/components/layout/NoAuthNavbar';
import NoAuthFooter from '@/components/layout/NoAuthFooter';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface AuthAwareLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>; // Callback to handle content refresh
}

export function AuthAwareLayout({ children, onRefresh }: AuthAwareLayoutProps) {
  const { isAuthenticated } = useApp();
  
  const {
    pullDistance,
    isPulling,
    isRefreshing,
    containerRef,
    touchHandlers
  } = usePullToRefresh({
    onRefresh,
    threshold: 80, // Minimum pull distance to trigger refresh
    maxPullDistance: 120 // Maximum pull distance
  });

  return (
    <>
      {isAuthenticated ? <Navbar /> : ''}
      
      {/* Main Content Area with Pull-to-Refresh */}
      <div 
        ref={containerRef}
        className={`transition-all duration-300 ${
          isAuthenticated ? 'md:ml-20 md:mr-90' : 'md:mx-0'
        } relative overflow-hidden`}
        {...touchHandlers}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Pull-to-Refresh Indicator */}
        {(isPulling || isRefreshing) && (
          <div 
            className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 border-b border-blue-200 z-10"
            style={{
              height: `${Math.max(pullDistance, 0)}px`,
              transform: `translateY(-${Math.max(pullDistance, 0)}px)`
            }}
          >
            <div className="flex items-center space-x-2 text-blue-600">
              {isRefreshing ? (
                <>
                  <svg 
                    className="animate-spin h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Refreshing...</span>
                </>
              ) : pullDistance > 80 ? (
                <>
                  <svg 
                    className="h-5 w-5 transform rotate-180" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                    />
                  </svg>
                  <span className="text-sm font-medium">Release to refresh</span>
                </>
              ) : (
                <>
                  <svg 
                    className="h-5 w-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                    />
                  </svg>
                  <span className="text-sm font-medium">Pull to refresh</span>
                </>
              )}
            </div>
          </div>
        )}
        
        {children}
      </div>
      
      {/* Conditionally render sidebars based on auth */}
      {isAuthenticated && <AppSidebar />}
      
      {isAuthenticated ? <Footer /> : ''}
    </>
  );
}