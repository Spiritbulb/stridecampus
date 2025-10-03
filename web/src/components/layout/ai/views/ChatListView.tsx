// ===========================
// ChatListView.tsx - Optimized list view
// ===========================
import React, { useState, useMemo, useCallback } from 'react';
import { ChatSessionWithMessages } from '@/hooks/useRealtimeSupabaseMessageStore';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

interface ChatListViewProps {
  messageStore: any; // ReturnType<typeof useRealtimeSupabaseMessageStore>
  onChatSelect: (sessionId: string) => void;
  onCreateNew: () => void;
}

// Memoized session item
const SessionItem = React.memo<{
  session: ChatSessionWithMessages;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string, event: React.MouseEvent) => void;
}>(({ session, onSelect, onDelete }) => {
  const formatDate = (dateString: string) => {
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
  };

  const getLastMessagePreview = () => {
    const lastUserMessage = session.messages
      .filter((msg: any) => msg.isUser)
      .pop();
    
    if (lastUserMessage) {
      const preview = lastUserMessage.content.slice(0, 60);
      return preview + (lastUserMessage.content.length > 60 ? '...' : '');
    }
    return 'No messages yet';
  };

  return (
    <div
      onClick={() => onSelect(session.id)}
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
              {getLastMessagePreview()}
            </p>
            <button
              onClick={(e) => onDelete(session.id, e)}
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

const EmptyState = React.memo<{
  searchQuery: string;
  onCreateNew: () => void;
}>(({ searchQuery, onCreateNew }) => {
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
        onClick={onCreateNew}
        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full transition-colors"
      >
        Start Chatting
      </button>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

const DeleteModal = React.memo<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>(({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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
            onClick={onConfirm}
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

export const ChatListView: React.FC<ChatListViewProps> = ({
  messageStore,
  onChatSelect,
  onCreateNew
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Optimized search with memoization
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return messageStore.sessions;
    }
    
    const query = searchQuery.toLowerCase();
    return messageStore.sessions.filter((session: ChatSessionWithMessages) => {
      if (session.title.toLowerCase().includes(query)) {
        return true;
      }
      
      return session.messages.some((message: any) => 
        message.content.toLowerCase().includes(query)
      );
    });
  }, [messageStore.sessions, searchQuery]);

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

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">Chats with Nia</h1>
            {messageStore.isRealtimeConnected && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Live</span>
              </div>
            )}
          </div>
          <button
            onClick={onCreateNew}
            className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-gray-200 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 pb-20">
            <EmptyState searchQuery={searchQuery} onCreateNew={onCreateNew} />
          </div>
        ) : (
          <div>
            {filteredSessions.map((session: ChatSessionWithMessages) => (
              <SessionItem
                key={session.id}
                session={session}
                onSelect={onChatSelect}
                onDelete={handleDeleteSession}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
