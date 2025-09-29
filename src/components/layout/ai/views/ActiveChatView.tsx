import React, { useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { Header } from '../Header';
import { WelcomeMessage } from '../WelcomeMessage';
import { MessageList } from '../MessageList';
import { InputArea } from '../InputArea';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ActiveChatViewProps {
  sessionId: string;
  onBack: () => void;
  onNewChat: () => void;
  className?: string;
}

export const ActiveChatView: React.FC<ActiveChatViewProps> = ({
  sessionId,
  onBack,
  onNewChat,
  className = ''
}) => {
  const [showChatMenu, setShowChatMenu] = useState(false);
  
  const {
    messages,
    inputMessage,
    isLoading,
    sendMessage,
    updateInputMessage,
    messageStore,
  } = useChat(sessionId);

  const currentSession = messageStore.activeSession;

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleShare = () => {
    if (navigator.share && currentSession) {
      navigator.share({
        title: `Chat with Nia: ${currentSession.title}`,
        text: `Check out my conversation with Nia on Stride Campus!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const chatText = messages.map(msg => 
        `${msg.isUser ? 'You' : 'Nia'}: ${msg.content}`
      ).join('\n\n');
      
      navigator.clipboard.writeText(chatText).then(() => {
        alert('Chat copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy chat');
      });
    }
  };

  const getChatStats = () => {
    if (!currentSession) return null;
    
    const userMessages = messages.filter(msg => msg.isUser).length;
    const niaMessages = messages.filter(msg => !msg.isUser).length;
    const totalWords = messages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0);
    
    return {
      userMessages,
      niaMessages,
      totalWords,
      duration: messages.length > 0 ? 
        Math.round((messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime()) / (1000 * 60)) 
        : 0
    };
  };

  const stats = getChatStats();

  return (
    <div className={`flex flex-col h-full bg-white ${className} overflow-hidden`}>
      {/* Header - Sticky at top */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
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
                {currentSession?.title || 'Chat with Nia'}
              </h1>
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
                  <button
                    onClick={() => {
                      onNewChat();
                      setShowChatMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable middle section */}
      <div className="flex-1 overflow-hidden pb-20 mb-28 md:pb-32">
        {messages.length === 0 && !isLoading ? (
          <WelcomeMessage />
        ) : (
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
          />
        )}
      </div>

      {/* Input Area - Fixed above mobile footer */}
      <div className="fixed bottom-16 left-0 right-0 md:sticky md:bottom-0 z-20">
        <InputArea
          value={inputMessage}
          onChange={updateInputMessage}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Click outside to close menu */}
      {showChatMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowChatMenu(false)}
        />
      )}
    </div>
  );
};
