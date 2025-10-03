import { Post, User, supabase } from '@/utils/supabaseClient';
import { User2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PostHeaderProps {
  post: Post;
  user?: User | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const checkmarkImg = <img src="/check.png" alt="Verified" className="inline w-3.5 h-3.5 ml-0.5" />;

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
  
  let hash = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  } else {
    hash = Math.floor(Math.random() * 1000000);
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 999 + 1;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
};

// Format time to short format (1m, 3h, 2d, etc.)
const formatTimeShort = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return `${diffSecs}s`;
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${diffYears}y`;
};

export default function PostHeader({ post, user, onEdit, onDelete }: PostHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = user && post.author_id === user.id;
  
  let display_name = post.author?.full_name || generateRandomNickname(post.id);
  if (isOwner) {
    display_name = 'You';
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit?.();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', post.id);
        
        if (error) throw error;
        onDelete?.();
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  return (
    <div className="flex items-start gap-3">
      <img 
        src={post.author?.avatar_url || '/default-avatar.png'} 
        alt="Avatar" 
        className="w-10 h-10 rounded-full flex-shrink-0 object-cover" 
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <a 
            href={`/u/${post.author?.username}`} 
            className="font-semibold text-gray-900 hover:underline text-[15px] truncate flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {display_name}
            {post.author?.checkmark && checkmarkImg}
          </a>
          
          <span className="text-gray-500 text-[13px]">·</span>
          
          <span className="text-gray-500 text-[13px]">
            {formatTimeShort(new Date(post.created_at))}
          </span>
        </div>
        
        <a 
          href={`/u/${post.author?.username}`} 
          className="text-gray-500 hover:underline text-[10px] block"
          onClick={(e) => e.stopPropagation()}
        >
          @{post.author?.username}
        </a>
      </div>
      
      {isOwner && (
        <div className="relative">
          <button 
            className="p-1.5 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal size={18} />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                >
                  <Pencil size={16} />
                  Edit post
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600"
                >
                  <Trash2 size={16} />
                  Delete post
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}