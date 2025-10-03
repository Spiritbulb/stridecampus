# AI Chat Realtime Setup Guide

This guide explains how to set up realtime subscriptions for AI chat sessions and messages in your Stride Campus application.

## 🚀 Quick Setup

### 1. Enable Realtime in Database

Run the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste contents from database/enable_ai_chat_realtime.sql
```

This enables realtime for:
- `ai_chat_sessions` table
- `ai_chat_messages` table

### 2. Set up RLS Policies

Run the RLS policies script in your Supabase SQL Editor:

```sql
-- Copy and paste contents from database/ai_chat_rls_policies.sql
```

This ensures proper Row Level Security for AI chat data.

## 📡 Available Hooks

### `useRealtimeAIChats`

Core hook for AI chat realtime events:

```typescript
import { useRealtimeAIChats } from '@/hooks/useRealtimeAIChats';

const { isConnected, connectionStatus } = useRealtimeAIChats({
  sessionId: 'optional-session-id', // Filter to specific session
  onSessionCreated: (session) => {
    console.log('New AI chat session:', session);
    // Handle new session creation
  },
  onSessionUpdated: (session) => {
    console.log('AI chat session updated:', session);
    // Handle session updates (title, active status, etc.)
  },
  onSessionDeleted: (sessionId) => {
    console.log('AI chat session deleted:', sessionId);
    // Handle session deletion
  },
  onMessageCreated: (message) => {
    console.log('New AI message:', message);
    // Handle new messages (both user and AI)
  },
  onMessageUpdated: (message) => {
    console.log('AI message updated:', message);
    // Handle message updates (useful for streaming responses)
  },
  onMessageDeleted: (messageId) => {
    console.log('AI message deleted:', messageId);
    // Handle message deletion
  },
  onActiveSessionChanged: (sessionId) => {
    console.log('Active session changed:', sessionId);
    // Handle active session switching
  }
});
```

### `useRealtimeSupabaseMessageStore`

Enhanced message store with realtime capabilities:

```typescript
import { useRealtimeSupabaseMessageStore } from '@/hooks/useRealtimeSupabaseMessageStore';

