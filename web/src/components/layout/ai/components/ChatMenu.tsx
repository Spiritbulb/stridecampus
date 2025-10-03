import React from 'react';
import { 
  ShareIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ChatMenuProps {
  isOpen: boolean;
  onShare: () => void;
  onNewChat: () => void;
  onClose: () => void;
  className?: string;
}

export const ChatMenu: React.FC<ChatMenuProps> = ({
  isOpen,
  onShare,
  onNewChat,
  onClose,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Dropdown menu */}
      <div className={`absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 ${className}`}>
        <div className="py-1">
          <button
            onClick={() => {
              onShare();
              onClose();
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ShareIcon className="w-4 h-4" />
            Share Chat
          </button>
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>
      
      {/* Click outside to close menu */}
      <div 
        className="fixed inset-0 z-0"
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
};

