import React from 'react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

/**
 * Demo component showing the message store capabilities
 * This can be used for testing or as an admin panel
 */
export const MessageStoreDemo: React.FC = () => {
  const { user } = useApp();
  const chatSessions = useChatSessions(user?.id);

  const handleExport = () => {
    const data = chatSessions.exportAllChats();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nia-chats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const result = chatSessions.importChats(data);
          if (result.success) {
            alert(`Successfully imported ${result.imported} chats!`);
          } else {
            alert(`Import failed: ${result.error}`);
          }
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCleanup = () => {
    if (confirm('Delete chats older than 30 days? This cannot be undone.')) {
      const result = chatSessions.cleanupOldChats(30);
      alert(`Cleaned up ${result.cleaned} old chats`);
    }
  };

  const stats = chatSessions.getChatStats();
  const insights = chatSessions.getChatInsights();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Message Store Demo</h2>
        <div className="flex gap-2">
          <Button onClick={() => chatSessions.createAutoNamedChat()} variant="default">
            New Chat
          </Button>
          <Button onClick={handleExport} variant="outline">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Chats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChats}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <DocumentArrowDownIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Messages/Chat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageMessagesPerChat}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <TrashIcon className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Days Since Last Chat</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.daysSinceLastChat ?? 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Sessions List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Chat Sessions</h3>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-chats"
            />
            <label
              htmlFor="import-chats"
              className="cursor-pointer"
            >
              <Button variant="outline">
                <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                Import
              </Button>
            </label>
            <Button onClick={handleCleanup} variant="outline">
              <TrashIcon className="w-4 h-4 mr-2" />
              Cleanup Old
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {chatSessions.sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No chat sessions yet</p>
          ) : (
            chatSessions.sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{session.title}</h4>
                  <p className="text-sm text-gray-500">
                    {session.messageCount} messages • Updated {session.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {session.isActive && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Active
                    </span>
                  )}
                  <Button
                    onClick={() => chatSessions.switchToSession(session.id)}
                    variant="outline"
                    size="sm"
                  >
                    Switch
                  </Button>
                  <Button
                    onClick={() => chatSessions.deleteSession(session.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Chat Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Chat Frequency</p>
            <p className="text-lg font-semibold">{insights.chatFrequency.toFixed(1)} chats/day</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Engagement Level</p>
            <p className="text-lg font-semibold capitalize">{insights.chatRetention}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Longest Conversation</p>
            <p className="text-lg font-semibold">{insights.longestConversation} messages</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">User Activity</p>
            <p className="text-lg font-semibold">
              {insights.isActiveUser ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