const {
  // State
  sessions,
  activeSession,
  isLoading,
  isInitialized,
  isRealtimeConnected, // NEW: Realtime connection status
  stats,
  
  // Actions (same as before, but now with realtime updates)
  createSession,
  switchToSession,
  addMessage,
  updateMessage,
  deleteSession,
  clearAllSessions,
  
  // Utilities
  getSessionById,
  getSessions,
  getActiveSession,
} = useRealtimeSupabaseMessageStore(user?.id);
```

## 🔧 Component Updates

The following components have been updated to use realtime:

### Updated Components:
- `ChatListView.tsx` - Real-time session list updates
- `ChatContainer.tsx` - Real-time session management
- `ChatManager.tsx` - Real-time chat history

### New Features:
- ✅ **Live connection indicators** - Shows when realtime is connected
- ✅ **Instant session updates** - New chats appear immediately
- ✅ **Real-time message streaming** - Messages update as they're typed/generated
- ✅ **Active session synchronization** - Session switching syncs across tabs
- ✅ **Automatic cleanup** - Deleted sessions disappear immediately

## 🎯 Realtime Features

### Session Management
- ✅ **Session Creation** - New chat sessions appear instantly
- ✅ **Session Updates** - Title changes, active status updates
- ✅ **Session Deletion** - Deleted sessions disappear immediately
- ✅ **Active Session Sync** - Active session changes sync across tabs

### Message Handling
- ✅ **Message Creation** - New messages appear instantly
- ✅ **Message Updates** - Perfect for streaming AI responses
- ✅ **Message Deletion** - Deleted messages disappear immediately
- ✅ **Message Ordering** - Messages maintain proper chronological order

### Multi-Tab Synchronization
- ✅ **Cross-tab session sync** - Sessions stay in sync across browser tabs
- ✅ **Active session sync** - Switching sessions updates all tabs
- ✅ **Real-time message sync** - Messages appear in all open tabs
- ✅ **Connection status sync** - Connection indicators work across tabs

## 🔍 Visual Indicators

### Connection Status
Components now show live connection status:

```tsx
{isRealtimeConnected && (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    <span className="text-xs text-green-600">Live</span>
  </div>
)}
```

### Connection States
- 🔴 **Disconnected** - No indicator shown
- 🟡 **Connecting** - Loading state (if implemented)
- 🟢 **Connected** - Green pulsing dot with "Live" text

## 🐛 Troubleshooting

### Common Issues

1. **Realtime Not Working**
   ```sql
   -- Verify tables are added to realtime publication
   SELECT schemaname, tablename, hasrealtime 
   FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename IN ('ai_chat_sessions', 'ai_chat_messages');
   ```

2. **RLS Policy Issues**
   ```sql
   -- Check if policies exist
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE tablename IN ('ai_chat_sessions', 'ai_chat_messages');
   ```

3. **Connection Issues**
   - Check browser console for connection errors
   - Verify user authentication
   - Check Supabase project settings

### Debug Tools

Enable debug logging by checking browser console for:
- `🔌 Setting up AI chat realtime subscriptions`
- `📡 AI chat subscription status`
- `🔄 Realtime: Session/Message created/updated/deleted`
- `❌ AI chat realtime subscription failed`

## 📊 Performance Optimizations

### Caching
- ✅ **Session caching** - Reduces database queries
- ✅ **Message caching** - Improves load times
- ✅ **Automatic cache invalidation** - Keeps data fresh

### Efficient Queries
- ✅ **Batch message loading** - Load all messages in single query
- ✅ **Filtered subscriptions** - Only subscribe to relevant data
- ✅ **Optimized indexes** - Fast query performance

### Memory Management
- ✅ **Automatic cleanup** - Subscriptions cleaned up on unmount
- ✅ **Cache expiration** - Prevents memory leaks
- ✅ **Connection pooling** - Efficient resource usage

## 🔐 Security

### Row Level Security
All realtime subscriptions respect RLS policies:
- Users can only see their own chat sessions
- Users can only see messages from their own sessions
- All operations require proper authentication

### Data Privacy
- ✅ **User isolation** - Users can't see other users' chats
- ✅ **Session isolation** - Messages are scoped to sessions
- ✅ **Secure subscriptions** - All realtime data is filtered by user

## 🚀 Usage Examples

### Basic Implementation
```tsx
import { useRealtimeSupabaseMessageStore } from '@/hooks/useRealtimeSupabaseMessageStore';

function ChatComponent({ userId }) {
  const {
    sessions,
    activeSession,
    isRealtimeConnected,
    createSession,
    addMessage
  } = useRealtimeSupabaseMessageStore(userId);

  return (
    <div>
      {isRealtimeConnected && <div>🟢 Live</div>}
      {/* Your chat UI */}
    </div>
  );
}
```

### Advanced Usage with Custom Handlers
```tsx
import { useRealtimeAIChats } from '@/hooks/useRealtimeAIChats';

function AdvancedChatComponent() {
  const { isConnected } = useRealtimeAIChats({
    onMessageCreated: (message) => {
      // Custom handling for new messages
      if (!message.is_user) {
        // Handle AI response
        playNotificationSound();
      }
    },
    onSessionUpdated: (session) => {
      // Custom handling for session updates
      if (session.is_active) {
        updateActiveSessionInUI(session);
      }
    }
  });

  return <div>{/* Your advanced chat UI */}</div>;
}
```

## 🎉 Next Steps

1. **Run the database setup scripts**
2. **Update your components** to use the realtime hooks
3. **Test realtime functionality** across multiple browser tabs
4. **Monitor connection status** and handle offline scenarios
5. **Implement error handling** for connection failures

Your AI chat system now provides a seamless, real-time experience with instant updates across all connected clients! 🚀

