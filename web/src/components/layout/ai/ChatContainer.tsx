import React, { useState, useEffect } from 'react';
import { useSupabaseMessageStore } from '@/hooks/useSupabaseMessageStore';
import { useApp } from '@/contexts/AppContext';
import { ChatListView } from './views/ChatListView';
import { ActiveChatView } from './views/ActiveChatView';

type ChatView = 'list' | 'chat';

interface ChatContainerProps {
  onClose?: () => void;
  className?: string;
  initialView?: ChatView;
  initialSessionId?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  onClose,
  className = '',
  initialView = 'list',
  initialSessionId
}) => {
  const { user } = useApp();
  const messageStore = useSupabaseMessageStore(user?.id);
  const [currentView, setCurrentView] = useState<ChatView>(initialView);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId || null);

  // Initialize with active session if available
  useEffect(() => {
    if (initialSessionId) {
      setActiveSessionId(initialSessionId);
      setCurrentView('chat');
    } else if (messageStore.activeSession && messageStore.isInitialized) {
      setActiveSessionId(messageStore.activeSession.id);
      setCurrentView('chat');
    }
  }, [initialSessionId, messageStore.activeSession, messageStore.isInitialized]);

  // Handle creating a new chat
  const handleCreateNew = async () => {
    console.log('Creating new chat...');
    try {
      const newSession = await messageStore.createSession();
      console.log('New session created:', newSession.id);
      setActiveSessionId(newSession.id);
      setCurrentView('chat');
      console.log('Switched to chat view with session:', newSession.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // Handle selecting an existing chat
  const handleChatSelect = async (sessionId: string) => {
    try {
      await messageStore.switchToSession(sessionId);
      setActiveSessionId(sessionId);
      setCurrentView('chat');
    } catch (error) {
      console.error('Error switching to chat:', error);
    }
  };

  // Handle going back to chat list
  const handleBackToList = () => {
    setCurrentView('list');
    setActiveSessionId(null);
  };

  // Handle starting a new chat from within active chat
  const handleNewChatFromActive = async () => {
    console.log('Creating new chat from active chat...');
    try {
      const newSession = await messageStore.createSession();
      console.log('New session created from active:', newSession.id);
      setActiveSessionId(newSession.id);
      console.log('Switched to new session:', newSession.id);
      // Stay in chat view, just switch to new session
    } catch (error) {
      console.error('Error creating new chat from active:', error);
    }
  };

  // Handle close
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`flex flex-col bg-white ${className} overflow-hidden h-full`}>
      {currentView === 'list' ? (
        <ChatListView
          onChatSelect={handleChatSelect}
          onCreateNew={handleCreateNew}
          userId={user?.id}
        />
      ) : (
        <ActiveChatView
          key={activeSessionId} // Force re-render when session changes
          sessionId={activeSessionId!}
          onBack={handleBackToList}
          onNewChat={handleNewChatFromActive}
        />
      )}
    </div>
  );
};
