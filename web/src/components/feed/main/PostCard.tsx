'use client';

import { Post } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import VoteSection from './VoteSection';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, MessageSquare, Share, Bookmark, Link, FileText, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onSelect: (post: Post) => void;
  onVote: (postId: string, voteType: number) => void;
  onShare: (postId: string) => void;
  user: User | null;
}

export default function PostCard({ post, onSelect, onVote, onShare, user }: PostCardProps) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    
    // Call the onSelect callback for any side effects
    onSelect(post);
    
    // Navigate to the post page
    router.push(`/post/${post.id}`);
  };

  return (
    <div 
      className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer" 
      onClick={handleCardClick}
    >
      <div className="px-4 py-3">
        <PostHeader post={post} user={user} />
        
        <PostContent post={post} />
        <div className="flex items-center justify-between mt-3">
          <PostActions 
            post={post}
            onShare={onShare}
          />
          <VoteSection 
            post={post}
            onVote={onVote}
            user={user}
          />
        </div>
      </div>
    </div>
  );
}