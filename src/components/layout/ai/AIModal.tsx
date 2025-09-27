import { useRef, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { Header } from './Header';
import { WelcomeMessage } from './WelcomeMessage';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { AIModalProps } from './types';

export default function AIModal({ isOpen, onClose }: AIModalProps) {
  const { messages, inputMessage, isLoading, sendMessage, updateInputMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ top: '64px', bottom: '64px' }}>
      <Header onClose={onClose} />
      
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
  );
}