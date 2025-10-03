import React from 'react';
import { Message } from './types';

interface SimpleMessageBubbleProps {
  message: Message;
  className?: string;
}

export const SimpleMessageBubble: React.FC<SimpleMessageBubbleProps> = ({
  message,
  className = ''
}) => {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          message.isUser
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};
