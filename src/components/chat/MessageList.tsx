import React, { memo } from 'react';
import { MessageListProps } from '@/types/chat';

const MessageList: React.FC<MessageListProps> = memo(({
  messages,
  currentUserId,
  loading,
  messagesEndRef
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f23b36]"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#f23b36] to-[#d63031] rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Start the conversation</h3>
          <p className="text-sm text-gray-500">Send your first message to begin chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
              message.sender_id === currentUserId
                ? 'bg-gradient-to-br from-[#f23b36] to-[#d63031] text-white rounded-br-md'
                : 'bg-white text-gray-900 rounded-bl-md border border-gray-200 shadow-md'
            }`}
          >
            <p className="text-sm leading-relaxed font-medium">{message.message}</p>
            <span className={`text-xs mt-2 block ${
              message.sender_id === currentUserId ? 'text-red-100' : 'text-gray-500'
            }`}>
              {new Date(message.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
