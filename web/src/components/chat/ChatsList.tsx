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
      className="group px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Chat with ${finalDisplayName}`}
      aria-selected={isActive}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-medium text-gray-900 truncate pr-2">
              {finalDisplayName}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {chat.last_message_at ? formatTime(chat.last_message_at) : ''}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 truncate pr-2">
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

// Enhanced search/filter component matching ChatListView design
const ChatSearch = memo<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalChats: number;
  filteredChats: number;
}>(({ searchQuery, onSearchChange, totalChats, filteredChats }) => {
  return (
    <div className="relative">
      <svg 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-11 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-gray-200 transition-colors"
      />
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
    } flex flex-col bg-white`}>
      
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Chats</h1>
          </div>
          <button
            onClick={onStartNewChat}
            className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <ChatSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalChats={chats.length}
          filteredChats={filteredChats.length}
        />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading && !isInitialized ? (
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 pb-20">
            {searchQuery ? (
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No chats found</h3>
                <p className="text-gray-500 text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations yet</h3>
                <p className="text-gray-500 text-sm mb-6">Start chatting with friends</p>
                <button 
                  onClick={onStartNewChat}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full transition-colors"
                >
                  Start Chatting
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentUserId={currentUserId}
                isActive={activeChat?.id === chat.id}
                onSelectChat={onSelectChat}
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