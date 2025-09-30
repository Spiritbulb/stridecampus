import { Post, User } from '@/utils/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { User2, Pin, MoreHorizontal } from 'lucide-react';

interface PostHeaderProps {
  post: Post;
  user?: User | null;
}

const checkmarkImg = <img src="/check.png" alt="Verified" className="inline w-4 h-4 ml-1" />;

// Random nickname generator
const generateRandomNickname = (seed?: string): string => {
  const adjectives = [
    'Cool', 'Swift', 'Bright', 'Silent', 'Bold', 'Clever', 'Gentle', 'Quick',
    'Wise', 'Brave', 'Sharp', 'Calm', 'Wild', 'Lucky', 'Swift', 'Noble',
    'Fierce', 'Mellow', 'Zesty', 'Cosmic', 'Mystic', 'Epic', 'Ultra', 'Mega'
  ];
  
  const nouns = [
    'Wolf', 'Eagle', 'Tiger', 'Dragon', 'Phoenix', 'Lion', 'Fox', 'Bear',
    'Hawk', 'Raven', 'Storm', 'Thunder', 'Lightning', 'Shadow', 'Flame',
    'Star', 'Moon', 'Sun', 'Ocean', 'Mountain', 'River', 'Forest', 'Wind', 'Fire'
  ];
  
  // Use seed (like post ID) to generate consistent nickname for the same post
  let hash = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
  } else {
    hash = Math.floor(Math.random() * 1000000);
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 999 + 1;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
};

export default function PostHeader({ post, user }: PostHeaderProps) {
  let display_name = post.author?.full_name || generateRandomNickname(post.id);

  if (user && post.author_id === user.id) {
    display_name = 'You';
  }

  return (
    <div className="flex items-start gap-3">
      <img 
        src={post.author?.avatar_url || '/default-avatar.png'} 
        alt="Avatar" 
        className="w-10 h-10 rounded-full flex-shrink-0" 
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <a 
            href={`/u/${post.author?.username}`} 
            className="flex items-center hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-semibold text-gray-900 text-sm truncate">
              {display_name}
            </span>
            {post.author?.checkmark && checkmarkImg}
          </a>
          
          <span className="text-gray-500 text-sm">@{post.author?.username}</span>
          <span className="text-gray-500 text-sm">•</span>
          <span className="text-gray-500 text-sm">
            {formatDistanceToNow(new Date(post.created_at))} ago
          </span>
        </div>
      </div>
      
      <button 
        className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}