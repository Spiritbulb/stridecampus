import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { ChatManager } from './ChatManager';
import { Header } from './Header';
import { WelcomeMessage } from './WelcomeMessage';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { Button } from '@/components/ui/button';
import { 
  Bars3Icon, 
  XMarkIcon,
  ChatBubbleLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface EnhancedChatInterfaceProps {
  onClose?: () => void;
  className?: string;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  onClose,
  className = ''
}) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const {
    messages,
    inputMessage,
    isLoading,
    sendMessage,
    updateInputMessage,
    messageStore,
    currentSessionId,
  } = useChat();

  // Create a new chat session
  const handleCreateNew = async () => {
    const newSession = await messageStore.createSession();
    messageStore.switchToSession(newSession.id);
    setIsCreatingNew(false);
  };

  // Switch to an existing session
  const handleSessionSelect = (sessionId: string) => {
    messageStore.switchToSession(sessionId);
    setShowSidebar(false); // Close sidebar on mobile
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // If no active session, create one
    if (!currentSessionId) {
      const newSession = await messageStore.createSession();
      messageStore.switchToSession(newSession.id);
    }
    
    await sendMessage(content);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className={`flex h-full bg-white ${className}`}>
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200`}>
        <ChatManager
          onSessionSelect={handleSessionSelect}
          activeSessionId={currentSessionId || null}
          onCreateNew={handleCreateNew}
          className="h-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              className="md:hidden"
            >
              {showSidebar ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </Button>
            
            <div className="hidden md:flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900">
                {messageStore.activeSession?.title || 'Chat with Nia'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateNew}
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Chat
            </Button>
            
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1">
          {messages.length === 0 && !isLoading ? (
            <WelcomeMessage />
          ) : (
            <MessageList 
              messages={messages} 
              isLoading={isLoading} 
            />
          )}
        </div>

        {/* Input Area */}
        <InputArea
          value={inputMessage}
          onChange={updateInputMessage}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
};

// Export a simple version for backward compatibility
export const SimpleChatInterface: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    messages,
    inputMessage,
    isLoading,
    sendMessage,
    updateInputMessage,
  } = useChat();

  return (
    <div className="flex flex-col h-full bg-white">
      <Header onClose={onClose || (() => {})} />
      
      {messages.length === 0 && !isLoading ? (
        <WelcomeMessage />
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}
      
      <InputArea
        value={inputMessage}
        onChange={updateInputMessage}
        onSend={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};
