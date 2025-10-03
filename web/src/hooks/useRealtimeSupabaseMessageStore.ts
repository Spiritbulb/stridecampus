'use client';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Message } from '@/components/layout/ai/types';
import { supabase } from '@/utils/supabaseClient';
import { useRealtimeAIChats } from './useRealtimeAIChats';
import { ChatSession, ChatSessionWithMessages } from './useSupabaseMessageStore';

// Re-export types for components
export type { ChatSession, ChatSessionWithMessages };

// Message store state with realtime capabilities
interface RealtimeMessageStoreState {
  sessions: ChatSessionWithMessages[];
  activeSession: ChatSessionWithMessages | null;
  isLoading: boolean;
  isInitialized: boolean;
  isRealtimeConnected: boolean;
  stats: {
    totalSessions: number;
    totalMessages: number;
    activeSessionId: string | null;
    hasActiveSession: boolean;
  };
}

// Cache configuration
const CACHE_CONFIG = {
  SESSION_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MESSAGE_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
  MAX_CACHE_SIZE: 50, // Maximum number of sessions to cache
  PAGINATION_SIZE: 20, // Messages per page
};

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface SessionCache {
  [sessionId: string]: CacheEntry<ChatSessionWithMessages>;
}

// Global cache for sessions
const sessionCache: SessionCache = {};
const cacheTimestamps: { [key: string]: number } = {};

// Cache utility functions
const isCacheValid = (key: string, ttl: number): boolean => {
  const timestamp = cacheTimestamps[key];
  return !!timestamp && (Date.now() - timestamp) < ttl;
};

const setCache = <T>(key: string, data: T, ttl: number): void => {
  sessionCache[key] = { data: data as any, timestamp: Date.now(), ttl };
  cacheTimestamps[key] = Date.now();
};

const getCache = <T>(key: string): T | null => {
  const entry = sessionCache[key];
  if (!entry || !isCacheValid(key, entry.ttl)) {
    delete sessionCache[key];
    delete cacheTimestamps[key];
    return null;
  }
  return entry.data as T;
};

const clearExpiredCache = (): void => {
  const now = Date.now();
  Object.keys(sessionCache).forEach(key => {
    const entry = sessionCache[key];
    if (!entry || (now - entry.timestamp) >= entry.ttl) {
      delete sessionCache[key];
      delete cacheTimestamps[key];
    }
  });
};

/**
 * Enhanced message store with realtime capabilities
 */
