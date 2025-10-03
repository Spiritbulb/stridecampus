import React from 'react';

interface SimpleTypingIndicatorProps {
  className?: string;
}

export const SimpleTypingIndicator: React.FC<SimpleTypingIndicatorProps> = ({
  className = ''
}) => {
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="bg-gray-100 rounded-2xl px-4 py-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

