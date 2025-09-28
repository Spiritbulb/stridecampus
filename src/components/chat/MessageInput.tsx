import React, { memo, useState, useRef, useEffect } from 'react';
import { MessageInputProps } from '@/types/chat';

const MessageInput: React.FC<MessageInputProps> = memo(({
  newMessage,
  onMessageChange,
  onSendMessage,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px height
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onMessageChange(value);
    adjustTextareaHeight();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !disabled) {
      onSendMessage(e as any);
      // Reset textarea height
      setTimeout(adjustTextareaHeight, 0);
    }
  };

  // Handle enter key (send on enter, new line on shift+enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Focus management
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Adjust height on message change
  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

  const isEmpty = !newMessage.trim();

  return (
    <div className="sticky bottom-0 mb-14 z-30 bg-white/95 backdrop-blur-md">
      {/* Subtle top border with gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      <form onSubmit={handleSubmit} className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-end gap-3">
          {/* Message input container */}
          <div className={`flex-1 relative transition-all duration-200 ${
            isFocused ? 'transform scale-[1.01]' : ''
          }`}>
            
            {/* Input background with subtle styling */}
            <div className={`relative rounded-3xl transition-all duration-200 ${
              isFocused 
                ? '' 
                : ''
            }`}>
              
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Type a message..."
                disabled={disabled}
                maxLength={1000}
                rows={1}
                className={`w-full bg-transparent resize-none border-0 outline-none placeholder-gray-500 transition-all duration-200 px-4 py-3 md:px-5 md:py-4 text-base md:text-sm leading-6 md:leading-5 ${
                  disabled ? 'cursor-not-allowed opacity-60' : ''
                }`}
                style={{ 
                  minHeight: '48px',
                  maxHeight: '120px'
                }}
                aria-label="Type your message"
                autoComplete="off"
              />
              
              {/* Input decoration when empty */}
              {isEmpty && !isFocused && (
                <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-opacity duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" 
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Send button */}
          <button
            type="submit"
            disabled={isEmpty || disabled}
            className={`w-12 h-12 md:w-14 md:h-14 flex-shrink-0 transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed group rounded-2xl ${
              isEmpty || disabled
                ? 'bg-gray-200 text-gray-400 shadow-sm'
                : 'bg-gradient-to-br from-[#f23b36] to-[#f23b36]/70 text-white shadow-md hover:shadow-lg hover:from-[#f23b36]/70 hover:to-[#f23b36] active:scale-95'
            }`}
            aria-label="Send message"
          >
            <svg 
              className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 ${
                !isEmpty ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;