import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types';
import { sendMessageToAI } from '../utils/api';
import { useApp } from '@/contexts/AppContext';
import { chargeNiaMessageCredits, checkUserCredits, awardNiaChatBonus, generateNiaChatBonus } from '@/utils/creditEconomy';
import { CREDIT_CONFIG } from '@/utils/creditEconomy';

export const useChat = () => {
  const { user } = useApp(); // Get user from context
  
  const [state, setState] = useState<ChatState>({
    messages: [],
    inputMessage: '',
    isLoading: false,
  });

  // Track session for bonus purposes
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setState(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Check if user has enough credits before sending message
    if (user) {
      const hasEnoughCredits = await checkUserCredits(user.id, CREDIT_CONFIG.SPEND.NIA_MESSAGE);
      if (!hasEnoughCredits) {
        addMessage({ 
          content: "Sorry, you don't have enough credits to send a message. You need 10 credits to chat with me! 💸", 
          isUser: false 
        });
        return;
      }
    }

    // Add user message
    addMessage({ content: content.trim(), isUser: true });
    setState(prev => ({ ...prev, inputMessage: '', isLoading: true }));

    try {
      // Pass user to the API call
      const response = await sendMessageToAI(content, state.messages, user);
      addMessage({ content: response, isUser: false });

      // Charge credits after successful message
      if (user) {
        const messageId = Date.now().toString();
        await chargeNiaMessageCredits(user.id, messageId);

        // Award random bonus (20% chance)
        if (Math.random() < 0.2) {
          const bonusAmount = generateNiaChatBonus();
          await awardNiaChatBonus(user.id, sessionId, bonusAmount);
          
          // Add bonus message
          addMessage({ 
            content: `🎉 Bonus! You earned ${bonusAmount} credits for chatting with me! Keep the conversation going! ✨`, 
            isUser: false 
          });
        }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      addMessage({ content: errorMessage, isUser: false });
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