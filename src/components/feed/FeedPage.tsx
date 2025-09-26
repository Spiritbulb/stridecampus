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
  const [sortBy, setSortBy] = useState<string>('new');
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
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent flex overflow */}
          <FeedHeader 
            user={user}
            sortBy={sortBy}
            onSortChange={handleSortChange}
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
    </div>
  );
}