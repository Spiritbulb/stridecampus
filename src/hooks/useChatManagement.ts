import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { User, ChatParticipant } from '@/types/chat';
import { supabase } from '@/utils/supabaseClient';

interface UseChatManagementProps {
  currentUserId: string;
  isMobile: boolean;
}

export const useChatManagement = ({ currentUserId, isMobile }: UseChatManagementProps) => {
  const router = useRouter();
  const {
    chats,
    messages,
    activeChat,
    loading,
    setActiveChat,
    fetchChats,
    fetchMessages,
    sendMessage,
    startChat
  } = useChat();

  const [newMessage, setNewMessage] = useState<string>('');
  const [showChatList, setShowChatList] = useState<boolean>(true);
  const [showUserSearch, setShowUserSearch] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get other participant for active chat
  const otherParticipant = activeChat?.participants.find((p: ChatParticipant) => p.user_id !== currentUserId) || null;
  
  // Debug otherParticipant
  useEffect(() => {
    // console.log('Other participant:', otherParticipant);
    // console.log('Active chat participants:', activeChat?.participants);
  }, [otherParticipant, activeChat?.participants]);

  // Debug activeChat changes
  useEffect(() => {
    // console.log('Active chat changed:', activeChat);
  }, [activeChat]);

  // Event handlers
  const handleSelectChat = useCallback(async (chat: any) => {
    if (activeChat?.id === chat.id) return;

    // console.log('Selecting chat:', chat);
    setActiveChat(chat);
    setError(null);
    
    try {
      // console.log('Fetching messages for chat:', chat.id);
      await fetchMessages(chat.id);
      // console.log('Messages fetched successfully');
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError('Failed to load messages. Please try again.');
    }

    if (isMobile) {
      setShowChatList(false);
    }
  }, [activeChat?.id, isMobile, setActiveChat, fetchMessages]);

  const handleBackToChats = useCallback(() => {
    setShowChatList(true);
    setActiveChat(null);
    setShowUserSearch(false);
    setError(null);
    router.replace('/chats', { scroll: false });
  }, [setActiveChat, router]);

  const handleSendMessage = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) {
      // console.log('Cannot send message:', { newMessage: newMessage.trim(), activeChat });
      return;
    }

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setError(null);

    try {
      // console.log('Sending message to chat:', activeChat.id);
      await sendMessage(activeChat.id, messageToSend);
      // console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      setNewMessage(messageToSend);
    }
  }, [newMessage, activeChat, sendMessage]);

  const handleStartChat = useCallback(async (otherUser: User) => {
    setError(null);
    try {
      // console.log('Starting chat with user:', otherUser);
      const chatId = await startChat(otherUser.id);
      // console.log('Chat ID received:', chatId);
      
      if (chatId) {
        // Fetch the new chat directly instead of relying on state
        const { data: chatData } = await supabase
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
          .eq('chat_id', chatId)
          .eq('user_id', currentUserId)
          .single();

        // console.log('Chat data fetched:', chatData);

        if (chatData?.chats) {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select(`
              user_id,
              users!inner(id, full_name, avatar_url, username)
            `)
            .eq('chat_id', chatId)
            .eq('is_active', true);

          const newChat = {
            ...chatData.chats,
            participants: participants || []
          } as any;

          // console.log('Setting active chat:', newChat);
          setActiveChat(newChat);
          await fetchMessages(newChat.id);
          if (isMobile) {
            setShowChatList(false);
          }
        }
        
        // Refresh chats list in the background
        fetchChats();
      }
      
      setShowUserSearch(false);
    } catch (error) {
      console.error('Failed to start chat:', error);
      setError('Failed to start chat. Please try again.');
    }
  }, [startChat, fetchChats, isMobile, setActiveChat, fetchMessages, currentUserId]);

  const handleStartNewChat = useCallback(() => {
    setShowUserSearch(true);
    setError(null);
  }, []);

  const handleViewProfile = useCallback((username: string) => {
    router.push(`/u/${username}`);
  }, [router]);

  const initializeChats = useCallback(async () => {
    if (isInitialized) return;
    
    setError(null);
    try {
      await fetchChats();
      setIsInitialized(true);
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
    newMessage,
    showChatList,
    showUserSearch,
    isInitialized,
    error,
    otherParticipant,
    messagesEndRef,
    
    // Actions
    setNewMessage,
    setShowChatList,
    setShowUserSearch,
    handleSelectChat,
    handleBackToChats,
    handleSendMessage,
    handleStartChat,
    handleStartNewChat,
    handleViewProfile,
    initializeChats,
    setError
  };
};
