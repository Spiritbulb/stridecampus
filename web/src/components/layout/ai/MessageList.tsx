import { Message } from './types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useEffect, useRef } from 'react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or when loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Try multiple scroll methods for better compatibility
        container.scrollTop = container.scrollHeight;
        
        // Also try scrollTo as backup
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 10);
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 50);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  // Also scroll when individual message content changes (for streaming)
  useEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        container.scrollTop = container.scrollHeight;
        
        // Smooth scroll as backup
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 10);
      }
    };

    // Scroll after a short delay to allow content to render
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages.map(msg => msg.content).join('')]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
};