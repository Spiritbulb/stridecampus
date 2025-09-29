import { useState, useCallback, useEffect, useMemo } from 'react';
import { Message } from '@/components/layout/ai/types';
import * as jsonDB from '@/utils/jsonDatabase';

// Chat session interface
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  messageCount: number;
}

// Message store state
interface MessageStoreState {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  isLoading: boolean;
  isInitialized: boolean;
  stats: {
    totalSessions: number;
    totalMessages: number;
    activeSessionId: string | null;
    hasActiveSession: boolean;
  };
}

/**
 * Custom hook for managing chat messages with JSON file-based storage
 */
export const useJsonMessageStore = (userId?: string) => {
  const [state, setState] = useState<MessageStoreState>({
    sessions: [],
    activeSession: null,
    isLoading: false,
    isInitialized: false,
    stats: {
      totalSessions: 0,
      totalMessages: 0,
      activeSessionId: null,
      hasActiveSession: false,
    },
  });

  // Initialize store from JSON database
  useEffect(() => {
    if (!userId) {
      setState(prev => ({ ...prev, isInitialized: true }));
      return;
    }

    const initializeStore = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // Initialize database
        await jsonDB.initializeDatabase(userId);
        
        // Load sessions and active session
        const [sessions, activeSession] = await Promise.all([
          jsonDB.getSessions(userId),
          jsonDB.getActiveSession(userId),
        ]);

        setState(prev => ({
          ...prev,
          sessions,
          activeSession,
          isLoading: false,
          isInitialized: true,
          stats: {
            totalSessions: sessions.length,
            totalMessages: sessions.reduce((sum, session) => sum + session.messageCount, 0),
            activeSessionId: activeSession?.id || null,
            hasActiveSession: !!activeSession,
          },
        }));
      } catch (error) {
        console.error('Error initializing message store:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isInitialized: true 
        }));
      }
    };

    initializeStore();
  }, [userId]);

  // Create a new chat session
  const createSession = useCallback(async (title?: string): Promise<ChatSession> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const newSession = await jsonDB.createSession(userId, title);
      
      // Update local state
      setState(prev => {
        const updatedSessions = [newSession, ...prev.sessions];
        
        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newSession,
          stats: {
            ...prev.stats,
            totalSessions: updatedSessions.length,
            totalMessages: updatedSessions.reduce((sum, session) => sum + session.messageCount, 0),
            activeSessionId: newSession.id,
            hasActiveSession: true,
          },
        };
      });

      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, [userId]);

  // Switch to an existing session
  const switchToSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      await jsonDB.switchToSession(userId, sessionId);
      
      // Update local state
      setState(prev => {
        const targetSession = prev.sessions.find(session => session.id === sessionId);
        if (!targetSession) {
          return prev;
        }

        const updatedSessions = prev.sessions.map(session => ({
          ...session,
          isActive: session.id === sessionId,
        }));

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: { ...targetSession, isActive: true },
          stats: {
            ...prev.stats,
            activeSessionId: sessionId,
            hasActiveSession: true,
          },
        };
      });
    } catch (error) {
      console.error('Error switching session:', error);
      throw error;
    }
  }, [userId]);

  // Update message content (for streaming)
  const updateMessage = useCallback(async (messageId: string, content: string): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      await jsonDB.updateMessage(userId, messageId, content);
      
      // Update local state
      setState(prev => {
        if (!prev.activeSession) {
          return prev;
        }

        const updatedMessages = prev.activeSession.messages.map(msg =>
          msg.id === messageId ? { ...msg, content } : msg
        );

        const updatedActiveSession = {
          ...prev.activeSession,
          messages: updatedMessages,
          updatedAt: new Date(),
        };

        const updatedSessions = prev.sessions.map(session =>
          session.id === prev.activeSession!.id ? updatedActiveSession : session
        );

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: updatedActiveSession,
        };
      });
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }, [userId]);

  // Add message to active session
  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>): Promise<string | null> => {
    if (!userId) {
      return null;
    }

    try {
      const messageId = await jsonDB.addMessage(userId, message);
      
      // Update local state
      setState(prev => {
        if (!prev.activeSession) {
          return prev;
        }

        const newMessage: Message = {
          ...message,
          id: messageId,
          timestamp: new Date(),
        };

        const updatedMessages = [...prev.activeSession.messages, newMessage];
        const updatedActiveSession = {
          ...prev.activeSession,
          messages: updatedMessages,
          messageCount: updatedMessages.length,
          updatedAt: new Date(),
        };

        // Update session title based on first user message
        if (prev.activeSession.messageCount === 0 && message.isUser && message.content.trim()) {
          updatedActiveSession.title = message.content.slice(0, 50) + 
            (message.content.length > 50 ? '...' : '');
        }

        const updatedSessions = prev.sessions.map(session =>
          session.id === prev.activeSession!.id ? updatedActiveSession : session
        );

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: updatedActiveSession,
          stats: {
            ...prev.stats,
            totalMessages: updatedSessions.reduce((sum, session) => sum + session.messageCount, 0),
          },
        };
      });

      return messageId;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [userId]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      await jsonDB.deleteSession(userId, sessionId);
      
      // Update local state
      setState(prev => {
        const updatedSessions = prev.sessions.filter(session => session.id !== sessionId);
        const newActiveSession = updatedSessions.find(session => session.isActive) || null;

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newActiveSession,
          stats: {
            totalSessions: updatedSessions.length,
            totalMessages: updatedSessions.reduce((sum, session) => sum + session.messageCount, 0),
            activeSessionId: newActiveSession?.id || null,
            hasActiveSession: !!newActiveSession,
          },
        };
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }, [userId]);

  // Clear all sessions
  const clearAllSessions = useCallback(async (): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      await jsonDB.clearAllSessions(userId);
      
      setState(prev => ({
        ...prev,
        sessions: [],
        activeSession: null,
        stats: {
          totalSessions: 0,
          totalMessages: 0,
          activeSessionId: null,
          hasActiveSession: false,
        },
      }));
    } catch (error) {
      console.error('Error clearing sessions:', error);
      throw error;
    }
  }, [userId]);

  // Get session by ID
  const getSessionById = useCallback(async (sessionId: string): Promise<ChatSession | null> => {
    if (!userId) {
      return null;
    }

    try {
      return await jsonDB.getSessionById(userId, sessionId);
    } catch (error) {
      console.error('Error getting session by ID:', error);
      return null;
    }
  }, [userId]);

  // Force save database
  const forceSave = useCallback(async (): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      await jsonDB.forceSave(userId);
    } catch (error) {
      console.error('Error force saving:', error);
    }
  }, [userId]);

  // Get database statistics
  const getDatabaseStats = useCallback(async () => {
    if (!userId) {
      return null;
    }

    try {
      return await jsonDB.getDatabaseStats(userId);
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }, [userId]);

  return {
    // State
    sessions: state.sessions,
    activeSession: state.activeSession,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    stats: state.stats,
    
    // Actions
    createSession,
    switchToSession,
    addMessage,
    updateMessage,
    deleteSession,
    clearAllSessions,
    
    // Utilities
    getSessionById,
    forceSave,
    getDatabaseStats,
  };
};
