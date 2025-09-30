import { Post } from '@/utils/supabaseClient';
import { MessageCircle, Share } from 'lucide-react';

interface PostActionsProps {
  post: Post;
  onShare: (postId: string) => void;
}

export default function PostActions({ post, onShare }: PostActionsProps) {
  return (
    <div className="flex items-center justify-start gap-4 md:gap-6 text-gray-500 ml-13">
      <button 
        className="flex items-center gap-1 hover:text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-full transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageCircle size={16} className="flex-shrink-0" />
        <span className="text-sm">{post.comment_count || 0}</span>
      </button>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onShare(post.id);
        }}
        className="flex items-center gap-1 hover:text-green-500 hover:bg-green-50 px-2 py-1 rounded-full transition-colors duration-200"
      >
        <Share size={16} className="flex-shrink-0" />
        <span className="text-sm">{post.share_count || 0}</span>
      </button>
    </div>
  );
}