import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState } from '../types';
import { sendMessageToAI, sendMessageToAIStream } from '../utils/api';
import { useApp } from '@/contexts/AppContext';
import { chargeNiaMessageCredits, checkUserCredits, awardNiaChatBonus, generateNiaChatBonus } from '@/utils/creditEconomy';
import { CREDIT_CONFIG } from '@/utils/creditEconomy';
import { useSupabaseMessageStore } from '@/hooks/useSupabaseMessageStore';

export const useChat = (sessionId?: string) => {
  const { user } = useApp(); // Get user from context
  const messageStore = useSupabaseMessageStore(user?.id);
  
  const [state, setState] = useState<ChatState>({
    messages: [],
    inputMessage: '',
    isLoading: false,
  });

  // Use provided sessionId or get active session
  const currentSessionId = sessionId || messageStore.activeSession?.id;
  
  // Load messages from store when session changes
  useEffect(() => {
    if (currentSessionId && messageStore.activeSession && messageStore.isInitialized) {
      console.log('Loading messages for session:', currentSessionId, 'Messages:', messageStore.activeSession.messages.length);
      setState(prev => ({
        ...prev,
        messages: messageStore.activeSession!.messages,
        inputMessage: '', // Clear input when switching sessions
        isLoading: false, // Reset loading state
      }));
    } else if (!currentSessionId) {
      // If no session, clear messages
      console.log('No active session, clearing messages');
      setState(prev => ({
        ...prev,
        messages: [],
        inputMessage: '',
        isLoading: false,
      }));
    }
  }, [currentSessionId, messageStore.activeSession, messageStore.isInitialized]);

  // Separate effect to watch for message updates
  useEffect(() => {
    if (currentSessionId && messageStore.activeSession && messageStore.isInitialized) {
      console.log('Messages updated for session:', currentSessionId, 'Messages:', messageStore.activeSession.messages.length);
      console.log('Active session messages:', messageStore.activeSession.messages);
      setState(prev => ({
        ...prev,
        messages: messageStore.activeSession!.messages,
      }));
    }
  }, [messageStore.activeSession?.messages.length, currentSessionId, messageStore.isInitialized]);

  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>): Promise<string | null> => {
    try {
      console.log('Adding message:', message);
      console.log('Current active session:', messageStore.activeSession?.id);
      
      // Check for duplicate messages (same content and isUser within last 5 seconds)
      const now = Date.now();
      const recentMessages = messageStore.activeSession?.messages.filter(msg => 
        msg.isUser === message.isUser && 
        msg.content === message.content &&
        (now - msg.timestamp.getTime()) < 5000
      ) || [];
      
      if (recentMessages.length > 0) {
        console.log('Duplicate message detected, skipping:', message.content);
        return recentMessages[0].id;
      }
      
      // Add to message store (which will update the state via useEffect)
      const messageId = await messageStore.addMessage(message);
      console.log('Message added with ID:', messageId);
      console.log('Active session after adding message:', messageStore.activeSession?.messages.length, 'messages');
      return messageId;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [messageStore]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Ensure we have an active session before sending messages
    let activeSession = messageStore.activeSession;
    if (!activeSession) {
      console.log('No active session, creating a new one');
      try {
        activeSession = await messageStore.createSession();
        console.log('Session created:', activeSession.id);
      } catch (error) {
        console.error('Failed to create session:', error);
        return;
      }
    }

    // Check if user has enough credits before sending message
    if (user) {
      const hasEnoughCredits = await checkUserCredits(user.id, CREDIT_CONFIG.SPEND.NIA_MESSAGE);
      if (!hasEnoughCredits) {
        await addMessage({ 
          content: "Sorry, you don't have enough credits to send a message. You need 10 credits to chat with me! 💸", 
          isUser: false 
        });
        return;
      }
    }

    // Add user message
    console.log('Adding user message:', content.trim());
    await addMessage({ content: content.trim(), isUser: true });
    setState(prev => ({ ...prev, inputMessage: '', isLoading: true }));

    // Create initial AI message for streaming
    const aiMessageId = await addMessage({ 
      content: '', 
      isUser: false
    });

    if (!aiMessageId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Get ALL messages from the current session for context
      const session = currentSessionId ? await messageStore.getSessionById(currentSessionId) : null;
      const sessionMessages = session?.messages || []; // Fixed: properly await the promise
      
      let streamingContent = '';
      
      // Use streaming API
      await sendMessageToAIStream(
        content,
        sessionMessages,
        user,
        (chunk: string) => {
          // Update the message with new chunk
          console.log('Received chunk in useChat:', chunk);
          streamingContent += chunk;
          console.log('Updated streaming content:', streamingContent);
          messageStore.updateMessage(aiMessageId, streamingContent);
        },
        (fullResponse: string) => {
          // Final update with complete response
          messageStore.updateMessage(aiMessageId, fullResponse);
        },
        (error: Error) => {
          // Handle error
          const errorMessage = getErrorMessage(error);
          messageStore.updateMessage(aiMessageId, errorMessage);
        }
      );

      // Charge credits after successful message
      if (user) {
        const messageId = Date.now().toString();
        await chargeNiaMessageCredits(user.id, messageId);

        // Award random bonus (5% chance - much more reasonable)
        if (Math.random() < 0.05 && currentSessionId) {
          const bonusAmount = generateNiaChatBonus();
          await awardNiaChatBonus(user.id, currentSessionId, bonusAmount);
          
          // Add bonus message
          addMessage({ 
            content: `🎉 Lucky you! You earned ${bonusAmount} credits for our great conversation! ✨`, 
            isUser: false 
          });
        }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageStore.updateMessage(aiMessageId, errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.messages, addMessage, user]); // Add user to dependencies

  const updateInputMessage = useCallback((message: string) => {
    setState(prev => ({ ...prev, inputMessage: message }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  return {
    messages: state.messages,
    inputMessage: state.inputMessage,
    isLoading: state.isLoading,
    sendMessage,
    updateInputMessage,
    addMessage,
    clearMessages,
    // Message store integration
    messageStore,
    currentSessionId,
  };
};

const getErrorMessage = (error: unknown): string => {
  const errorResponses = [
    "Eish, network iko down! 😭 My wifi is being dramatic",
    "Aki something's not working, let me try again later",
    "Waah, connection issues fr. This is so annoying 💀",
    "My brain just glitched, resend that please"
  ];
  return errorResponses[Math.floor(Math.random() * errorResponses.length)];
};