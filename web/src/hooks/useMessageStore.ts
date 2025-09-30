import { useState, useCallback, useEffect, useMemo } from 'react';
import { Message } from '@/components/layout/ai/types';

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
  sessions: Map<string, ChatSession>;
  activeSessionId: string | null;
  isLoading: boolean;
  lastSyncTime: Date | null;
  isInitialized: boolean;
}

// Cache configuration
const CACHE_CONFIG = {
  MAX_SESSIONS: 50, // Maximum number of chat sessions to keep
  MAX_MESSAGES_PER_SESSION: 1000, // Maximum messages per session
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// Local storage keys
const STORAGE_KEYS = {
  SESSIONS: 'nia_chat_sessions',
  ACTIVE_SESSION: 'nia_active_session',
  LAST_SYNC: 'nia_last_sync',
  USER_ID: 'nia_user_id',
};

// Data validation and migration function
const validateAndMigrateSession = (sessionData: any): ChatSession => {
  // Ensure required fields exist
  if (!sessionData.id || !sessionData.title) {
    throw new Error('Missing required session fields');
  }

  // Migrate old data structure if needed
  const migratedData = {
    id: sessionData.id,
    title: sessionData.title || 'Untitled Chat',
    messages: Array.isArray(sessionData.messages) ? sessionData.messages : [],
    createdAt: sessionData.createdAt ? new Date(sessionData.createdAt) : new Date(),
    updatedAt: sessionData.updatedAt ? new Date(sessionData.updatedAt) : new Date(),
    isActive: Boolean(sessionData.isActive),
    messageCount: Number(sessionData.messageCount) || sessionData.messages?.length || 0,
  };

  // Validate and migrate messages
  migratedData.messages = migratedData.messages.map((msg: any) => {
    if (!msg.id || !msg.content || typeof msg.isUser !== 'boolean') {
      throw new Error('Invalid message format');
    }
    
    return {
      id: msg.id,
      content: String(msg.content),
      isUser: Boolean(msg.isUser),
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    };
  });

  // Validate dates
  if (isNaN(migratedData.createdAt.getTime()) || isNaN(migratedData.updatedAt.getTime())) {
    throw new Error('Invalid date format');
  }

  return migratedData as ChatSession;
};

/**
 * Custom hook for managing chat messages with local storage and caching
 */
export const useMessageStore = (userId?: string) => {
  const [state, setState] = useState<MessageStoreState>({
    sessions: new Map(),
    activeSessionId: null,
    isLoading: false,
    lastSyncTime: null,
    isInitialized: false,
  });

  // Initialize store from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeStore = () => {
      try {
        const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        const storedActiveSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        const storedLastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

        // Check if user changed
        if (userId && storedUserId !== userId) {
          // Clear old user's data
          localStorage.removeItem(STORAGE_KEYS.SESSIONS);
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
          localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
          localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
          setState(prev => ({ ...prev, isInitialized: true }));
          return;
        }

        if (storedSessions) {
          const sessionsData = JSON.parse(storedSessions);
          const sessionsMap = new Map<string, ChatSession>();

          // Convert stored data back to proper format with validation
          Object.entries(sessionsData).forEach(([id, sessionData]: [string, any]) => {
            try {
              // Validate and migrate session data
              const validatedSession = validateAndMigrateSession(sessionData);
              sessionsMap.set(id, validatedSession);
            } catch (error) {
              console.warn(`Skipping invalid session ${id}:`, error);
            }
          });

          setState(prev => ({
            ...prev,
            sessions: sessionsMap,
            activeSessionId: storedActiveSession || null,
            lastSyncTime: storedLastSync ? new Date(storedLastSync) : null,
            isInitialized: true,
          }));
        } else {
          // No stored sessions, just mark as initialized
          setState(prev => ({ ...prev, isInitialized: true }));
        }
      } catch (error) {
        console.error('Error initializing message store:', error);
        // Mark as initialized even if there's an error to prevent infinite loading
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeStore();
  }, [userId]);

  // Save to localStorage whenever sessions change (with debouncing)
  useEffect(() => {
    if (typeof window === 'undefined' || !state.isInitialized) return;

    const saveTimeout = setTimeout(() => {
      try {
        // Only save if we have sessions to prevent clearing data
        if (state.sessions.size > 0) {
          const sessionsObj = Object.fromEntries(state.sessions);
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessionsObj));
        }
        
        if (state.activeSessionId) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, state.activeSessionId);
        }
        
        if (state.lastSyncTime) {
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, state.lastSyncTime.toISOString());
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        // Try to recover by clearing potentially corrupted data
        try {
          localStorage.removeItem(STORAGE_KEYS.SESSIONS);
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
          localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
        } catch (clearError) {
          console.error('Error clearing corrupted localStorage:', clearError);
        }
      }
    }, 100); // Debounce saves by 100ms

    return () => clearTimeout(saveTimeout);
  }, [state.sessions, state.activeSessionId, state.lastSyncTime, state.isInitialized]);

  // Create a new chat session
  const createSession = useCallback((title?: string): ChatSession => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      id: sessionId,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      messageCount: 0,
    };

    console.log('Creating new session:', sessionId, 'Previous active:', state.activeSessionId);

    setState(prev => {
      const newSessions = new Map(prev.sessions);
      
      // Deactivate current active session
      if (prev.activeSessionId) {
        const currentSession = newSessions.get(prev.activeSessionId);
        if (currentSession) {
          console.log('Deactivating previous session:', prev.activeSessionId);
          newSessions.set(prev.activeSessionId, { ...currentSession, isActive: false });
        }
      }
      
      newSessions.set(sessionId, newSession);
      
      // Clean up old sessions if we exceed the limit
      if (newSessions.size > CACHE_CONFIG.MAX_SESSIONS) {
        const sortedSessions = Array.from(newSessions.entries())
          .sort(([,a], [,b]) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        // Remove oldest sessions
        const sessionsToKeep = sortedSessions.slice(0, CACHE_CONFIG.MAX_SESSIONS);
        const cleanedSessions = new Map(sessionsToKeep);
        newSessions.clear();
        sessionsToKeep.forEach(([id, session]) => newSessions.set(id, session));
      }
      
      console.log('New session state:', { activeSessionId: sessionId, totalSessions: newSessions.size });
      
      return {
        ...prev,
        sessions: newSessions,
        activeSessionId: sessionId,
      };
    });

    return newSession;
  }, [state.activeSessionId]);

  // Switch to an existing session
  const switchToSession = useCallback((sessionId: string) => {
    setState(prev => {
      const newSessions = new Map(prev.sessions);
      
      // Deactivate current active session
      if (prev.activeSessionId) {
        const currentSession = newSessions.get(prev.activeSessionId);
        if (currentSession) {
          newSessions.set(prev.activeSessionId, { ...currentSession, isActive: false });
        }
      }
      
      // Activate target session
      const targetSession = newSessions.get(sessionId);
      if (targetSession) {
        newSessions.set(sessionId, { ...targetSession, isActive: true });
        return {
          ...prev,
          sessions: newSessions,
          activeSessionId: sessionId,
        };
      }
      
      return prev;
    });
  }, []);

  // Update message content (for streaming)
  const updateMessage = useCallback((messageId: string, content: string) => {
    // Validate inputs
    if (!messageId || typeof content !== 'string') {
      console.warn('Invalid updateMessage parameters:', { messageId, content });
      return;
    }

    console.log('Updating message:', messageId, 'with content:', content);

    setState(prev => {
      if (!prev.activeSessionId) return prev;

      const newSessions = new Map(prev.sessions);
      const activeSession = newSessions.get(prev.activeSessionId);
      
      if (!activeSession) return prev;

      const updatedMessages = activeSession.messages.map(msg => 
        msg.id === messageId ? { ...msg, content } : msg
      );

      const updatedSession: ChatSession = {
        ...activeSession,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      newSessions.set(prev.activeSessionId, updatedSession);
      
      return {
        ...prev,
        sessions: newSessions,
      };
    });
  }, []);

  // Add message to active session
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string | null => {
    // Validate message before adding
    if (typeof message.content !== 'string' || typeof message.isUser !== 'boolean') {
      console.error('Invalid message format:', message);
      return null;
    }

    const newMessage: Message = {
      ...message,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setState(prev => {
      if (!prev.activeSessionId) {
        console.warn('No active session to add message to');
        return prev;
      }

      const newSessions = new Map(prev.sessions);
      const activeSession = newSessions.get(prev.activeSessionId);
      
      if (!activeSession) {
        console.warn('Active session not found:', prev.activeSessionId);
        return prev;
      }

      try {
        const updatedMessages = [...activeSession.messages, newMessage];
        
        // Limit messages per session
        const limitedMessages = updatedMessages.length > CACHE_CONFIG.MAX_MESSAGES_PER_SESSION
          ? updatedMessages.slice(-CACHE_CONFIG.MAX_MESSAGES_PER_SESSION)
          : updatedMessages;
        
        // Update session title based on first user message
        let updatedTitle = activeSession.title;
        if (activeSession.messageCount === 0 && message.isUser && message.content.trim()) {
          updatedTitle = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
        }
        
        const updatedSession: ChatSession = {
          ...activeSession,
          messages: limitedMessages,
          updatedAt: new Date(),
          title: updatedTitle,
          messageCount: limitedMessages.length,
        };
        
        newSessions.set(prev.activeSessionId, updatedSession);
        
        return {
          ...prev,
          sessions: newSessions,
        };
      } catch (error) {
        console.error('Error adding message:', error);
        return prev;
      }
    });

    return newMessage.id;
  }, []);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => {
      const newSessions = new Map(prev.sessions);
      newSessions.delete(sessionId);
      
      let newActiveSessionId = prev.activeSessionId;
      
      // If we deleted the active session, switch to another one
      if (prev.activeSessionId === sessionId) {
        const remainingSessions = Array.from(newSessions.values())
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        newActiveSessionId = remainingSessions.length > 0 ? remainingSessions[0].id : null;
        
        // Activate the new session
        if (newActiveSessionId) {
          const newActiveSession = newSessions.get(newActiveSessionId);
          if (newActiveSession) {
            newSessions.set(newActiveSessionId, { ...newActiveSession, isActive: true });
          }
        }
      }
      
      return {
        ...prev,
        sessions: newSessions,
        activeSessionId: newActiveSessionId,
      };
    });
  }, []);

  // Clear all sessions
  const clearAllSessions = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessions: new Map(),
      activeSessionId: null,
    }));
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    }
  }, []);

  // Recovery mechanism for corrupted data
  const recoverFromCorruption = useCallback(() => {
    console.warn('Attempting to recover from data corruption...');
    
    // Clear all localStorage data
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    }
    
    // Reset state to initial values
    setState({
      sessions: new Map(),
      activeSessionId: null,
      isLoading: false,
      lastSyncTime: null,
      isInitialized: true,
    });
  }, []);

  // Get active session
  const activeSession = useMemo(() => {
    if (!state.activeSessionId) return null;
    return state.sessions.get(state.activeSessionId) || null;
  }, [state.activeSessionId, state.sessions]);

  // Get sessions list (sorted by updated time)
  const sessionsList = useMemo(() => {
    return Array.from(state.sessions.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [state.sessions]);

  // Get session statistics
  const stats = useMemo(() => {
    const totalMessages = Array.from(state.sessions.values())
      .reduce((sum, session) => sum + session.messageCount, 0);
    
    return {
      totalSessions: state.sessions.size,
      totalMessages,
      activeSessionId: state.activeSessionId,
      hasActiveSession: !!activeSession,
    };
  }, [state.sessions, state.activeSessionId, activeSession]);

  return {
    // State
    sessions: sessionsList,
    activeSession,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    stats,
    
    // Actions
    createSession,
    switchToSession,
    addMessage,
    updateMessage,
    deleteSession,
    clearAllSessions,
    recoverFromCorruption,
    
    // Utilities
    getSessionById: useCallback((id: string) => state.sessions.get(id), [state.sessions]),
    exportSessions: useCallback(() => {
      return Array.from(state.sessions.entries()).map(([sessionId, session]) => {
        const { id, ...sessionWithoutId } = session;
        return {
          id: sessionId,
          ...sessionWithoutId,
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        };
      });
    }, [state.sessions]),
  };
};
