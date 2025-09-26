import { Post } from '@/utils/supabaseClient';
import { Link, FileText, ExternalLink, Hash, AtSign } from 'lucide-react';

interface PostContentProps {
  post: Post;
}

export default function PostContent({ post }: PostContentProps) {
  // Function to render content with highlighted hashtags and mentions
  const renderContentWithHighlights = (content: string) => {
    if (!content) return null;

    // Split content and highlight hashtags and mentions
    const parts = content.split(/(\s+)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span key={index} className="text-[#f23b36] hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        return (
          <a key={index} href={`/u/${part.slice(1)}`}>
          <span key={index} className="text-gray-500 hover:underline cursor-pointer">
            {part}
          </span>
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="ml-13">
      
      {post.content && (
        <p className="text-gray-900 text-base mb-3 leading-normal whitespace-pre-wrap">
          {renderContentWithHighlights(post.content)}
        </p>
      )}

      {/* Link preview */}
      {post.is_link_post && post.link_url && (
        <div className="border border-gray-200 rounded-xl p-3 mb-3 hover:bg-gray-50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <ExternalLink size={14} className="mr-1" />
                <span className="truncate">{new URL(post.link_url).hostname}</span>
              </div>
              <a 
                href={post.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:underline"
              >
                {post.link_url}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Resource tags */}
      {post.resource_tags && post.resource_tags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <FileText size={14} className="mr-2" />
            <span>Attached resources</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.resource_tags.map(resource => (
              <span 
                key={resource.id} 
                className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded-full cursor-pointer transition-colors"
              >
                <FileText size={12} className="mr-1" />
                {resource.original_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}