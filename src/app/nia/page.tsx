'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/components/layout/ai/hooks/useChat';
import { Header } from '@/components/layout/ai/Header';
import { WelcomeMessage } from '@/components/layout/ai/WelcomeMessage';
import { MessageList } from '@/components/layout/ai/MessageList';
import { InputArea } from '@/components/layout/ai/InputArea';
import { Layout } from '@/components/layout/Layout';

export default function NiaPage() {
  const { messages, inputMessage, isLoading, sendMessage, updateInputMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClose = () => {
    router.back();
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-white">
        <Header onClose={handleClose} />
        
        {messages.length === 0 && !isLoading ? (
          <WelcomeMessage />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
        
        <InputArea
          value={inputMessage}
          onChange={updateInputMessage}
          onSend={sendMessage}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </Layout>
  );
}
