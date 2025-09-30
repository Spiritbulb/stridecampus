import React, { useState } from 'react';
import { ChatContainer } from './ChatContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Demo component showing the different chat views
 */
export const ChatViewDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [demoView, setDemoView] = useState<'list' | 'chat'>('list');

  if (!showDemo) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Chat Views Demo</h3>
        <p className="text-gray-600 mb-4">
          Experience the new chat interface with different views for better UX:
        </p>
        <ul className="text-sm text-gray-600 space-y-2 mb-4">
          <li>• <strong>Chat List View:</strong> Browse and search your conversations</li>
          <li>• <strong>Active Chat View:</strong> Focused conversation with full context</li>
          <li>• <strong>AI Context:</strong> Nia remembers the entire conversation</li>
          <li>• <strong>Session Management:</strong> Switch between chats seamlessly</li>
        </ul>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setDemoView('list');
              setShowDemo(true);
            }}
            variant="outline"
            className="flex-1"
          >
            Start with List View
          </Button>
          <Button 
            onClick={() => {
              setDemoView('chat');
              setShowDemo(true);
            }}
            variant="default"
            className="flex-1"
          >
            Start with Chat View
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-screen border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-2 flex items-center justify-between">
        <h3 className="font-medium">Chat Views Demo</h3>
        <Button 
          onClick={() => setShowDemo(false)}
          variant="ghost"
          size="sm"
        >
          Exit Demo
        </Button>
      </div>
      <ChatContainer 
        className="h-full"
        initialView={demoView}
      />
    </div>
  );
};
