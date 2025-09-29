import { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { CostBubbleWrapper } from '@/components/ui/CostBubble';
import { useApp } from '@/contexts/AppContext';
import { checkUserCredits } from '@/utils/creditEconomy';
import { CREDIT_CONFIG } from '@/utils/creditEconomy';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  isLoading: boolean;
  messagesEndRef: any;
}

export const InputArea = ({ value, onChange, onSend, isLoading, messagesEndRef }: InputAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useApp();
  const [hasEnoughCredits, setHasEnoughCredits] = useState(true);
  const NIA_MESSAGE_COST = CREDIT_CONFIG.SPEND.NIA_MESSAGE; // Cost per Nia message

  // Check if user has enough credits
  useEffect(() => {
    const checkCredits = async () => {
      if (user) {
        const hasCredits = await checkUserCredits(user.id, NIA_MESSAGE_COST);
        setHasEnoughCredits(hasCredits);
      } else {
        setHasEnoughCredits(false);
      }
    };
    
    checkCredits();
  }, [user, NIA_MESSAGE_COST]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !isLoading && hasEnoughCredits) {
      onSend(value);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onInput={handleInput}
                placeholder="Ask anything"
                disabled={isLoading}
                maxLength={500}
                rows={1}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed resize-none placeholder-gray-500"
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
              />
            </div>
            <CostBubbleWrapper cost={NIA_MESSAGE_COST} position="top-right" size="sm">
              <button 
                onClick={handleSend}
                disabled={!value.trim() || isLoading || !hasEnoughCredits}
                className={`mb-1 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:cursor-not-allowed ${
                  hasEnoughCredits 
                    ? 'bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300' 
                    : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
                }`}
                title={
                  !hasEnoughCredits 
                    ? `Insufficient credits. You need ${NIA_MESSAGE_COST} credits to send a message.`
                    : "Send message"
                }
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="h-7 w-7" />
                )}
              </button>
            </CostBubbleWrapper>
          </div>
          <div className="flex items-end justify-end mt-2 px-1">
            <p className="text-xs text-gray-400">
              {value.length}/500
            </p>
          </div>
        </div>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};