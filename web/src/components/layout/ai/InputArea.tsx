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
}

export const InputArea = ({ value, onChange, onSend, isLoading }: InputAreaProps) => {
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
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onInput={handleInput}
                    placeholder="Ask Nia anything..."
                    disabled={isLoading}
                    maxLength={500}
                    rows={1}
                    className="w-full bg-transparent text-gray-800 placeholder-gray-400 text-base resize-none focus:outline-none focus:ring-0 focus:border-transparent disabled:cursor-not-allowed leading-relaxed"
                    style={{
                      minHeight: '60px',
                      maxHeight: '200px',
                    }}
                  />
                </div>
                
                {/* Send button */}
                <CostBubbleWrapper cost={NIA_MESSAGE_COST} position="top-right" size="sm">
                  <button 
                    onClick={handleSend}
                    disabled={!value.trim() || isLoading || !hasEnoughCredits}
                    className={`
                      relative group transition-all duration-200 ease-out transform
                      ${!value.trim() || isLoading || !hasEnoughCredits
                        ? 'opacity-50 cursor-not-allowed scale-95' 
                        : 'hover:scale-105 active:scale-95'
                      }
                    `}
                    title={
                      !hasEnoughCredits 
                        ? `Insufficient credits. You need ${NIA_MESSAGE_COST} credits to send a message.`
                        : "Send message"
                    }
                  >
                    {/* Button background with gradient */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                      ${hasEnoughCredits 
                        ? 'bg-gradient-to-br from-[#f23b36] to-[#e0342e] shadow-lg shadow-[#f23b36]/25 hover:shadow-[#f23b36]/40' 
                        : 'bg-gradient-to-br from-red-400 to-red-500 shadow-lg shadow-red-400/25'
                      }
                    `}>
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      )}
                    </div>
                    
                    {/* Subtle glow effect */}
                    {hasEnoughCredits && !isLoading && value.trim() && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f23b36] to-[#e0342e] opacity-0 group-hover:opacity-20 transition-opacity duration-200 blur-sm -z-10"></div>
                    )}
                  </button>
                </CostBubbleWrapper>
              </div>
              
              {/* Character count */}
              <div className="absolute bottom-2 right-16 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                {value.length}/500
              </div>
            </div>
            
            {/* Subtle accent line */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-[#f23b36] to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};