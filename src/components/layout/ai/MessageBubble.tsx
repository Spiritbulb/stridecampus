import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
  };
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const [displayContent, setDisplayContent] = useState(message.content);
  const [isStreaming, setIsStreaming] = useState(false);

  // Update display content when message content changes (for streaming)
  useEffect(() => {
    if (message.content !== displayContent) {
      setIsStreaming(true);
      setDisplayContent(message.content);
      
      // Reset streaming state after a short delay
      const timer = setTimeout(() => {
        setIsStreaming(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [message.content, displayContent]);

  return (
    <div className="py-4 px-6">
      <div className="max-w-4xl mx-auto">
        <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-1`}>
          
        </div>
        <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-2xl px-4 py-3 rounded-2xl transition-all duration-200 ${
            message.isUser 
              ? 'bg-gradient-to-r from-[#f23b36] to-[#e53e3e] text-white' 
              : 'bg-white'
          } ${isStreaming && !message.isUser ? '' : ''}`}>
            {message.isUser ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {displayContent}
              </div>
            ) : (
              <div className="relative">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0 text-sm leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#f23b36] hover:text-[#d32f2a] underline font-medium"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    code: ({ children }) => (
                      <code className="bg-gray-50 text-gray-700 px-2 py-1 rounded-md text-xs font-mono border">
                        {children}
                      </code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-3 border-[#f23b36] pl-4 italic text-gray-600 my-3">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};