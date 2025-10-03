import React, { memo, useCallback } from 'react';
import { MessageListProps } from '@/types/chat';
import TypingIndicator from './TypingIndicator';

const MessageList: React.FC<MessageListProps> = memo(({
  messages,
  currentUserId,
  loading,
  messagesEndRef,
  typingUsers = []
}) => {
  // Memoized date formatter for better performance
  const formatTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // Function to identify and linkify URLs in text
  const linkifyText = useCallback((text: string, isCurrentUser: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        // Don't make app links clickable inline - they'll be in the carousel
        if (part.startsWith('https://app.stridecampus.com/')) {
          return (
            <span 
              key={index}
              className={isCurrentUser ? 'text-white/90 italic' : 'text-gray-600 italic'}
            >
              {part}
            </span>
          );
        }
        
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline hover:opacity-80 transition-opacity ${
              isCurrentUser ? 'text-white font-medium' : 'text-[#f23b36] font-medium'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, []);

  // Extract all app links from message text
  const extractAppLinks = useCallback((text: string) => {
    const urlRegex = /https?:\/\/app\.stridecampus\.com\/[^\s]+/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }, []);

  // Get page name from app URL
  const getPageNameFromUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathSegments.length === 0) return 'Home';
      
      // Get the last segment and format it nicely
      const lastSegment = pathSegments[pathSegments.length - 1];
      return lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch {
      return 'View Page';
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f23b36]" role="status" aria-label="Loading messages"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#f23b36] to-[#d63031] rounded-2xl flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1.5">Start the conversation</h3>
          <p className="text-sm text-gray-600">Send your first message to begin chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-4 py-2">
      <div className="max-w-4xl mx-auto space-y-3">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender_id === currentUserId;
          const isLastMessage = index === messages.length - 1;
          const appLinks = extractAppLinks(message.message);
          
          return (
            <div 
              key={message.id} 
              className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`
                  max-w-[min(75%,500px)] px-4 py-2.5 rounded-2xl
                  transition-all duration-150 ease-out
                  ${isCurrentUser 
                    ? 'bg-gradient-to-br from-[#f23b36] to-[#e53e3e] text-white shadow-sm' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }
                `}
              >
                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                  {linkifyText(message.message, isCurrentUser)}
                </p>
              </div>
              
              {/* App Links Carousel */}
              {appLinks.length > 0 && (
                <div className="mt-2 max-w-[min(75%,500px)] w-full">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {appLinks.map((appLink, linkIndex) => {
                      const pageName = getPageNameFromUrl(appLink);
                      
                      return (
                        <button
                          key={linkIndex}
                          onClick={() => {
                            const urlObj = new URL(appLink);
                            window.location.href = urlObj.pathname + urlObj.search + urlObj.hash;
                          }}
                          className={`
                            px-4 py-2.5 rounded-xl flex-shrink-0
                            bg-white border border-gray-200 shadow-sm
                            hover:shadow-md hover:border-[#f23b36]/30
                            transition-all duration-200
                            flex items-center gap-2.5
                            group
                            min-w-[200px]
                          `}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f23b36] to-[#e53e3e] flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-800 truncate">{pageName}</span>
                          </div>
                          <svg 
                            className="w-4 h-4 text-gray-400 group-hover:text-[#f23b36] group-hover:translate-x-0.5 transition-all flex-shrink-0" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                  {appLinks.length > 1 && (
                    <p className="text-[10px] text-gray-400 mt-1 px-1">
                      Scroll to see all links →
                    </p>
                  )}
                </div>
              )}
              
              {isLastMessage && (
                <time 
                  className="block text-[11px] mt-1 px-1 text-gray-500"
                  dateTime={message.created_at}
                >
                  {formatTime(message.created_at)}
                </time>
              )}
            </div>
          );
        })}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} aria-hidden="true" />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.loading === nextProps.loading &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.typingUsers?.length === nextProps.typingUsers?.length
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;