export const useRealtimeSupabaseMessageStore = (userId?: string) => {
  const [state, setState] = useState<RealtimeMessageStoreState>({
    sessions: [],
    activeSession: null,
    isLoading: false,
    isInitialized: false,
    isRealtimeConnected: false,
    stats: {
      totalSessions: 0,
      totalMessages: 0,
      activeSessionId: null,
      hasActiveSession: false,
    },
  });

  // Refs for performance optimization
  const lastFetchTime = useRef<number>(0);
  const fetchThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update stats helper
  const updateStats = useCallback((sessions: ChatSessionWithMessages[]) => {
    const activeSession = sessions.find(s => s.is_active) || null;
    return {
      totalSessions: sessions.length,
      totalMessages: sessions.reduce((sum, session) => sum + session.message_count, 0),
      activeSessionId: activeSession?.id || null,
      hasActiveSession: !!activeSession,
    };
  }, []);

  // Set up realtime subscriptions
  const { isConnected: isRealtimeConnected } = useRealtimeAIChats({
    onSessionCreated: useCallback((session: ChatSession) => {
      console.log('🔄 Realtime: Session created', session);
      setState(prev => {
        const sessionWithMessages: ChatSessionWithMessages = {
          ...session,
          messages: []
        };
        
        // Add to beginning of sessions list
        const updatedSessions = [sessionWithMessages, ...prev.sessions];
        
        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: session.is_active ? sessionWithMessages : prev.activeSession,
          stats: updateStats(updatedSessions),
        };
      });
    }, [updateStats]),

    onSessionUpdated: useCallback((session: ChatSession) => {
      console.log('🔄 Realtime: Session updated', session);
      setState(prev => {
        const updatedSessions = prev.sessions.map(s => 
          s.id === session.id 
            ? { ...s, ...session }
            : { ...s, is_active: session.is_active ? false : s.is_active } // Deactivate others if this one is active
        );
        
        const newActiveSession = updatedSessions.find(s => s.is_active) || null;
        
        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newActiveSession,
          stats: updateStats(updatedSessions),
        };
      });
    }, [updateStats]),

    onSessionDeleted: useCallback((sessionId: string) => {
      console.log('🔄 Realtime: Session deleted', sessionId);
      setState(prev => {
        const updatedSessions = prev.sessions.filter(s => s.id !== sessionId);
        const newActiveSession = updatedSessions.find(s => s.is_active) || null;
        
        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newActiveSession,
          stats: updateStats(updatedSessions),
        };
      });
    }, [updateStats]),

    onMessageCreated: useCallback((message: any) => {
      console.log('🔄 Realtime: Message created', message);
      setState(prev => {
        const messageWithTimestamp: Message = {
          id: message.id,
          content: message.content,
          isUser: message.is_user,
          timestamp: new Date(message.created_at),
        };

        const updatedSessions = prev.sessions.map(session => {
          if (session.id === message.session_id) {
            const updatedMessages = [...session.messages, messageWithTimestamp];
            return {
              ...session,
              messages: updatedMessages,
              message_count: updatedMessages.length,
              updated_at: message.created_at,
            };
          }
          return session;
        });

        const newActiveSession = updatedSessions.find(s => s.is_active) || null;

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newActiveSession,
          stats: updateStats(updatedSessions),
        };
      });
    }, [updateStats]),

    onMessageUpdated: useCallback((message: any) => {
      console.log('🔄 Realtime: Message updated', message);
      setState(prev => {
        const updatedSessions = prev.sessions.map(session => {
          if (session.id === message.session_id) {
            const updatedMessages = session.messages.map(msg =>
              msg.id === message.id 
                ? {
                    ...msg,
                    content: message.content,
                    timestamp: new Date(message.created_at),
                  }
                : msg
            );
            return {
              ...session,
              messages: updatedMessages,
              updated_at: message.created_at,
            };
          }
          return session;
        });

        const newActiveSession = updatedSessions.find(s => s.is_active) || null;

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newActiveSession,
        };
      });
    }, []),

    onMessageDeleted: useCallback((messageId: string) => {
      console.log('🔄 Realtime: Message deleted', messageId);
      setState(prev => {
        const updatedSessions = prev.sessions.map(session => {
          const updatedMessages = session.messages.filter(msg => msg.id !== messageId);
          if (updatedMessages.length !== session.messages.length) {
            return {
              ...session,
              messages: updatedMessages,
              message_count: updatedMessages.length,
            };
          }
          return session;
        });

        const newActiveSession = updatedSessions.find(s => s.is_active) || null;

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newActiveSession,
          stats: updateStats(updatedSessions),
        };
      });
    }, [updateStats]),
  });

  // Update realtime connection status
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isRealtimeConnected
    }));
  }, [isRealtimeConnected]);

  // Cleanup expired cache periodically
  useEffect(() => {
    const interval = setInterval(clearExpiredCache, CACHE_CONFIG.SESSION_CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  // Initialize store from Supabase with caching
  useEffect(() => {
    if (!userId) {
      setState(prev => ({ ...prev, isInitialized: true }));
      return;
    }

    const initializeStore = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // Check cache first
        const cacheKey = `sessions_${userId}`;
        const cachedSessions = getCache<ChatSessionWithMessages[]>(cacheKey);
        
        let sessions: ChatSessionWithMessages[];
        let activeSession: ChatSessionWithMessages | null;

        if (cachedSessions) {
          // Use cached data
          sessions = cachedSessions;
          activeSession = sessions.find(s => s.is_active) || null;
        } else {
          // Fetch from database
          const [fetchedSessions, fetchedActiveSession] = await Promise.all([
            getSessions(userId),
            getActiveSession(userId),
          ]);
          
          sessions = fetchedSessions;
          activeSession = fetchedActiveSession;
          
          // Cache the results
          setCache(cacheKey, sessions, CACHE_CONFIG.SESSION_CACHE_TTL);
        }

        setState(prev => ({
          ...prev,
          sessions,
          activeSession,
          isLoading: false,
          isInitialized: true,
          stats: updateStats(sessions),
        }));

        lastFetchTime.current = Date.now();
      } catch (error) {
        console.error('Error initializing message store:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isInitialized: true 
        }));
      }
    };

    // Throttle initialization to prevent rapid re-fetches
    if (fetchThrottle.current) {
      clearTimeout(fetchThrottle.current);
    }

    fetchThrottle.current = setTimeout(() => {
      const timeSinceLastFetch = Date.now() - lastFetchTime.current;
      if (timeSinceLastFetch > 1000) { // Minimum 1 second between fetches
        initializeStore();
      }
    }, 100);

    return () => {
      if (fetchThrottle.current) {
        clearTimeout(fetchThrottle.current);
      }
    };
  }, [userId, updateStats]);

  // Get all sessions for a user with optimized queries
  const getSessions = useCallback(async (userId: string): Promise<ChatSessionWithMessages[]> => {
    try {
      // First, get sessions with basic info only
      const { data: sessions, error: sessionsError } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(CACHE_CONFIG.MAX_CACHE_SIZE); // Limit to prevent memory issues

      if (sessionsError) throw sessionsError;

      if (sessions.length === 0) return [];

      // Get all messages for all sessions in a single query
      const sessionIds = sessions.map(s => s.id);
      const { data: allMessages, error: messagesError } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Group messages by session ID for efficient processing
      const messagesBySession = allMessages.reduce((acc, msg) => {
        if (!acc[msg.session_id]) {
          acc[msg.session_id] = [];
        }
        acc[msg.session_id].push({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
        });
        return acc;
      }, {} as Record<string, Message[]>);

      // Combine sessions with their messages
      const sessionsWithMessages = sessions.map(session => ({
        ...session,
        messages: messagesBySession[session.id] || [],
      }));

      return sessionsWithMessages;
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }, []);

  // Get active session for a user
  const getActiveSession = useCallback(async (userId: string): Promise<ChatSessionWithMessages | null> => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          // No active session found
          return null;
        }
        throw sessionError;
      }

      // Load messages for the session
      const { data: messages, error: messagesError } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return {
        ...session,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
        })),
      };
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }, []);

  // Create a new chat session
  const createSession = useCallback(async (title?: string): Promise<ChatSessionWithMessages> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const { data: newSession, error } = await supabase
        .from('ai_chat_sessions')
        .insert([
          {
            user_id: userId,
            title: title || `Chat ${new Date().toLocaleDateString()}`,
            is_active: true,
            message_count: 0,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const sessionWithMessages: ChatSessionWithMessages = {
        ...newSession,
        messages: [],
      };
      
      // Note: Realtime will handle updating the local state
      return sessionWithMessages;
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
      // Update database to set this session as active
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({ is_active: true })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Note: Realtime will handle updating the local state
    } catch (error) {
      console.error('Error switching session:', error);
      throw error;
    }
  }, [userId]);

  // Add message to active session
  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>): Promise<string | null> => {
    if (!userId || !state.activeSession) {
      return null;
    }

    try {
      const { data: newMessage, error } = await supabase
        .from('ai_chat_messages')
        .insert([
          {
            session_id: state.activeSession.id,
            content: message.content,
            is_user: message.isUser,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update session title based on first user message
      if (state.activeSession.message_count === 0 && message.isUser && message.content.trim()) {
        const newTitle = message.content.slice(0, 50) + 
          (message.content.length > 50 ? '...' : '');
        
        // Update title in database
        await supabase
          .from('ai_chat_sessions')
          .update({ title: newTitle })
          .eq('id', state.activeSession.id);
      }

      // Note: Realtime will handle updating the local state
      return newMessage.id;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [userId, state.activeSession]);

  // Update message content (for streaming)
  const updateMessage = useCallback(async (messageId: string, content: string): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_chat_messages')
        .update({ content })
        .eq('id', messageId);

      if (error) throw error;
      
      // Note: Realtime will handle updating the local state
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }, [userId]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Note: Realtime will handle updating the local state
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
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      
      // Note: Realtime will handle updating the local state
    } catch (error) {
      console.error('Error clearing sessions:', error);
      throw error;
    }
  }, [userId]);

  // Get session by ID
  const getSessionById = useCallback(async (sessionId: string): Promise<ChatSessionWithMessages | null> => {
    if (!userId) {
      return null;
    }

    try {
      const { data: session, error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          return null;
        }
        throw sessionError;
      }

      // Load messages for the session
      const { data: messages, error: messagesError } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return {
        ...session,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
        })),
      };
    } catch (error) {
      console.error('Error getting session by ID:', error);
      return null;
    }
  }, [userId]);

  return {
    // State
    sessions: state.sessions,
    activeSession: state.activeSession,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    isRealtimeConnected: state.isRealtimeConnected,
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
    getSessions,
    getActiveSession,
  };
};
