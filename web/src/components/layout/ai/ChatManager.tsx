import React, { useState } from 'react';
import { useRealtimeSupabaseMessageStore, ChatSessionWithMessages } from '@/hooks/useRealtimeSupabaseMessageStore';
import { Message } from './types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { 
  PlusIcon, 
  TrashIcon, 
  ChatBubbleLeftIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ChatManagerProps {
  onSessionSelect: (sessionId: string) => void;
  activeSessionId: string | null;
  onCreateNew: () => void;
  className?: string;
}

export const ChatManager: React.FC<ChatManagerProps> = ({
  onSessionSelect,
  activeSessionId,
  onCreateNew,
  className = ''
}) => {
  const { user } = useApp();
  const { sessions, stats, deleteSession, clearAllSessions, isRealtimeConnected } = useRealtimeSupabaseMessageStore(user?.id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessionToDelete(sessionId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete);
      setSessionToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleClearAll = () => {
    clearAllSessions();
    setShowClearModal(false);
  };

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

  return (
    <>
      <div className={`bg-gray-50 border-r border-gray-200 h-full flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
              {isRealtimeConnected && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </div>
            <Button
              onClick={onCreateNew}
              size="sm"
              variant="default"
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Chat
            </Button>
          </div>
          
          {/* Stats */}
          <div className="text-sm text-gray-600">
            {stats.totalSessions} chats • {stats.totalMessages} messages
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <ChatBubbleLeftIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat history yet</p>
              <p className="text-xs mt-1">Start a new conversation with Nia!</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSessionSelect(session.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${
                    activeSessionId === session.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatDate(session.updated_at)}</span>
                        <span>•</span>
                        <span>{session.message_count} messages</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-600 transition-all"
                      title="Delete chat"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Active indicator */}
                  {activeSessionId === session.id && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={() => setShowClearModal(true)}
              variant="ghost"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All Chats
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this chat? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Modal */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Chats</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mb-4">
            Are you sure you want to clear all chat history? This will permanently delete all your conversations with Nia.
          </p>
          <DialogFooter>
            <Button
              onClick={() => setShowClearModal(false)}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearAll}
              variant="destructive"
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
