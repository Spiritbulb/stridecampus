import React from 'react';
import { SimpleMessageBubble } from './SimpleMessageBubble';
import { SimpleTypingIndicator } from './SimpleTypingIndicator';
import { EmptyState } from './EmptyState';
import { Message } from './types';

interface MessageAreaProps {
  messages: Message[];
  isLoading?: boolean;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
  className?: string;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  messages,
  isLoading = false,
  emptyStateTitle,
  emptyStateSubtitle,
  className = ''
}) => {
  if (messages.length === 0) {
    return (
      <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
        <EmptyState 
          title={emptyStateTitle}
          subtitle={emptyStateSubtitle}
        />
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}>
      {messages.map((msg, idx) => (
        <SimpleMessageBubble
          key={msg.id || idx}
          message={msg}
        />
      ))}
      {isLoading && (
        <SimpleTypingIndicator />
      )}
    </div>
  );
};
