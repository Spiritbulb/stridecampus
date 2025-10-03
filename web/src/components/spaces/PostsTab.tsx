'use client';

import { memo, useCallback, useMemo } from 'react';
import { Post, User } from '@/utils/supabaseClient';
import PostCard from '@/components/feed/main/PostCard';
import { Plus, Clock, TrendingUp } from 'lucide-react';

interface PostsTabProps {
  posts: Post[];
  user: User | null;
  sortBy: 'new' | 'hot';
  canCreatePost: boolean;
  onSortChange: (sortBy: 'new' | 'hot') => void;
  onCreatePost: () => void;
  onSelectPost: (post: Post) => void;
  onVote: (postId: string, voteType: number) => void;
  onShare: (postId: string) => void;
}

const PostsTab = memo(function PostsTab({ 
  posts, 
  user, 
  sortBy, 
  canCreatePost,
  onSortChange, 
  onCreatePost, 
  onSelectPost, 
  onVote, 
  onShare 
}: PostsTabProps) {
  const handleSortToggle = useCallback(() => {
    onSortChange(sortBy === 'new' ? 'hot' : 'new');
  }, [sortBy, onSortChange]);

  const memoizedPosts = useMemo(() => posts, [posts]);

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button 
          onClick={handleSortToggle}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          {sortBy === 'new' ? (
            <>
              <Clock className="w-4 h-4" />
              New
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Hot
            </>
          )}
        </button>
        
      </div>
      
      {memoizedPosts.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {memoizedPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              user={user} 
              onSelect={onSelectPost} 
              onShare={onShare} 
              onVote={onVote}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <p className="text-gray-500 mb-4">No posts yet in this space.</p>
          {canCreatePost && (
            <button 
              onClick={onCreatePost}
              className="px-6 py-2.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
            >
              Be the first to post!
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default PostsTab;
