// ===========================
// ActiveChatView.tsx - Modularized and optimized chat view
// ===========================
import React, { useState, useMemo, useCallback } from 'react';
import { InputArea } from '../InputArea';
import { useChat } from '../hooks/useChat';
import { 
  ChatHeader, 
  ChatMenu, 
  MessageArea,
  type Message,
  type MessageStore,
  type ChatHook
} from '../components';

interface ActiveChatViewProps {
  sessionId: string;
  messageStore: MessageStore;
  onBack: () => void;
  onNewChat: () => void;
  className?: string;
}

export const ActiveChatView: React.FC<ActiveChatViewProps> = ({
  sessionId,
  messageStore,
  onBack,
  onNewChat,
  className = ''
}) => {
  const [showChatMenu, setShowChatMenu] = useState(false);
  
  // Use the real AI chat hook instead of manual state management
  const chat: ChatHook = useChat(sessionId);

  // Get current session and messages from store
  const currentSession = messageStore.activeSession;
  const messages: Message[] = useMemo(() => {
    if (!currentSession) return [];
    return currentSession.messages.map((msg) => ({
      ...msg,
      timestamp: msg.created_at ? new Date(msg.created_at) : new Date()
    }));
  }, [currentSession]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || chat.isLoading) return;
    
    // Use the real AI chat functionality
    await chat.sendMessage(content);
  }, [chat.sendMessage, chat.isLoading]);

  const handleShare = useCallback(() => {
    if (navigator.share && currentSession) {
      navigator.share({
        title: `Chat with Nia: ${currentSession.title}`,
        text: `Check out my conversation with Nia!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      const chatText = messages.map((msg) => 
        `${msg.isUser ? 'You' : 'Nia'}: ${msg.content}`
      ).join('\n\n');
      
      navigator.clipboard.writeText(chatText).then(() => {
        alert('Chat copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy chat');
      });
    }
  }, [currentSession, messages]);

  const handleMenuToggle = useCallback(() => {
    setShowChatMenu(prev => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setShowChatMenu(false);
  }, []);

  return (
    <div className={`flex flex-col h-[80vh] bg-white ${className} overflow-hidden`}>
      {/* Header */}
      <div className="relative">
        <ChatHeader
          title={currentSession?.title}
          onBack={onBack}
          onMenuToggle={handleMenuToggle}
          showMenu={showChatMenu}
        />
        
        <ChatMenu
          isOpen={showChatMenu}
          onShare={handleShare}
          onNewChat={onNewChat}
          onClose={handleMenuClose}
        />
      </div>

      {/* Messages */}
      <MessageArea
        messages={messages}
        isLoading={chat.isLoading}
        emptyStateTitle="Start a conversation"
        emptyStateSubtitle="Send a message to begin chatting with Nia"
      />

      {/* Input Area */}
      <InputArea
        value={chat.inputMessage}
        onChange={chat.updateInputMessage}
        onSend={handleSendMessage}
        isLoading={chat.isLoading}
      />
    </div>
  );
};