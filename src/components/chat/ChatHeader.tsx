import React, { memo, useState } from 'react';
import { ChatHeaderProps } from '@/types/chat';
import { Button } from '@/components/ui/button';
import OnlineStatus from './OnlineStatus';
import { 
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

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
  onlineUsers = [],
}) => {
  const [showChatMenu, setShowChatMenu] = useState(false);

  if (!otherParticipant) return null;

  // Generate consistent display name
  const displayName = otherParticipant.users?.full_name || 
    generateConsistentNickname(otherParticipant.user_id);

  // Check if user is online
  const isUserOnline = onlineUsers.some(user => user.userId === otherParticipant.user_id);
  const onlineUser = onlineUsers.find(user => user.userId === otherParticipant.user_id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Chat with ${displayName}`,
        text: `Check out my conversation with ${displayName} on Stride Campus!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Chat with ${displayName}`).then(() => {
        alert('Chat info copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy chat info');
      });
    }
  };

  const handleNewChat = () => {
    // This would trigger starting a new chat
    // For now, we'll just close the menu
    setShowChatMenu(false);
  };

  return (
    <>
      {/* Mobile safe area for notched devices */}
      {isMobile && <div className="h-safe-top bg-white" />}
      
      {/* Header - Sticky at top */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBackToChats}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {displayName}
              </h1>
              <OnlineStatus 
                isOnline={isUserOnline}
                lastSeen={onlineUser?.lastSeen}
                username={otherParticipant.users?.username || ''}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              onClick={() => setShowChatMenu(!showChatMenu)}
              variant="ghost"
              size="sm"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </Button>
            
            {showChatMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleShare();
                      setShowChatMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ShareIcon className="w-4 h-4" />
                    Share Chat
                  </button>
                  {onViewProfile && otherParticipant.users?.username && (
                    <button
                      onClick={() => {
                        onViewProfile(otherParticipant.users!.username);
                        setShowChatMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                      View Profile
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showChatMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowChatMenu(false)}
        />
      )}
    </>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;