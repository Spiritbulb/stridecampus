import { Post, User } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { User2, Pin } from 'lucide-react';


interface PostHeaderProps {
  post: Post;
  user?: User | null;
}

const checkmarkImg = <img src="/check.png" alt="Verified" className="inline w-3 h-3 ml-0.5" />;

export default function PostHeader({ post, user }: PostHeaderProps) {
    let display_name = post.author?.full_name || 'Unknown User';

    if (user && post.author_id === user.id) {
        display_name = 'You';
    }

    if (post.pinned) {
        return (
    <div className="flex items-center text-xs text-gray-500 mb-2">
      <img src={post.author?.avatar_url || ''} alt="Avatar" className="w-5 h-5 rounded-full mr-1" />
      <a href={`/u/${post.author?.username}`} className="flex items-center hover:underline">
      <span>{display_name}</span>{ post.author?.checkmark && checkmarkImg }
        </a>
      <span className="mx-1"></span>
      <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>

              <div className="text-xs font-medium px-3 py-1 flex items-center">
                  <Pin size={14} className="mr-1 text-[#f23b36]" />
              </div>
    </div>
  );
    } else {

  return (
    <div className="flex items-center text-xs text-gray-500 mb-2">
      <img src={post.author?.avatar_url || ''} alt="Avatar" className="w-5 h-5 rounded-full mr-1" />
      <a href={`/u/${post.author?.username}`} className="flex items-center hover:underline">
      <span>{display_name}</span>{ post.author?.checkmark && checkmarkImg }
        </a>
      <span className="mx-1">•</span>
      <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
    </div>
  );}
}