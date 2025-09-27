import { Message } from './types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useEffect, useState } from 'react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const CHAT_STORAGE_KEY = 'chatMessages';
const MAX_INTERACTIONS = 20;

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setLocalMessages(parsedMessages);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
        // Clear corrupted data
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages prop changes with limit enforcement
  useEffect(() => {
    if (messages.length > 0) {
      // Combine new messages with existing local messages
      const allMessages = [...localMessages, ...messages];
      
      // Remove duplicates based on message id
      const uniqueMessages = allMessages.reduce((acc, current) => {
        if (!acc.find(message => message.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, [] as Message[]);

      // Keep only the most recent MAX_INTERACTIONS messages
      const limitedMessages = uniqueMessages.slice(-MAX_INTERACTIONS);
      
      // Update localStorage and state
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(limitedMessages));
      setLocalMessages(limitedMessages);
    }
  }, [messages]); // Only depend on messages prop

  // Use localMessages for display to ensure we show persisted data
  const displayMessages = localMessages.length > 0 ? localMessages : messages;

  // Clear chat history function (optional - can be exposed via props if needed)
  const clearChatHistory = () => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setLocalMessages([]);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {displayMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        
      </div>
    </div>
  );
};