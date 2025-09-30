import { Post } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface VoteSectionProps {
  post: Post;
  onVote: (postId: string, voteType: number) => void;
  user: User | null;
}

export default function VoteSection({ post, onVote, user }: VoteSectionProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVote(post.id, 1);
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded-full hover:bg-red-50 transition-colors duration-200 ${
          post.user_vote === 1 ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-red-500'
        }`}
      >
        <ArrowUp size={16} />
      </button>
      
      <span className={`text-sm font-medium min-w-[20px] text-center ${
        post.user_vote === 1 ? 'text-red-500' : 
        post.user_vote === -1 ? 'text-blue-500' : 'text-gray-700'
      }`}>
        {post.vote_count || 0}
      </span>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVote(post.id, -1);
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded-full hover:bg-blue-50 transition-colors duration-200 ${
          post.user_vote === -1 ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-blue-500'
        }`}
      >
        <ArrowDown size={16} />
      </button>
    </div>
  );
}