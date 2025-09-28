import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { ChatsListProps, ChatParticipant } from '@/types/chat';

// Consistent nickname generator utility
const generateConsistentNickname = (userId: string): string => {
  const adjectives = [
    'Cool', 'Swift', 'Bright', 'Silent', 'Bold', 'Clever', 'Gentle', 'Quick',
    'Wise', 'Brave', 'Sharp', 'Calm', 'Wild', 'Lucky', 'Swift', 'Noble',
    'Fierce', 'Mellow', 'Zesty', 'Cosmic', 'Mystic', 'Epic', 'Ultra', 'Mega'
  ];
  
  const nouns = [
    'Wolf', 'Eagle', 'Tiger', 'Dragon', 'Phoenix', 'Lion', 'Fox', 'Bear',
    'Hawk', 'Raven', 'Storm', 'Thunder', 'Lightning', 'Shadow', 'Flame',
    'Star', 'Moon', 'Sun', 'Ocean', 'Mountain', 'River', 'Forest', 'Wind', 'Fire'
  ];
  
  // Use userId as seed for consistent generation
  let hash = 0;
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 999 + 1;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
};

// Virtual scrolling hook for performance
const useVirtualScroll = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      visibleItems: items.slice(Math.max(0, startIndex), endIndex)
    };
  }, [items, scrollTop, itemHeight, containerHeight]);

  return { visibleItems, setScrollTop };
};

// Memoized chat item component
const ChatItem = memo<{
  chat: any;
  currentUserId: string;
  isActive: boolean;
  onSelectChat: (chat: any) => void;
  style?: React.CSSProperties;
}>(({ chat, currentUserId, isActive, onSelectChat, style }) => {
  const chatOtherParticipant = useMemo(() => 
    chat.participants.find((p: ChatParticipant) => p.user_id !== currentUserId),
    [chat.participants, currentUserId]
  );

  const formatTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'now';
    } else if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  const handleClick = useCallback(() => {
    onSelectChat(chat);
  }, [chat, onSelectChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectChat(chat);
    }
  }, [chat, onSelectChat]);

  if (!chatOtherParticipant?.users) return null;

  // Generate consistent display name
  const displayName = chatOtherParticipant.users.full_name || 
    generateConsistentNickname(chatOtherParticipant.user_id);
  
  // Check if this is the current user
  const isCurrentUser = chatOtherParticipant.user_id === currentUserId;
  const finalDisplayName = isCurrentUser ? 'You' : displayName;

  return (
    <div
      style={style}
      className={`group relative px-4 py-3 cursor-pointer transition-all duration-200 border-l-2 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 border-l-blue-500 shadow-sm' 
          : 'border-l-transparent hover:bg-gray-50 hover:border-l-gray-200'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Chat with ${finalDisplayName}`}
      aria-selected={isActive}
    >
      {/* Subtle active indicator */}
      {isActive && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full opacity-60" />
      )}
      
      <div className="flex items-center gap-3">
        {/* Avatar with online status */}
        <div className="relative flex-shrink-0">
          <img
            src={chatOtherParticipant.users.avatar_url || '/default-avatar.png'}
            alt={finalDisplayName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all"
            loading="lazy"
          />
          {/* Online indicator - you can connect this to real online status */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
        </div>

        {/* Chat content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="font-medium text-gray-900 truncate">
                {finalDisplayName}
              </h3>
              {/* Verified checkmark - you can connect this to real verification status */}
              {chatOtherParticipant.users.checkmark && (
                <img 
                  src="/check.png" 
                  alt="Verified" 
                  className="w-3.5 h-3.5 flex-shrink-0" 
                />
              )}
              {/* Username handle */}
              {chatOtherParticipant.users.username && !isCurrentUser && (
                <span className="text-xs text-gray-500 truncate">
                  @{chatOtherParticipant.users.username}
                </span>
              )}
            </div>
            <time className="text-xs text-gray-500 flex-shrink-0 ml-2 font-mono">
              {chat.last_message_at ? formatTime(chat.last_message_at) : ''}
            </time>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 truncate flex-1">
              {chat.last_message || 'Start a conversation...'}
            </p>
            
            {/* Unread count - you can connect this to real unread state */}
            {chat.unread_count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full min-w-[20px] text-center">
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatItem.displayName = 'ChatItem';

// Enhanced search/filter component
const ChatSearch = memo<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalChats: number;
  filteredChats: number;
}>(({ searchQuery, onSearchChange, totalChats, filteredChats }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative px-4 pb-3">
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'transform scale-[1.02]' : ''
      }`}>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-sm transition-all"
        />
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {searchQuery && (
        <p className="text-xs text-gray-500 mt-2 px-1">
          {filteredChats} of {totalChats} conversations
        </p>
      )}
    </div>
  );
});

ChatSearch.displayName = 'ChatSearch';

// Main component
const ChatsList: React.FC<ChatsListProps> = memo(({
  chats,
  activeChat,
  currentUserId,
  loading,
  isInitialized,
  onSelectChat,
  onStartNewChat,
  isMobile = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Filter chats based on search
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    return chats.filter(chat => {
      const otherParticipant = chat.participants.find(
        (p: ChatParticipant) => p.user_id !== currentUserId
      );
      const displayName = otherParticipant?.users?.full_name || 
        generateConsistentNickname(otherParticipant?.user_id || '');
      
      return displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        otherParticipant?.users?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery, currentUserId]);

  // Virtual scrolling for performance
  const ITEM_HEIGHT = 72; // Height of each chat item
  const { visibleItems, setScrollTop } = useVirtualScroll(
    filteredChats, 
    ITEM_HEIGHT, 
    containerHeight
  );

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, [setScrollTop]);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (scrollContainerRef.current) {
        setContainerHeight(scrollContainerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="px-4 py-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${
      isMobile 
        ? 'fixed inset-0 z-50 bg-white' 
        : 'w-80 border-r border-gray-200/60'
    } flex flex-col bg-white/95 backdrop-blur-sm`}>
      
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Chats
            {filteredChats.length > 0 && (
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {filteredChats.length}
              </span>
            )}
          </h1>
          
          <button
            onClick={onStartNewChat}
            className="w-10 h-10 bg-[#f23b36] hover:bg-[#f23b36]/70 text-white rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
            title="Start new chat"
            aria-label="Start new chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <ChatSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalChats={chats.length}
          filteredChats={filteredChats.length}
        />
      </div>

      {/* Chat list */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        onScroll={handleScroll}
      >
        {loading && !isInitialized ? (
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            
            {searchQuery ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search or start a new conversation
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#f23b36] hover:text-[#f23b36]/70 font-medium transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 mb-6">
                  Start your first conversation to get started
                </p>
                <button
                  onClick={onStartNewChat}
                  className="px-6 py-2.5 bg-[#f23b36] hover:bg-[#f23b36]/70 text-white rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Start chatting
                </button>
              </>
            )}
          </div>
        ) : (
          // Virtual scrolling container
          <div style={{ height: filteredChats.length * ITEM_HEIGHT, position: 'relative' }}>
            {visibleItems.visibleItems.map((chat, index) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentUserId={currentUserId}
                isActive={activeChat?.id === chat.id}
                onSelectChat={onSelectChat}
                style={{
                  position: 'absolute',
                  top: (visibleItems.startIndex + index) * ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ChatsList.displayName = 'ChatsList';

export default ChatsList;