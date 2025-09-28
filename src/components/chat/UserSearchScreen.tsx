import React, { memo, useState, useRef, useEffect } from 'react';
import { UserSearchScreenProps } from '@/types/chat';

// Consistent nickname generator utility (same as other components)
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
  
  let hash = 0;
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 999 + 1;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
};

// Memoized user item component for performance
const UserItem = memo<{
  user: any;
  onStartChat: (user: any) => void;
  isMobile?: boolean;
}>(({ user, onStartChat, isMobile = false }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const displayName = user.full_name || generateConsistentNickname(user.id);
  
  const handleClick = () => {
    onStartChat(user);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStartChat(user);
    }
  };

  return (
    <div
      className={`group px-4 py-3 cursor-pointer transition-all duration-200 border-b border-gray-50/80 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 active:scale-[0.99] ${
        isPressed ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      tabIndex={0}
      role="button"
      aria-label={`Start chat with ${displayName}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with subtle ring */}
        <div className="relative flex-shrink-0">
          <img
            src={user.avatar_url || '/default-avatar.png'}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200 shadow-sm"
            loading="lazy"
          />
          {/* Online indicator placeholder */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-300 border-2 border-white rounded-full opacity-60" />
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">
              {displayName}
            </h3>
            {/* Verified checkmark */}
            {user.checkmark && (
              <img 
                src="/check.png" 
                alt="Verified" 
                className="w-4 h-4 flex-shrink-0" 
              />
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            @{user.username}
          </p>
        </div>

        {/* Action button */}
        <button 
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md group-hover:scale-105 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onStartChat(user);
          }}
        >
          Chat
        </button>
      </div>
    </div>
  );
});

UserItem.displayName = 'UserItem';

const UserSearchScreen: React.FC<UserSearchScreenProps> = memo(({
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  onStartChat,
  onBackToChats,
  isMobile = false
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const hasResults = searchResults.length > 0;
  const showNoResults = searchQuery && !hasResults && !searchLoading;
  const showEmptyState = !searchQuery && !searchLoading;

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="px-4 py-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="w-12 h-6 bg-gray-200 rounded-xl" />
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
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBackToChats}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
            aria-label="Back to chats"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">New Chat</h1>
        </div>
        
        {/* Search input */}
        <div className={`relative transition-all duration-200 ${
          searchFocused ? 'transform scale-[1.02]' : ''
        }`}>
          <div className={`relative rounded-2xl transition-all duration-200 ${
            searchFocused 
              ? 'bg-white shadow-lg ring-2 ring-blue-500/20' 
              : 'bg-gray-50 shadow-sm hover:bg-gray-100/80'
          }`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg 
                className={`h-4 w-4 transition-colors duration-200 ${
                  searchFocused ? 'text-blue-500' : 'text-gray-400'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search users by username..."
              className="w-full pl-11 pr-4 py-3 bg-transparent border-0 outline-none placeholder-gray-500 text-sm transition-all duration-200"
              aria-label="Search users"
              autoComplete="off"
              maxLength={50}
            />
            
            {/* Clear search button */}
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search results count */}
          {searchQuery && hasResults && (
            <p className="text-xs text-gray-500 mt-2 px-1">
              {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {searchLoading ? (
          <div className="space-y-1 py-2">
            {[...Array(5)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : showNoResults ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-4">
              We couldn't find anyone with that username
            </p>
            <button
              onClick={() => onSearchChange('')}
              className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : hasResults ? (
          <div className="py-1">
            {searchResults.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                onStartChat={onStartChat}
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Find someone to chat with</h3>
            <p className="text-gray-500">
              Search for users by their username to start a conversation
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
});

UserSearchScreen.displayName = 'UserSearchScreen';

export default UserSearchScreen;