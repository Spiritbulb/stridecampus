import React, { useState, useMemo, useCallback } from 'react';
import { useSupabaseMessageStore, ChatSessionWithMessages } from '@/hooks/useSupabaseMessageStore';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

interface ChatListViewProps {
  onChatSelect: (sessionId: string) => void;
  onCreateNew: () => void;
  userId?: string;
}

// Memoized session item component for better performance
const SessionItem = React.memo<{
  session: ChatSessionWithMessages;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string, event: React.MouseEvent) => void;
  formatDate: (dateString: string) => string;
  getLastMessagePreview: (session: ChatSessionWithMessages) => string;
}>(({ session, onSelect, onDelete, formatDate, getLastMessagePreview }) => {
  const handleClick = useCallback(() => {
    onSelect(session.id);
  }, [onSelect, session.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    onDelete(session.id, e);
  }, [onDelete, session.id]);

  return (
    <div
      onClick={handleClick}
      className="group px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-medium text-gray-900 truncate pr-2">
              {session.title}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatDate(session.updated_at)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 truncate pr-2">
              {getLastMessagePreview(session)}
            </p>
            <button
              onClick={handleDelete}
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            >
              <TrashIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

SessionItem.displayName = 'SessionItem';

// Memoized empty state component
const EmptyState = React.memo<{
  searchQuery: string;
  onCreateNew: () => void;
}>(({ searchQuery, onCreateNew }) => {
  const handleCreateNew = useCallback(() => {
    onCreateNew();
  }, [onCreateNew]);

  if (searchQuery) {
    return (
      <div className="text-center">
        <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No chats found</h3>
        <p className="text-gray-500 text-sm">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <ChatBubbleLeftIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations yet</h3>
      <p className="text-gray-500 text-sm mb-6">Start chatting with Nia</p>
      <button 
        onClick={handleCreateNew}
        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full transition-colors"
      >
        Start Chatting
      </button>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// Memoized delete modal component
const DeleteModal = React.memo<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>(({ isOpen, onClose, onConfirm }) => {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Chat?</h3>
        <p className="text-gray-600 text-sm mb-6">
          This conversation will be deleted permanently.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteModal.displayName = 'DeleteModal';

interface ChatListViewProps {
  onChatSelect: (sessionId: string) => void;
  onCreateNew: () => void;
  userId?: string;
}

export const ChatListView: React.FC<ChatListViewProps> = ({
  onChatSelect,
  onCreateNew,
  userId
}) => {
  const messageStore = useSupabaseMessageStore(userId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Memoized date formatter to prevent recreation on every render
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Memoized message preview extractor
  const getLastMessagePreview = useCallback((session: ChatSessionWithMessages) => {
    const lastUserMessage = session.messages
      .filter((msg: any) => msg.isUser)
      .pop();
    
    if (lastUserMessage) {
      const preview = lastUserMessage.content.slice(0, 60);
      return preview + (lastUserMessage.content.length > 60 ? '...' : '');
    }
    return 'No messages yet';
  }, []);

  // Optimized search with debouncing and memoization
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return messageStore.sessions;
    }
    
    const query = searchQuery.toLowerCase();
    return messageStore.sessions.filter((session: ChatSessionWithMessages) => {
      // Search in title first (faster)
      if (session.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in message content (only if title doesn't match)
      return session.messages.some((message: any) => 
        message.content.toLowerCase().includes(query)
      );
    });
  }, [messageStore.sessions, searchQuery]);

  // Memoized event handlers
  const handleDeleteSession = useCallback((sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessionToDelete(sessionId);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (sessionToDelete) {
      try {
        await messageStore.deleteSession(sessionToDelete);
        setSessionToDelete(null);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  }, [sessionToDelete, messageStore]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleCreateNew = useCallback(() => {
    onCreateNew();
  }, [onCreateNew]);

  const handleChatSelect = useCallback((sessionId: string) => {
    onChatSelect(sessionId);
  }, [onChatSelect]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Chats with Nia</h1>
          </div>
          <button
            onClick={onCreateNew}
            className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-gray-200 transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 pb-20">
            <EmptyState searchQuery={searchQuery} onCreateNew={handleCreateNew} />
          </div>
        ) : (
          <div>
            {filteredSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onSelect={handleChatSelect}
                onDelete={handleDeleteSession}
                formatDate={formatDate}
                getLastMessagePreview={getLastMessagePreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};