import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types';
import { sendMessageToAI } from '../utils/api';
import { useApp } from '@/contexts/AppContext';

export const useChat = () => {
  const { user } = useApp(); // Get user from context
  
  const [state, setState] = useState<ChatState>({
    messages: [],
    inputMessage: '',
    isLoading: false,
  });

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

    // Add user message
    addMessage({ content: content.trim(), isUser: true });
    setState(prev => ({ ...prev, inputMessage: '', isLoading: true }));

    try {
      // Pass user to the API call
      const response = await sendMessageToAI(content, state.messages, user);
      addMessage({ content: response, isUser: false });
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