// ===========================
// ChatContainer.tsx - Main orchestrator
// ===========================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeSupabaseMessageStore } from '@/hooks/useRealtimeSupabaseMessageStore';
import { useApp } from '@/contexts/AppContext';
import { ChatListView } from './views/ChatListView';
import { ActiveChatView } from './views/ActiveChatView';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

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
  const { user: appUser } = useApp();
  const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  
  // SINGLE source of truth for message store
  const messageStore = useRealtimeSupabaseMessageStore(user?.id || '');
  
  // Local UI state only
  const [currentView, setCurrentView] = useState<ChatView>(initialView);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId || null);
  
  // Track if initial setup is complete to prevent loops
  const isInitialSetupComplete = useRef(false);
  const lastSessionId = useRef<string | null>(null);

  // Initialize once when component mounts or initial session changes
  useEffect(() => {
    if (isInitialSetupComplete.current) return;

    const initializeSession = async () => {
      if (initialSessionId && initialSessionId !== lastSessionId.current) {
        // User explicitly wants a specific session
        try {
          await messageStore.switchToSession(initialSessionId);
          setActiveSessionId(initialSessionId);
          setCurrentView('chat');
          lastSessionId.current = initialSessionId;
          isInitialSetupComplete.current = true;
        } catch (error) {
          console.error('Error initializing session:', error);
          setCurrentView('list');
          isInitialSetupComplete.current = true;
        }
      } else if (messageStore.isInitialized && messageStore.activeSession) {
        // Resume existing active session
        setActiveSessionId(messageStore.activeSession.id);
        setCurrentView('chat');
        lastSessionId.current = messageStore.activeSession.id;
        isInitialSetupComplete.current = true;
      } else if (messageStore.isInitialized) {
        // No active session, show list
        isInitialSetupComplete.current = true;
      }
    };

    initializeSession();
  }, [initialSessionId, messageStore.isInitialized, messageStore.activeSession?.id]);

  // Memoized handlers to prevent recreation
  const handleCreateNew = useCallback(async () => {
    try {
      const newSession = await messageStore.createSession();
      setActiveSessionId(newSession.id);
      setCurrentView('chat');
      lastSessionId.current = newSession.id;
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }, [messageStore]);

  const handleChatSelect = useCallback(async (sessionId: string) => {
    // Prevent unnecessary switches
    if (sessionId === lastSessionId.current && currentView === 'chat') {
      return;
    }

    try {
      await messageStore.switchToSession(sessionId);
      setActiveSessionId(sessionId);
      setCurrentView('chat');
      lastSessionId.current = sessionId;
    } catch (error) {
      console.error('Error switching to chat:', error);
    }
  }, [messageStore, currentView]);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
  }, []);

  const handleNewChatFromActive = useCallback(async () => {
    try {
      const newSession = await messageStore.createSession();
      setActiveSessionId(newSession.id);
      lastSessionId.current = newSession.id;
    } catch (error) {
      console.error('Error creating new chat from active:', error);
    }
  }, [messageStore]);

  // Show loading state while initializing
  if (!messageStore.isInitialized) {
    return (
      <div className={`flex items-center justify-center bg-white ${className} h-full`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white ${className} overflow-hidden h-full`}>
      {currentView === 'list' ? (
        <ChatListView
          messageStore={messageStore}
          onChatSelect={handleChatSelect}
          onCreateNew={handleCreateNew}
        />
      ) : activeSessionId ? (
        <ActiveChatView
          key={activeSessionId}
          sessionId={activeSessionId}
          messageStore={messageStore}
          onBack={handleBackToList}
          onNewChat={handleNewChatFromActive}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No chat selected</p>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Back to Chats
            </button>
          </div>
        </div>
      )}
    </div>
  );
};