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
    <div className="bg-gray-50 p-2 flex flex-col items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVote(post.id, 1);
        }}
        className={`p-1 rounded hover:bg-gray-200 ${post.user_vote === 1 ? 'text-[#f23b36]' : 'text-gray-400'}`}
      >
        <ArrowUp size={20} />
      </button>
      <span className="text-xs font-semibold my-1">{post.vote_count ? post.vote_count : 0}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVote(post.id, -1);
        }}
        className={`p-1 rounded hover:bg-gray-200 ${post.user_vote === -1 ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <ArrowDown size={20} />
      </button>
    </div>
  );
}