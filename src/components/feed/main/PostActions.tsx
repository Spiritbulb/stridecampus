import { Post } from '@/utils/supabaseClient';
import { MessageSquare, Share, Bookmark } from 'lucide-react';

interface PostActionsProps {
  post: Post;
  onShare: (postId: string) => void;
}

export default function PostActions({ post, onShare }: PostActionsProps) {
  return (
    <div className="flex items-center gap-4 text-gray-500 text-xs">
      <button className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded">
        <MessageSquare size={16} />
        <span>{post.comment_count}</span>
      </button>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onShare(post.id);
        }}
        className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded"
      >
        <Share size={16} />
        <span>{post.share_count}</span>
      </button>
    </div>
  );
}