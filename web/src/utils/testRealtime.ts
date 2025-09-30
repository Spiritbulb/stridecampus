// Test script to verify Supabase realtime is working
// Run this in browser console to test realtime subscriptions

import { supabase } from '@/utils/supabaseClient';

// Test realtime subscription
const testRealtime = () => {
  console.log('Testing Supabase realtime...');
  
  const channel = supabase
    .channel('test-messages')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, 
      (payload) => {
        console.log('✅ Realtime message received:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime subscription is working!');
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime subscription failed. Check if realtime is enabled for messages table.');
      }
    });

  return channel;
};

// Test presence
const testPresence = () => {
  console.log('Testing Supabase presence...');
  
  const channel = supabase.channel('test-presence');
  
  channel
    .on('presence', { event: 'sync' }, () => {
      console.log('✅ Presence sync working:', channel.presenceState());
    })
    .subscribe(async (status) => {
      console.log('Presence subscription status:', status);
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: 'test-user',
          online_at: new Date().toISOString()
        });
        console.log('✅ Presence tracking is working!');
      }
    });

  return channel;
};

export { testRealtime, testPresence };
