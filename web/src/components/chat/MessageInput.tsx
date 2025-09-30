import React, { memo, useState, useRef, useEffect } from 'react';
import { MessageInputProps } from '@/types/chat';
import { Send } from 'lucide-react';

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
    <div className="fixed bottom-16 left-0 right-0 md:sticky md:bottom-0 z-20">
      <div className="p-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Main input container with subtle background */}
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
                <div className="flex items-end p-4 space-x-3">
                  {/* Text area */}
                  <div className="flex-1">
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
                      className="w-full bg-transparent text-gray-800 placeholder-gray-400 text-base resize-none focus:outline-none focus:ring-0 focus:border-transparent disabled:cursor-not-allowed leading-relaxed"
                      style={{
                        minHeight: '60px',
                        maxHeight: '200px',
                      }}
                    />
                  </div>
                  
                  {/* Send button */}
                  <button 
                    onClick={handleSubmit}
                    disabled={isEmpty || disabled}
                    className={`
                      relative group transition-all duration-200 ease-out transform
                      ${isEmpty || disabled
                        ? 'opacity-50 cursor-not-allowed scale-95' 
                        : 'hover:scale-105 active:scale-95'
                      }
                    `}
                    title="Send message"
                  >
                    {/* Button background with gradient */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                      ${!isEmpty && !disabled
                        ? 'bg-gradient-to-br from-[#f23b36] to-[#e0342e] shadow-lg shadow-[#f23b36]/25 hover:shadow-[#f23b36]/40' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-400/25'
                      }
                    `}>
                      {disabled ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      )}
                    </div>
                    
                    {/* Subtle glow effect */}
                    {!isEmpty && !disabled && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f23b36] to-[#e0342e] opacity-0 group-hover:opacity-20 transition-opacity duration-200 blur-sm -z-10"></div>
                    )}
                  </button>
                </div>
                
                {/* Character count */}
                <div className="absolute bottom-2 right-16 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                  {newMessage.length}/1000
                </div>
              </div>
              
              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-[#f23b36] to-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;