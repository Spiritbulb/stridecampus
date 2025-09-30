import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/utils/supabaseClient';
import { Chat, Message, ChatParticipant } from '@/types/chat';

interface UseSimpleRealtimeChatProps {
  currentUserId: string;
  isMobile: boolean;
}

export const useSimpleRealtimeChat = ({ currentUserId, isMobile }: UseSimpleRealtimeChatProps) => {
  const { user } = useApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activeChatRef = useRef<Chat | null>(null);

  // Fetch user's chats
  const fetchChats = useCallback(async () => {
    if (!user) return;

    console.log('🔍 Fetching chats for user:', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats (
            id,
            created_at,
            updated_at,
            last_message,
            last_message_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      // Get detailed chat data with participants
      const chatPromises = data?.map(async (item: any) => {
        const { data: participants } = await supabase
          .from('chat_participants')
          .select(`
            user_id,
            users!inner(id, full_name, avatar_url, username)
          `)
          .eq('chat_id', item.chat_id)
          .eq('is_active', true);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', item.chat_id)
          .eq('read_by_receiver', false)
          .neq('sender_id', user.id);

        return {
          ...item.chats,
          participants: participants || [],
          unread_count: unreadCount || 0
        };
      }) || [];

      const chatsData = await Promise.all(chatPromises);
      
      // Sort chats by last_message_at (newest first)
      const sortedChats = chatsData.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      
      console.log('✅ Chats fetched:', sortedChats.length);
      setChats(sortedChats as Chat[]);
    } catch (error) {
      console.error('❌ Error fetching chats:', error);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!user) return;

    console.log('🔍 Fetching messages for chat:', chatId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, full_name, avatar_url, username)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('✅ Messages fetched:', data?.length || 0);
      setMessages(data as Message[]);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read_by_receiver: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .eq('read_by_receiver', false);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (chatId: string, message: string) => {
    if (!user) return;

    console.log('📤 Sending message:', { chatId, message, userId: user.id });
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            sender_id: user.id,
            message: message,
            message_type: 'text'
          }
        ])
        .select(`
          *,
          sender:users!sender_id(id, full_name, avatar_url, username)
        `)
        .single();

      if (error) throw error;

      console.log('✅ Message sent successfully:', data);

      // Add message to current messages if it's for the active chat
      if (activeChatRef.current && chatId === activeChatRef.current.id) {
        setMessages(prev => [...prev, data as Message]);
      }

      // Update chat's last message
      await supabase
        .from('chats')
        .update({
          last_message: message,
          last_message_at: new Date().toISOString()
        })
        .eq('id', chatId);

      // Update local chat state to move chat to top
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === chatId 
            ? { 
                ...chat, 
                last_message: message,
                last_message_at: new Date().toISOString()
              }
            : chat
        );
        
        // Sort by last_message_at to put newest chats at top
        return updatedChats.sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }, [user]);

  // Start a new chat
  const startChat = useCallback(async (otherUserId: string) => {
    if (!user) return;

    try {
      // Check if chat already exists
      const { data: userChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      const { data: otherUserChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', otherUserId);

      if (userChats && otherUserChats) {
        const userChatIds = userChats.map(chat => chat.chat_id);
        const otherUserChatIds = otherUserChats.map(chat => chat.chat_id);
        const commonChats = userChatIds.filter(id => otherUserChatIds.includes(id));

        if (commonChats.length > 0) {
          return commonChats[0];
        }
      }

      // Create new chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert([{
          last_message: '',
          last_message_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chat.id, user_id: user.id, is_active: true },
          { chat_id: chat.id, user_id: otherUserId, is_active: true }
        ]);

      if (participantsError) throw participantsError;

      return chat.id;
    } catch (error) {
      console.error('Error starting chat:', error);
      throw error;
    }
  }, [user]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Setting up realtime subscriptions for user:', user.id);

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('simple-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        async (payload) => {
          console.log('📨 Realtime message received:', payload);
          const newMessage = payload.new as any;
          
          // Get sender info
          const { data: senderData } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, username')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithSender = {
            ...newMessage,
            sender: senderData
          } as Message;

          console.log('📨 Message with sender:', messageWithSender);

          // Update chats list with new message and move to top
          setChats(prev => {
            const updatedChats = prev.map(chat => 
              chat.id === newMessage.chat_id 
                ? { 
                    ...chat, 
                    last_message: newMessage.message,
                    last_message_at: newMessage.created_at,
                    unread_count: newMessage.sender_id !== user.id 
                      ? (chat.unread_count || 0) + 1 
                      : chat.unread_count
                  }
                : chat
            );
            
            // Sort by last_message_at to put newest chats at top
            return updatedChats.sort((a, b) => 
              new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );
          });

          // Add to messages if it's for the current active chat and not from current user
          if (activeChatRef.current && newMessage.chat_id === activeChatRef.current.id && newMessage.sender_id !== user.id) {
            console.log('📨 Adding message to active chat');
            setMessages(prev => [...prev, messageWithSender]);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Message subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription failed. Check if realtime is enabled for messages table.');
        }
      });

    return () => {
      console.log('🔌 Cleaning up realtime subscriptions');
      messageChannel.unsubscribe();
    };
  }, [user]);

  // Update ref when activeChat changes
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Initialize chats
  const initializeChats = useCallback(async () => {
    if (isInitialized) return;
    
    console.log('🚀 Initializing chats...');
    setError(null);
    try {
      await fetchChats();
      setIsInitialized(true);
      console.log('✅ Chats initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing chats:', error);
      setError('Failed to load chats. Please refresh the page.');
    }
  }, [fetchChats, isInitialized]);

  return {
    // State
    chats,
    messages,
    activeChat,
    loading,
    isInitialized,
    error,
    
    // Actions
    setActiveChat,
    fetchChats,
    fetchMessages,
    sendMessage,
    startChat,
    initializeChats,
    setError
  };
};
