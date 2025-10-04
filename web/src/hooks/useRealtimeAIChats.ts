'use client';
import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useApp } from '@/contexts/AppContext';
import { ChatSession } from './useSupabaseMessageStore';
import { useSupabaseUser } from './useSupabaseUser';

interface AIMessage {
  id: string;
  session_id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

interface RealtimeAIChatOptions {
  sessionId?: string;
  onSessionCreated?: (session: ChatSession) => void;
  onSessionUpdated?: (session: ChatSession) => void;
  onSessionDeleted?: (sessionId: string) => void;
  onMessageCreated?: (message: AIMessage) => void;
  onMessageUpdated?: (message: AIMessage) => void;
  onMessageDeleted?: (messageId: string) => void;
  onActiveSessionChanged?: (sessionId: string | null) => void;
}

export function useRealtimeAIChats(options: RealtimeAIChatOptions = {}) {
  const { user: appUser } = useApp();
  const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const channelsRef = useRef<Map<string, any>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const {
    sessionId,
    onSessionCreated,
    onSessionUpdated,
    onSessionDeleted,
    onMessageCreated,
    onMessageUpdated,
    onMessageDeleted,
    onActiveSessionChanged
  } = options;

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up AI chat realtime subscriptions');
    channelsRef.current.forEach((channel, key) => {
      console.log(`Unsubscribing from AI chat channel: ${key}`);
      channel.unsubscribe();
    });
    channelsRef.current.clear();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user || !appUser) {
      cleanup();
      return;
    }

    console.log('🔌 Setting up AI chat realtime subscriptions for user:', user.id);
    setConnectionStatus('connecting');

    // 1. AI Chat Sessions subscription
    const sessionsChannelKey = `ai-chat-sessions-${user.id}`;
    const sessionsChannel = supabase
      .channel(sessionsChannelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_chat_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🤖 New AI chat session created:', payload.new);
          if (onSessionCreated) {
            onSessionCreated(payload.new as ChatSession);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_chat_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🤖 AI chat session updated:', payload.new);
          if (onSessionUpdated) {
            onSessionUpdated(payload.new as ChatSession);
          }
          
          // Check if active session changed
          const oldSession = payload.old as ChatSession;
          const newSession = payload.new as ChatSession;
          if (oldSession.is_active !== newSession.is_active && onActiveSessionChanged) {
            if (newSession.is_active) {
              onActiveSessionChanged(newSession.id);
            } else if (oldSession.is_active && !newSession.is_active) {
              // This session was deactivated, but we don't know which one is now active
              // The component should handle this by checking all sessions
              onActiveSessionChanged(null);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ai_chat_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🤖 AI chat session deleted:', payload.old);
          if (onSessionDeleted) {
            onSessionDeleted(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 AI chat sessions subscription status (${sessionsChannelKey}):`, status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ AI chat sessions realtime subscription failed. Check if realtime is enabled for ai_chat_sessions table.');
          setConnectionStatus('disconnected');
        }
      });

    channelsRef.current.set(sessionsChannelKey, sessionsChannel);

    // 2. AI Chat Messages subscription
    const messagesChannelKey = sessionId ? `ai-chat-messages-${sessionId}` : `ai-chat-messages-${user.id}`;
    const messagesChannel = supabase
      .channel(messagesChannelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_chat_messages',
          ...(sessionId 
            ? { filter: `session_id=eq.${sessionId}` }
            : {} // Subscribe to all messages for this user's sessions
          )
        },
        async (payload) => {
          console.log('🤖💬 New AI chat message created:', payload.new);
          
          // If we're not filtering by session, verify this message belongs to user's session
          if (!sessionId) {
            const message = payload.new as AIMessage;
            const { data: session } = await supabase
              .from('ai_chat_sessions')
              .select('user_id')
              .eq('id', message.session_id)
              .single();
            
            if (!session || session.user_id !== user.id) {
              return; // Not our message
            }
          }
          
          if (onMessageCreated) {
            onMessageCreated(payload.new as AIMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_chat_messages',
          ...(sessionId 
            ? { filter: `session_id=eq.${sessionId}` }
            : {}
          )
        },
        async (payload) => {
          console.log('🤖💬 AI chat message updated:', payload.new);
          
          // If we're not filtering by session, verify this message belongs to user's session
          if (!sessionId) {
            const message = payload.new as AIMessage;
            const { data: session } = await supabase
              .from('ai_chat_sessions')
              .select('user_id')
              .eq('id', message.session_id)
              .single();
            
            if (!session || session.user_id !== user.id) {
              return; // Not our message
            }
          }
          
          if (onMessageUpdated) {
            onMessageUpdated(payload.new as AIMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ai_chat_messages',
          ...(sessionId 
            ? { filter: `session_id=eq.${sessionId}` }
            : {}
          )
        },
        async (payload) => {
          console.log('🤖💬 AI chat message deleted:', payload.old);
          
          // If we're not filtering by session, verify this message belonged to user's session
          if (!sessionId) {
            const message = payload.old as AIMessage;
            const { data: session } = await supabase
              .from('ai_chat_sessions')
              .select('user_id')
              .eq('id', message.session_id)
              .single();
            
            if (!session || session.user_id !== user.id) {
              return; // Not our message
            }
          }
          
          if (onMessageDeleted) {
            onMessageDeleted(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 AI chat messages subscription status (${messagesChannelKey}):`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ AI chat messages realtime subscription failed. Check if realtime is enabled for ai_chat_messages table.');
        }
      });

    channelsRef.current.set(messagesChannelKey, messagesChannel);

    return cleanup;
  }, [user, sessionId, onSessionCreated, onSessionUpdated, onSessionDeleted, onMessageCreated, onMessageUpdated, onMessageDeleted, onActiveSessionChanged, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isConnected,
    connectionStatus,
    activeChannels: Array.from(channelsRef.current.keys()),
    cleanup
  };
}

