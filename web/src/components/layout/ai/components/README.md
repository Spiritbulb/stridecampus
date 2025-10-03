# ActiveChatView Components

This directory contains the modularized components extracted from the original `ActiveChatView.tsx` file. The refactoring improves maintainability, reusability, and performance.

## Components Overview

### Core Components

#### `ChatHeader`
- **Purpose**: Displays the chat title, back button, and menu toggle
- **Props**: `title`, `onBack`, `onMenuToggle`, `showMenu`, `className`
- **Features**: Accessible buttons with proper ARIA labels, responsive design

#### `ChatMenu`
- **Purpose**: Dropdown menu with share and new chat options
- **Props**: `isOpen`, `onShare`, `onNewChat`, `onClose`, `className`
- **Features**: Click-outside-to-close functionality, smooth transitions

#### `MessageArea`
- **Purpose**: Container for displaying messages with empty state handling
- **Props**: `messages`, `isLoading`, `emptyStateTitle`, `emptyStateSubtitle`, `className`
- **Features**: Automatic empty state display, loading indicator integration

#### `SimpleMessageBubble`
- **Purpose**: Individual message display component
- **Props**: `message`, `className`
- **Features**: User/AI message styling, responsive design

#### `SimpleTypingIndicator`
- **Purpose**: Animated typing indicator for AI responses
- **Props**: `className`
- **Features**: Smooth bounce animation, consistent styling

#### `EmptyState`
- **Purpose**: Placeholder content when no messages exist
- **Props**: `title`, `subtitle`, `icon`, `className`
- **Features**: Customizable content, default icon support

## Type Definitions

### `Message`
```typescript
interface Message {
  id?: string;
  content: string;
  isUser: boolean;
  timestamp?: Date;
  created_at?: string;
}
```

### `ChatSession`
```typescript
interface ChatSession {
  id: string;
  title?: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
}
```

### `MessageStore`
```typescript
interface MessageStore {
  activeSession: ChatSession | null;
  isInitialized: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<string | null>;
  updateMessage: (messageId: string, content: string) => void;
  createSession: () => Promise<ChatSession>;
  getSessionById: (sessionId: string) => Promise<ChatSession | null>;
}
```

## Performance Optimizations

1. **useCallback**: All event handlers are memoized to prevent unnecessary re-renders
2. **useMemo**: Message transformation is memoized for better performance
3. **Component Separation**: Smaller components reduce re-render scope
4. **Proper TypeScript**: Strong typing prevents runtime errors and improves IDE support

## Usage Example

```tsx
import { ActiveChatView } from './views/ActiveChatView';
import { useSupabaseMessageStore } from '@/hooks/useSupabaseMessageStore';

function ChatInterface({ sessionId }: { sessionId: string }) {
  const messageStore = useSupabaseMessageStore(userId);
  
  return (
    <ActiveChatView
      sessionId={sessionId}
      messageStore={messageStore}
      onBack={() => navigate('/chats')}
      onNewChat={() => createNewChat()}
    />
  );
}
```

## Benefits of Modularization

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be used in other parts of the application
3. **Testability**: Smaller components are easier to unit test
4. **Performance**: Reduced re-render scope and better memoization
5. **Developer Experience**: Better IntelliSense and type safety
6. **Accessibility**: Proper ARIA labels and keyboard navigation

## File Structure

```
components/
├── ChatHeader.tsx          # Header with title and menu button
├── ChatMenu.tsx           # Dropdown menu component
├── EmptyState.tsx         # Empty state placeholder
├── MessageArea.tsx        # Messages container
├── SimpleMessageBubble.tsx # Individual message component
├── SimpleTypingIndicator.tsx # Loading animation
├── types.ts              # Shared TypeScript interfaces
├── index.ts              # Component exports
└── README.md             # This documentation
```

