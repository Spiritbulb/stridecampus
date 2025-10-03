import { Post } from '@/utils/supabaseClient';
import { Link, FileText, ExternalLink, Hash, AtSign } from 'lucide-react';

interface PostContentProps {
  post: Post;
}

export default function PostContent({ post }: PostContentProps) {
  // Function to render content with highlighted hashtags, mentions, and links
  const renderContentWithHighlights = (content: string) => {
    if (!content) return null;

    // Enhanced regex to capture URLs, hashtags, and mentions
    const regex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)|(#[\w\u00C0-\u017F]+)|(@[\w\u00C0-\u017F]+)|(\s+)/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const [matchedText] = match;

      if (matchedText.match(/^https?:\/\/|^www\./)) {
        // URL - make it a clickable link
        const url = matchedText.startsWith('www.') ? 'https://' + matchedText : matchedText;
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {matchedText}
          </a>
        );
      } else if (matchedText.startsWith('#')) {
        // Hashtag
        parts.push(
          <span key={match.index} className="text-[#f23b36] hover:underline cursor-pointer">
            {matchedText}
          </span>
        );
      } else if (matchedText.startsWith('@')) {
        // Mention
        parts.push(
          <a 
            key={match.index} 
            href={`/u/${matchedText.slice(1)}`}
            className="text-gray-500 hover:underline cursor-pointer"
          >
            {matchedText}
          </a>
        );
      } else {
        // Whitespace or other text
        parts.push(matchedText);
      }

      lastIndex = match.index + matchedText.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts;
  };

  // Function to get hostname from URL
  const getHostname = (url: string): string => {
    try {
      return new URL(url.startsWith('www.') ? 'https://' + url : url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="ml-13">
      
      {post.content && (
        <p className="text-gray-900 text-[17px] mb-3 leading-normal whitespace-pre-wrap break-words">
          {renderContentWithHighlights(post.content)}
        </p>
      )}

      {/* Link previews for multiple links */}
      {post.link_url && post.link_url.length > 0 && (
        <div className="space-y-3 mb-3">
          {post.link_url.map((url, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <ExternalLink size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{getHostname(url)}</span>
                  </div>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:underline break-all"
                  >
                    {url}
                  </a>
                </div>
              </div>
            </div>
          ))}
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