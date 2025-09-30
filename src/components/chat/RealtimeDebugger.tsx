import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

const RealtimeDebugger: React.FC = () => {
  const [status, setStatus] = useState<string>('Not connected');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    console.log('Setting up debug realtime subscription...');
    
    const channel = supabase
      .channel('debug-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        (payload) => {
          console.log('Debug: New message received:', payload);
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe((status) => {
        console.log('Debug subscription status:', status);
        setStatus(status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Realtime Debug</h3>
      <p className="text-xs mb-2">Status: <span className={status === 'SUBSCRIBED' ? 'text-green-600' : 'text-red-600'}>{status}</span></p>
      <p className="text-xs mb-2">Messages received: {messages.length}</p>
      {messages.length > 0 && (
        <div className="text-xs">
          <p>Latest message:</p>
          <p className="bg-gray-100 p-1 rounded text-xs break-all">
            {messages[messages.length - 1]?.message || 'No message'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RealtimeDebugger;
