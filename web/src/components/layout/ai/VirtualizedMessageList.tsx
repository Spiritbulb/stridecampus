import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Message } from './types';

interface VirtualizedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  className?: string;
}

// Configuration for virtualization
const VIRTUAL_CONFIG = {
  ITEM_HEIGHT: 80, // Estimated height per message
  OVERSCAN: 5, // Number of items to render outside visible area
  CONTAINER_HEIGHT: 400, // Default container height
};

// Memoized message item component
const MessageItem = React.memo<{
  message: Message;
  style: React.CSSProperties;
}>(({ message, style }) => {
  return (
    <div style={style} className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          message.isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-700'
        }`}>
          {message.isUser ? 'U' : 'N'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {message.isUser ? 'You' : 'Nia'}
            </span>
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  isLoading,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = React.useState(VIRTUAL_CONFIG.CONTAINER_HEIGHT);
  const [scrollTop, setScrollTop] = React.useState(0);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / VIRTUAL_CONFIG.ITEM_HEIGHT);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / VIRTUAL_CONFIG.ITEM_HEIGHT),
      messages.length - 1
    );

    return {
      start: Math.max(0, startIndex - VIRTUAL_CONFIG.OVERSCAN),
      end: Math.min(messages.length - 1, endIndex + VIRTUAL_CONFIG.OVERSCAN),
    };
  }, [scrollTop, containerHeight, messages.length]);

  // Get visible messages
  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.start, visibleRange.end + 1);
  }, [messages, visibleRange]);

  // Calculate total height for scrollbar
  const totalHeight = messages.length * VIRTUAL_CONFIG.ITEM_HEIGHT;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current && !isLoading) {
      const container = containerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages.length, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start a conversation with Nia!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      onScroll={handleScroll}
      style={{ height: containerHeight }}
    >
      {/* Virtual spacer for items before visible range */}
      <div style={{ height: visibleRange.start * VIRTUAL_CONFIG.ITEM_HEIGHT }} />
      
      {/* Visible messages */}
      {visibleMessages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          style={{
            height: VIRTUAL_CONFIG.ITEM_HEIGHT,
            position: 'relative',
          }}
        />
      ))}
      
      {/* Virtual spacer for items after visible range */}
      <div style={{ 
        height: (messages.length - visibleRange.end - 1) * VIRTUAL_CONFIG.ITEM_HEIGHT 
      }} />
    </div>
  );
};

// Fallback to regular message list for small message counts
export const MessageList: React.FC<VirtualizedMessageListProps> = (props) => {
  const shouldVirtualize = props.messages.length > 50; // Only virtualize for large lists
  
  if (shouldVirtualize) {
    return <VirtualizedMessageList {...props} />;
  }

  // Regular message list for small counts
  return (
    <div className={`h-full overflow-y-auto ${props.className || ''}`}>
      {props.isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : props.messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation with Nia!</p>
          </div>
        </div>
      ) : (
        props.messages.map((message) => (
          <div key={message.id} className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                message.isUser 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {message.isUser ? 'U' : 'N'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {message.isUser ? 'You' : 'Nia'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
