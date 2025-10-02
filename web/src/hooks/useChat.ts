// hooks/useChat.ts
import { useState, useEffect, useRef } from 'react';
import { useSafeApp } from '@/contexts/SafeAppContext';
import { supabase } from '@/utils/supabaseClient';
import { NotificationService } from '@/utils/notificationService';

export interface ChatParticipant {
  user_id: string;
  users: {
    id: string;
    full_name: string;
    avatar_url: string;
    username: string;
  };
}

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  last_message_at: string;
  participants: ChatParticipant[];
  unread_count?: number;
}

export interface MessageSender {
  id: string;
  full_name: string;
  avatar_url: string;
  username: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  message_type: string;
  created_at: string;
  read_by_receiver: boolean;
  sender: MessageSender;
}

export interface User {
  id: string;
  full_name: string;
  avatar_url: string;
  username: string;
}

export const useChat = () => {
  const { user } = useSafeApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const activeChatRef = useRef<Chat | null>(null);

  // Fetch user's chats
  const fetchChats = async () => {
    if (!user) return;

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
      setChats(chatsData as Chat[]);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a chat
  const fetchMessages = async (chatId: string) => {
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
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (chatId: string, message: string) => {
    if (!user) return;

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

      // Update chat's last message
      await supabase
        .from('chats')
        .update({
          last_message: message,
          last_message_at: new Date().toISOString()
        })
        .eq('id', chatId);

      // Send push notification to other participants
      try {
        // Get chat participants
        const { data: chatData } = await supabase
          .from('chats')
          .select(`
            participants:chat_participants(user_id, users(id, full_name, expo_push_token, push_notifications))
          `)
          .eq('id', chatId)
          .single();

        if (chatData?.participants) {
          // Find recipients (all participants except sender)
          const recipients = chatData.participants
            .filter((p: any) => p.user_id !== user.id)
            .map((p: any) => p.users);

          // Send notifications to recipients using the new notification service
          for (const recipient of recipients) {
            if (recipient?.push_notifications) {
              const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
              const senderName = user.full_name || user.username || 'Someone';
              
              await NotificationService.sendMessageNotification(
                recipient.id,
                user.id,
                senderName,
                messagePreview
              );
            }
          }
        }
      } catch (notificationError) {
        // Don't fail the message send if notification fails
        console.error('Error sending message notification:', notificationError);
      }

      // Add the new message to the messages state immediately
      if (data) {
        setMessages(prev => [...prev, data as Message]);
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Start a new chat
  const startChat = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Check if chat already exists by getting all chats for both users
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
  };

  const fetchUsers = async (query: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .ilike('username', `%${query}%`)

        if (error) {
            console.error('Error fetching users:', error);
            return false;
        }
        
        return data || [];
    } catch (error) {
        console.error('Error fetching users:', error);
        return false;
    }
}

  // Check if users follow each other
  const checkMutualFollow = async (otherUserId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id, followed_id')
        .or(`and(follower_id.eq.${user.id},followed_id.eq.${otherUserId}),and(follower_id.eq.${otherUserId},followed_id.eq.${user.id})`);

      if (error) {
        console.error('Error checking mutual follow:', error);
        return false;
      }

      if (!data || data.length === 0) return false;

      // Check if both follow each other
      const userFollows = data.some(f => f.follower_id === user.id && f.followed_id === otherUserId);
      const otherUserFollows = data.some(f => f.follower_id === otherUserId && f.followed_id === user.id);

      return userFollows && otherUserFollows;
    } catch (error) {
      console.error('Error checking mutual follow:', error);
      return false;
    }
  };

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        async (payload) => {
          const newMessage = payload.new as any;
          // console.log('Realtime message received:', newMessage);
          
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

          // Always update chats list with new message
          setChats(prev => prev.map(chat => 
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
          ));

          // Only add to messages if it's for the current active chat and not from current user
          if (activeChatRef.current && newMessage.chat_id === activeChatRef.current.id && newMessage.sender_id !== user.id) {
            // console.log('Adding message to active chat');
            setMessages(prev => [...prev, messageWithSender]);
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [user]); // Removed chats dependency since we're using ref

  // Update ref when activeChat changes
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  return {
    chats,
    messages,
    activeChat,
    loading,
    setActiveChat,
    fetchChats,
    fetchUsers,
    fetchMessages,
    sendMessage,
    startChat,
    checkMutualFollow
  };
};