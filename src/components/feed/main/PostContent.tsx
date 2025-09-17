import { Post } from '@/utils/supabaseClient';
import { Link, FileText, ExternalLink } from 'lucide-react';

interface PostContentProps {
  post: Post;
}

export default function PostContent({ post }: PostContentProps) {
  return (
    <div className="ml-13"> {/* Align with the text content under avatar */}
      {post.title && (
        <h3 className="text-xl font-normal text-gray-900 mb-2 leading-tight">
          {post.title}
        </h3>
      )}
      
      {post.content && (
        <p className="text-gray-900 text-sm mb-3 leading-normal whitespace-pre-wrap">
          {post.content}
        </p>
      )}
      
      {post.is_link_post && post.link_url && (
        <div className="border border-gray-200 rounded-xl p-3 mb-3 hover:bg-gray-50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <ExternalLink size={14} className="mr-1" />
                <span className="truncate">{new URL(post.link_url).hostname}</span>
              </div>
              <div className="text-sm text-blue-600 hover:underline cursor-pointer">
                {post.link_url}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource tags */}
      {post.resource_tags && post.resource_tags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <FileText size={14} className="mr-2" />
            <span>Linked resources</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.resource_tags.map(resource => (
              <span 
                key={resource.id} 
                className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm rounded-full cursor-pointer transition-colors"
              >
                {resource.original_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}