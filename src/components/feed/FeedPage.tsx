'use client';
import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import FeedHeader from '@/components/feed/main/FeedHeader';
import FeedSidebar from '@/components/feed/main/FeedSidebar';
import PostsList from '@/components/feed/main/PostsList';
import { useFeedData } from '@/hooks/useFeedData';
import { usePostActions } from '@/hooks/usePostActions';
import { Post } from '@/utils/supabaseClient';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const DynamicPostDetailModal = dynamic(() => import('./PostDetailModal'), {
  ssr: false
});

// Create a placeholder for modals while loading
const ModalPlaceholder = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <LoadingSpinner size="small" />
  </div>
);


export default function FeedPage() {
  const { user } = useAuth();
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('new');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const router = useRouter();
  
  
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
    setSelectedPost(post);
  }, []);

  const { posts, spaces, isLoading, refetch } = useFeedData(selectedSpace, sortBy, user);
  const { handleVote, handleShare, joinSpace } = usePostActions(user, refetch);

  // Memoize filtered spaces to avoid recalculating on every render
  const filteredSpaces = useMemo(() => {
    return spaces.filter(space => space.is_public || space.user_role);
  }, [spaces]);

  // Show loading state only on initial load, not during refetches
  if (isLoading && posts.length === 0) {
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
            onShowCreatePost={openCreatePost}
            onShowCreateSpace={openCreateSpace}
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
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 flex-shrink-0"> {/* Constrain sidebar width */}
          <FeedSidebar 
            spaces={spaces}
            onJoinSpace={joinSpace}
            onCreateSpace={openCreateSpace}
            user={user}
          />
        </aside>
      </div>

      {selectedPost && (
        <Suspense fallback={<ModalPlaceholder />}>
          <DynamicPostDetailModal 
            post={selectedPost}
            onClose={() => selectPost(null)}
            onVote={handleVote}
            onShare={handleShare}
          />
        </Suspense>
      )}
    </div>
  );
}