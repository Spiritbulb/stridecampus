import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/utils/supabaseClient';
import { Chat, Message, ChatParticipant } from '@/types/chat';

interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

interface OnlineUser {
  userId: string;
  username: string;
  lastSeen: string;
}

interface UseRealtimeChatProps {
  currentUserId: string;
  isMobile: boolean;
}

export const useRealtimeChat = ({ currentUserId, isMobile }: UseRealtimeChatProps) => {
  const { user } = useApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activeChatRef = useRef<Chat | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());

  // Fetch user's chats
  const fetchChats = useCallback(async () => {
    if (!user) return;

    console.log('Fetching chats for user:', user.id);
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
      
      setChats(sortedChats as Chat[]);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!user) return;

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
      setMessages(data as Message[]);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read_by_receiver: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .eq('read_by_receiver', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (chatId: string, message: string) => {
    if (!user) return;

    console.log('Sending message:', { chatId, message, userId: user.id });
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

      // Send push notification to other participants
      try {
        const { data: chatData } = await supabase
          .from('chats')
          .select(`
            chat_participants!inner(
              user_id,
              users!inner(id, username, full_name)
            )
          `)
          .eq('id', chatId)
          .single();

        if (chatData?.chat_participants) {
          const otherParticipants = chatData.chat_participants.filter(
            (p: any) => p.user_id !== user.id
          );

          for (const participant of otherParticipants) {
            // Send push notification logic here
            console.log(`Sending notification to ${participant.users[0].username}`);
          }
        }
      } catch (notificationError) {
        console.error('Failed to send push notification:', notificationError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  // Handle typing indicators
  const handleTyping = useCallback((isTyping: boolean) => {
    if (!activeChat || !user) return;

    const channel = channelsRef.current.get(`typing:${activeChat.id}`);
    if (!channel) return;

    if (isTyping) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { 
          userId: user.id, 
          username: user?.full_name || user.email,
          typing: true,
          timestamp: Date.now()
        },
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { 
            userId: user.id, 
            username: user?.full_name || user.email,
            typing: false,
            timestamp: Date.now()
          },
        });
      }, 3000);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { 
          userId: user.id, 
          username: user?.full_name || user.email,
          typing: false,
          timestamp: Date.now()
        },
      });
    }
  }, [activeChat, user]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscriptions for user:', user.id);

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        async (payload) => {
          console.log('Realtime message received:', payload);
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

          console.log('Message with sender:', messageWithSender);

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
            console.log('Adding message to active chat');
            setMessages(prev => [...prev, messageWithSender]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Message subscription status:', status);
      });

    // Subscribe to chat updates
    const chatChannel = supabase
      .channel('chats')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chats' 
        }, 
        (payload) => {
          console.log('Chat update received:', payload);
          const updatedChat = payload.new as any;
          
          setChats(prev => {
            const updatedChats = prev.map(chat => 
              chat.id === updatedChat.id 
                ? { ...chat, ...updatedChat }
                : chat
            );
            
            // Sort by last_message_at to put newest chats at top
            return updatedChats.sort((a, b) => 
              new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );
          });
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    // Subscribe to online users presence
    const presenceChannel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const onlineUsersList: OnlineUser[] = [];
        
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              onlineUsersList.push({
                userId: presence.user_id,
                username: presence.username || 'Unknown',
                lastSeen: new Date().toISOString()
              });
            }
          });
        });
        
        setOnlineUsers(onlineUsersList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            setOnlineUsers(prev => [...prev.filter(u => u.userId !== presence.user_id), {
              userId: presence.user_id,
              username: presence.username || 'Unknown',
              lastSeen: new Date().toISOString()
            }]);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            setOnlineUsers(prev => prev.filter(u => u.userId !== presence.user_id));
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await presenceChannel.track({
            user_id: user.id,
            username: user?.full_name || user.email,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      messageChannel.unsubscribe();
      chatChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [user]);

  // Set up typing indicators for active chat
  useEffect(() => {
    if (!activeChat || !user) return;

    const channelKey = `typing:${activeChat.id}`;
    const channel = supabase.channel(channelKey);
    
    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, username, typing, timestamp } = payload.payload;
        
        if (userId === user.id) return; // Don't show own typing
        
        setTypingUsers(prev => {
          if (typing) {
            return [...prev.filter(u => u.userId !== userId), {
              userId,
              username,
              timestamp
            }];
          } else {
            return prev.filter(u => u.userId !== userId);
          }
        });
      })
      .subscribe();

    channelsRef.current.set(channelKey, channel);

    return () => {
      channel.unsubscribe();
      channelsRef.current.delete(channelKey);
    };
  }, [activeChat, user]);

  // Update ref when activeChat changes
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Clean up typing timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Initialize chats
  const initializeChats = useCallback(async () => {
    if (isInitialized) return;
    
    console.log('Initializing chats...');
    setError(null);
    try {
      await fetchChats();
      setIsInitialized(true);
      console.log('Chats initialized successfully');
    } catch (error) {
      console.error('Error initializing chats:', error);
      setError('Failed to load chats. Please refresh the page.');
    }
  }, [fetchChats, isInitialized]);

  return {
    // State
    chats,
    messages,
    activeChat,
    loading,
    typingUsers,
    onlineUsers,
    isInitialized,
    error,
    
    // Actions
    setActiveChat,
    fetchChats,
    fetchMessages,
    sendMessage,
    startChat,
    initializeChats,
    handleTyping,
    setError
  };
};
