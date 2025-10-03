import { useState, useEffect } from 'react';
import { Post } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting';

interface VoteSectionProps {
  post: Post;
  onVote: (postId: string, voteType: number) => void;
  user: User | null;
}

export default function VoteSection({ post, onVote, user }: VoteSectionProps) {
  const [voteCount, setVoteCount] = useState(post.vote_count || 0);
  const [userVote, setUserVote] = useState(post.user_vote || 0);

  // Update local state when post prop changes
  useEffect(() => {
    setVoteCount(post.vote_count || 0);
    setUserVote(post.user_vote || 0);
  }, [post.vote_count, post.user_vote]);

  // Set up realtime voting for this post
  const { isConnected } = useRealtimeVoting({
    postId: post.id,
    onVoteUpdate: (update) => {
      // Only update if this is for our post
      if (update.targetId === post.id && update.type === 'post') {
        console.log('🔄 Realtime vote update for post:', update);
        
        // Update vote count and user's vote state
        if (update.action === 'INSERT') {
          setVoteCount(prev => prev + update.voteType);
          if (update.userId === user?.id) {
            setUserVote(update.voteType);
          }
        } else if (update.action === 'DELETE') {
          setVoteCount(prev => prev - (update.voteType || 0));
          if (update.userId === user?.id) {
            setUserVote(0);
          }
        } else if (update.action === 'UPDATE') {
          // Handle vote type changes
          if (update.userId === user?.id) {
            setUserVote(update.voteType);
          }
          // For vote count, we'd need to know the old vote type to calculate the difference
          // This is a limitation - we might need to refetch or use a different approach
        }
      }
    }
  });

  // Debug logging to see vote state
  console.log(`Post ${post.id} vote state:`, {
    user_vote: userVote,
    vote_count: voteCount,
    user_id: user?.id,
    realtime_connected: isConnected
  });

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVote(post.id, 1);
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded-full hover:bg-red-50 transition-colors duration-200 ${
          userVote === 1 ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-red-500'
        }`}
      >
        <ArrowUp size={16} />
      </button>
      
      <span className={`text-sm font-medium min-w-[20px] text-center ${
        userVote === 1 ? 'text-red-500' : 
        userVote === -1 ? 'text-blue-500' : 'text-gray-700'
      }`}>
        {voteCount}
      </span>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVote(post.id, -1);
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded-full hover:bg-blue-50 transition-colors duration-200 ${
          userVote === -1 ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-blue-500'
        }`}
      >
        <ArrowDown size={16} />
      </button>
    </div>
  );
}