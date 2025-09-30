import React, { memo } from 'react';
import { MessageListProps } from '@/types/chat';
import TypingIndicator from './TypingIndicator';

const MessageList: React.FC<MessageListProps> = memo(({
  messages,
  currentUserId,
  loading,
  messagesEndRef,
  typingUsers = []
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
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">
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
    <div className="flex-1 overflow-y-auto bg-white">
      {messages.map((message) => (
        <div key={message.id} className="py-4 px-6">
          <div className="max-w-4xl mx-auto">
            <div className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl px-4 py-3 rounded-2xl transition-all duration-200 ${
                message.sender_id === currentUserId 
                  ? 'bg-gradient-to-r from-[#f23b36] to-[#e53e3e] text-white' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.message}
                </div>
                <div className={`text-xs mt-2 ${
                  message.sender_id === currentUserId ? 'text-red-100' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
