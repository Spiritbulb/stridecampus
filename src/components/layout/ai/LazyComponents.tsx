import React, { Suspense, lazy } from 'react';

// Lazy load AI chat components for better initial page load performance
const ChatContainer = lazy(() => import('./ChatContainer').then(module => ({ default: module.ChatContainer })));
const ChatListView = lazy(() => import('./views/ChatListView').then(module => ({ default: module.ChatListView })));
const ActiveChatView = lazy(() => import('./views/ActiveChatView').then(module => ({ default: module.ActiveChatView })));
const MessageList = lazy(() => import('./VirtualizedMessageList').then(module => ({ default: module.MessageList })));
const ChatManager = lazy(() => import('./ChatManager').then(module => ({ default: module.ChatManager })));

// Loading components
const ChatLoadingSkeleton = () => (
  <div className="flex flex-col h-full bg-white animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded-full"></div>
    </div>
    <div className="flex-1 p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MessageLoadingSkeleton = () => (
  <div className="h-full overflow-y-auto animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Wrapper components with Suspense
export const LazyChatContainer: React.FC<React.ComponentProps<typeof ChatContainer>> = (props) => (
  <Suspense fallback={<ChatLoadingSkeleton />}>
    <ChatContainer {...props} />
  </Suspense>
);

export const LazyChatListView: React.FC<React.ComponentProps<typeof ChatListView>> = (props) => (
  <Suspense fallback={<ChatLoadingSkeleton />}>
    <ChatListView {...props} />
  </Suspense>
);

export const LazyActiveChatView: React.FC<React.ComponentProps<typeof ActiveChatView>> = (props) => (
  <Suspense fallback={<ChatLoadingSkeleton />}>
    <ActiveChatView {...props} />
  </Suspense>
);

export const LazyMessageList: React.FC<React.ComponentProps<typeof MessageList>> = (props) => (
  <Suspense fallback={<MessageLoadingSkeleton />}>
    <MessageList {...props} />
  </Suspense>
);

export const LazyChatManager: React.FC<React.ComponentProps<typeof ChatManager>> = (props) => (
  <Suspense fallback={<ChatLoadingSkeleton />}>
    <ChatManager {...props} />
  </Suspense>
);

// Preload function for critical components
export const preloadAIChatComponents = () => {
  // Preload the most commonly used components
  import('./ChatContainer');
  import('./views/ChatListView');
  import('./VirtualizedMessageList');
};

// Hook to preload components on user interaction
export const usePreloadAIChat = () => {
  React.useEffect(() => {
    // Preload when user hovers over AI chat button or similar
    const handleMouseEnter = () => {
      preloadAIChatComponents();
    };

    // Add event listeners to common AI chat triggers
    const triggers = document.querySelectorAll('[data-preload-ai-chat]');
    triggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      triggers.forEach(trigger => {
        trigger.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, []);
};
