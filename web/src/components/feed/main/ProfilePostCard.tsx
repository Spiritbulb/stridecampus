import { Post } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import VoteSection from './VoteSection';
import PostHeader from './ProfilePostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
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
  return (
    <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer" onClick={() => onSelect(post)}>
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