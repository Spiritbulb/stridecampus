import { useState, useCallback, useEffect, useMemo } from 'react';
import { Message } from '@/components/layout/ai/types';
import { supabase } from '@/utils/supabaseClient';

// Chat session interface matching Supabase schema
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

// Extended session with messages for local state
export interface ChatSessionWithMessages extends ChatSession {
  messages: Message[];
}

// Message store state
interface MessageStoreState {
  sessions: ChatSessionWithMessages[];
  activeSession: ChatSessionWithMessages | null;
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
 * Custom hook for managing AI chat messages with Supabase storage
 */
export const useSupabaseMessageStore = (userId?: string) => {
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

  // Initialize store from Supabase
  useEffect(() => {
    if (!userId) {
      setState(prev => ({ ...prev, isInitialized: true }));
      return;
    }

    const initializeStore = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // Load sessions and active session
        const [sessions, activeSession] = await Promise.all([
          getSessions(userId),
          getActiveSession(userId),
        ]);

        setState(prev => ({
          ...prev,
          sessions,
          activeSession,
          isLoading: false,
          isInitialized: true,
          stats: {
            totalSessions: sessions.length,
            totalMessages: sessions.reduce((sum, session) => sum + session.message_count, 0),
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

  // Get all sessions for a user
  const getSessions = useCallback(async (userId: string): Promise<ChatSessionWithMessages[]> => {
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Load messages for each session
      const sessionsWithMessages = await Promise.all(
        sessions.map(async (session) => {
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
        })
      );

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
      
      // Update local state
      setState(prev => {
        const updatedSessions = [sessionWithMessages, ...prev.sessions];
        
        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: sessionWithMessages,
          stats: {
            ...prev.stats,
            totalSessions: updatedSessions.length,
            totalMessages: updatedSessions.reduce((sum, session) => sum + session.message_count, 0),
            activeSessionId: newSession.id,
            hasActiveSession: true,
          },
        };
      });

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
      
      // Update local state
      setState(prev => {
        const targetSession = prev.sessions.find(session => session.id === sessionId);
        if (!targetSession) {
          return prev;
        }

        const updatedSessions = prev.sessions.map(session => ({
          ...session,
          is_active: session.id === sessionId,
        }));

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: { ...targetSession, is_active: true },
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
      const { error } = await supabase
        .from('ai_chat_messages')
        .update({ content })
        .eq('id', messageId);

      if (error) throw error;
      
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
          updated_at: new Date().toISOString(),
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

      const messageWithTimestamp: Message = {
        id: newMessage.id,
        content: newMessage.content,
        isUser: newMessage.is_user,
        timestamp: new Date(newMessage.created_at),
      };
      
      // Update local state
      setState(prev => {
        if (!prev.activeSession) {
          return prev;
        }

        const updatedMessages = [...prev.activeSession.messages, messageWithTimestamp];
        const updatedActiveSession = {
          ...prev.activeSession,
          messages: updatedMessages,
          message_count: updatedMessages.length,
          updated_at: new Date().toISOString(),
        };

        // Update session title based on first user message
        if (prev.activeSession.message_count === 0 && message.isUser && message.content.trim()) {
          updatedActiveSession.title = message.content.slice(0, 50) + 
            (message.content.length > 50 ? '...' : '');
          
          // Update title in database
          supabase
            .from('ai_chat_sessions')
            .update({ title: updatedActiveSession.title })
            .eq('id', prev.activeSession.id)
            .then(({ error }) => {
              if (error) console.error('Error updating session title:', error);
            });
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
            totalMessages: updatedSessions.reduce((sum, session) => sum + session.message_count, 0),
          },
        };
      });

      return newMessage.id;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [userId, state.activeSession]);

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
      
      // Update local state
      setState(prev => {
        const updatedSessions = prev.sessions.filter(session => session.id !== sessionId);
        const newActiveSession = updatedSessions.find(session => session.is_active) || null;

        return {
          ...prev,
          sessions: updatedSessions,
          activeSession: newActiveSession,
          stats: {
            totalSessions: updatedSessions.length,
            totalMessages: updatedSessions.reduce((sum, session) => sum + session.message_count, 0),
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
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      
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
