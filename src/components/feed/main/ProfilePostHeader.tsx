import { Post, User } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { User2, Pin, MoreHorizontal } from 'lucide-react';

interface PostHeaderProps {
  post: Post;
  user?: User | null;
}

const checkmarkImg = <img src="/check.png" alt="Verified" className="inline w-4 h-4 ml-1" />;

export default function PostHeader({ post, user }: PostHeaderProps) {
  let display_name = post.author?.full_name || 'Unknown User';

  if (user && post.author_id === user.id) {
    display_name = 'You';
  }

  return (
    <div className="flex mb-3">
      
      <div className="flex items-start gap-3">
        <img 
          src={post.author?.avatar_url || ''} 
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
        {/* Pin indicator for pinned posts */}
      {post.pinned && (
        <div className="flex items-center text-gray-500 text-sm mb-2 ml-3">
          <Pin size={14} className="mr-2 text-red-500" />
        </div>
      )}
        
        <button 
          className="p-1 rounded-full hover:bg-gray-100 text-gray-500 ml-3"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}