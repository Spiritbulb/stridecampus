import React, { memo, useState, useEffect } from 'react';
import { ChatHeaderProps } from '@/types/chat';

// Consistent nickname generator utility (same as ChatsList)
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

const ChatHeader: React.FC<ChatHeaderProps> = memo(({
  otherParticipant,
  onBackToChats,
  onViewProfile,
  isMobile = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Mock status data - in a real app these would come from props or context
  const [isOnline] = useState(Math.random() > 0.5); // Random online status for demo
  const [isTyping] = useState(false); // Could be updated via websocket
  const [lastSeen] = useState(new Date(Date.now() - Math.random() * 86400000).toISOString()); // Random last seen within 24h

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!otherParticipant) return null;

  // Generate consistent display name
  const displayName = otherParticipant.users?.full_name || 
    generateConsistentNickname(otherParticipant.user_id);
  
  const finalDisplayName = displayName;

  // Format last seen time
  const formatLastSeen = (lastSeenTime?: string) => {
    if (!lastSeenTime) return 'Last seen a while ago';
    
    const date = new Date(lastSeenTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
    return `Active ${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusText = () => {
    if (isTyping) return 'Typing...';
    if (isOnline) return 'Online';
    return formatLastSeen(lastSeen);
  };

  const getStatusColor = () => {
    if (isTyping) return 'text-blue-500';
    if (isOnline) return 'text-green-500';
    return 'text-gray-500';
  };

  return (
    <>
      {/* Mobile safe area for notched devices */}
      {isMobile && <div className="h-safe-top bg-white" />}
      
      <div className={`sticky top-0 z-40 transition-all duration-200 ${
        isMobile ? 'top-safe' : 'top-16'
      } ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/60' 
          : 'bg-white border-b border-gray-100'
      }`}>
        
        {/* Main header content */}
        <div className={`flex items-center justify-between transition-all duration-200 ${
          isMobile ? 'px-4 py-3' : 'px-6 py-4'
        }`}>
          
          {/* Left section - Back button + User info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isMobile && (
              <button
                onClick={onBackToChats}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                aria-label="Back to chats"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* User avatar and info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={otherParticipant.users?.avatar_url || '/default-avatar.png'}
                  alt={finalDisplayName}
                  className={`object-cover ring-2 ring-white shadow-sm transition-all duration-200 ${
                    isMobile ? 'w-10 h-10' : 'w-12 h-12'
                  } rounded-full ${isOnline ? 'ring-green-200' : 'ring-gray-200'}`}
                  loading="lazy"
                />
                {/* Online status indicator */}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className={`font-semibold text-gray-900 truncate ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>
                    {finalDisplayName}
                  </h1>
                  {/* Verified checkmark - removed as checkmark property doesn't exist in type */}
                </div>
                
                {/* Status text with typing indicator */}
                <div className="flex items-center gap-1">
                  {isTyping && (
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  <p className={`text-xs font-medium truncate ${getStatusColor()} ${
                    isTyping ? 'animate-pulse' : ''
                  }`}>
                    
                  </p>
                  {/* Username */}
                  {otherParticipant.users?.username && (
                    <>
                      <span className="text-xs text-gray-500 truncate">
                        @{otherParticipant.users.username}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right section - Action buttons */}
          <div className="flex items-center gap-2">
            {/* Call functionality removed as it's not supported */}
            
            {/* Profile/Options button */}
            {isMobile ? (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
                  aria-label="More options"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {/* Mobile options dropdown */}
                {showOptions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowOptions(false)}
                    />
                    <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                      {onViewProfile && otherParticipant.users?.username && (
                        <button
                          onClick={() => {
                            onViewProfile(otherParticipant.users!.username);
                            setShowOptions(false);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Profile
                        </button>
                      )}
                      {/* Call options removed as calling is not supported */}
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Desktop profile button
              otherParticipant.users?.username && onViewProfile && (
                <button
                  onClick={() => onViewProfile(otherParticipant.users!.username)}
                  className="px-4 py-2 text-blue-600 border border-blue-200 hover:border-blue-300 rounded-xl hover:bg-blue-50 transition-all duration-200 text-sm font-medium active:scale-95"
                >
                  View Profile
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;