import React from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Start a conversation',
  subtitle = 'Send a message to begin chatting with Nia',
  icon,
  className = ''
}) => {
  const defaultIcon = <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />;
  
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        {icon || defaultIcon}
        <p className="text-lg font-medium mb-2">{title}</p>
        <p className="text-sm">{subtitle}</p>
      </div>
    </div>
  );
};

