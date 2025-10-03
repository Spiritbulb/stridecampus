import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

interface ChatHeaderProps {
  title?: string;
  onBack: () => void;
  onMenuToggle: () => void;
  showMenu: boolean;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = 'Chat with Nia',
  onBack,
  onMenuToggle,
  showMenu,
  className = ''
}) => {
  return (
    <div className={`sticky top-0 z-20 flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0 ${className}`}>
      <div className="flex items-center gap-3">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onMenuToggle}
          variant="ghost"
          size="sm"
          aria-label="Open menu"
          aria-expanded={showMenu}
        >
          <EllipsisVerticalIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

