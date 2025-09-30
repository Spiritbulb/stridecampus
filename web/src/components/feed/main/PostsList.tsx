import { Post } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import { MessageSquare } from 'lucide-react';
import PostCard from './PostCard';

interface PostsListProps {
  posts: Post[];
  onPostSelect: (post: Post) => void;
  onVote: (postId: string, voteType: number) => void;
  onShare: (postId: string) => void;
  user: User | null;
    onShowCreatePost: () => void;
    isLoading?: boolean;
    emptyStateMessage?: string;
}

export default function PostsList({ posts, onPostSelect, onVote, onShare, user, onShowCreatePost, isLoading }: PostsListProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
            </div>
        );
    }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <MessageSquare size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-500 mb-4">
          {user ? 'Be the first to create a post in this community' : 'No posts have been created yet'}
        </p>
        {user && (
          <button
            onClick={() => onShowCreatePost()}
            className="px-4 py-2 bg-[#f23b36] text-white rounded-lg hover:shadow-md transition-all"
          >
            Create Post
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onSelect={onPostSelect}
          onVote={onVote}
          onShare={onShare}
          user={user}
        />
      ))}
    </div>
  );
}