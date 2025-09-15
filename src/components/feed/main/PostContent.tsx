import { Post } from '@/utils/supabaseClient';
import { Link, FileText } from 'lucide-react';

interface PostContentProps {
  post: Post;
}

export default function PostContent({ post }: PostContentProps) {
  return (
    <>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{post.title}</h3>
      
      {post.content && (
        <p className="text-gray-800 text-sm mb-3">{post.content}</p>
      )}
      
      {post.is_link_post && post.link_url && (
        <div className="flex items-center text-sm text-blue-500 mb-3">
          <Link size={16} className="mr-1" />
          <span className="truncate">{post.link_url}</span>
        </div>
      )}

      {/* Resource tags */}
      {post.resource_tags && post.resource_tags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <FileText size={14} className="mr-1" />
            <span>Linked resources:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.resource_tags.map(resource => (
              <span key={resource.id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {resource.original_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}