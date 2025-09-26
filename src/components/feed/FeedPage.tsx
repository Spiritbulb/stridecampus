'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import FeedHeader from '@/components/feed/main/FeedHeader';
import FeedSidebar from '@/components/feed/main/FeedSidebar';
import PostsList from '@/components/feed/main/PostsList';
import { useFeedData } from '@/hooks/useFeedData';
import { usePostActions } from '@/hooks/usePostActions';
import { Post } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';



export default function FeedPage() {


  // Use AppContext for all auth state and navigation
  const { 
    user, 
    isLoading: appIsLoading, 
    currentScreen, 
    handleNavigateToAuth, 
    isAuthenticated 
  } = useApp();

  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('all');
  const router = useRouter();
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!appIsLoading && !isAuthenticated) {
      handleNavigateToAuth();
    }
  }, [appIsLoading, isAuthenticated, handleNavigateToAuth]);
  
  // Memoize callback functions to prevent unnecessary re-renders
  const handleSpaceChange = useCallback((space: string) => {
    setSelectedSpace(space);
    // Reset sortBy when switching to a space
    if (space !== 'all' && space !== 'following') {
      setSortBy('new');
    } else {
      setSortBy(space);
    }
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    // If switching to main tabs, update selectedSpace accordingly
    if (sort === 'all' || sort === 'following') {
      setSelectedSpace(sort);
    }
  }, []);

  const openCreatePost = useCallback(() => {
    router.push('/create?type=post');
  }, [router]);

  const closeCreatePost = useCallback(() => {
    router.back();
  }, [router]);

  const openCreateSpace = useCallback(() => {
    router.push('/create?type=space');
  }, [router]);

  const closeCreateSpace = useCallback(() => {
    router.back();
  }, [router]);

  const selectPost = useCallback((post: Post | null) => {
    if (post) {
      // Redirect to the individual post page
      router.push(`/post/${post.id}`);
    }
  }, [router]);

  // Only fetch data if user is authenticated
  const { posts, spaces, isLoading: feedLoading, refetch } = useFeedData(
    selectedSpace, 
    sortBy, 
    isAuthenticated ? user : null
  );

  const handleRefresh = async () => {
    await refetch;
    await new Promise(resolve => setTimeout(resolve, 800));
  };

  // Pull-to-refresh hook
  const {
    pullDistance,
    isPulling,
    isRefreshing,
    containerRef,
    touchHandlers
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPullDistance: 120
  });
  
  const { handleVote, handleShare, joinSpace } = usePostActions(
    isAuthenticated ? user : null, 
    refetch
  );

  // Memoize filtered spaces to avoid recalculating on every render
  const filteredSpaces = useMemo(() => {
    return spaces.filter(space => space.is_public || space.user_role);
  }, [spaces]);

  // Show global loading state if app is still loading
  if (appIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Don't render if not on dashboard screen or not authenticated
  if (!isAuthenticated) {
    router.push('/auth')
    return null;
  }

  // Show feed loading state only on initial load, not during refetches
  if (feedLoading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 mt-2 mb-16" style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}>

        {/* Pull-to-Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-blue-50 to-transparent border-b border-blue-200 z-50"
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
      {isRefreshing ? (
        <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
      ): (
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent flex overflow */}
          <FeedHeader 
            user={user}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            spaces={filteredSpaces}
            selectedSpace={selectedSpace}
            onSpaceChange={handleSpaceChange}
          />
          
          <PostsList 
            posts={posts}
            onPostSelect={selectPost}
            onVote={handleVote}
            onShare={handleShare}
            user={user}
            onShowCreatePost={openCreatePost}
            isLoading={feedLoading}
          />
        </div>
      </div>
    )}
    </div>
  );
}