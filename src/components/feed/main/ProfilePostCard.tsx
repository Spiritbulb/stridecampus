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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex">
        <VoteSection 
          post={post}
          onVote={onVote}
          user={user}
        />
        
        <div className="flex-1 p-3 cursor-pointer" onClick={() => onSelect(post)}>
          <PostHeader post={post}/>
          <PostContent post={post} />
          <PostActions 
            post={post}
            onShare={onShare}
          />
        </div>
      </div>
    </div>
  );
}