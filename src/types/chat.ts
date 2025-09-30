export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

export interface OnlineUser {
  userId: string;
  username: string;
  lastSeen: string;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

export interface ChatParticipant {
  user_id: string;
  users: {
    id: string;
    full_name: string;
    avatar_url: string;
    username: string;
  };
}

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  last_message_at: string;
  participants: ChatParticipant[];
  unread_count?: number;
}

export interface MessageSender {
  id: string;
  full_name: string;
  avatar_url: string;
  username: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  message_type: string;
  created_at: string;
  read_by_receiver: boolean;
  sender: MessageSender;
}

export interface ChatPageProps {
  username?: string;
}

export interface ChatHeaderProps {
  otherParticipant: ChatParticipant | null;
  onBackToChats: () => void;
  onViewProfile: (username: string) => void;
  isMobile?: boolean;
  onlineUsers?: OnlineUser[];
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  messagesEndRef: React.RefObject<any>;
  typingUsers?: TypingUser[];
}

export interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export interface UserSearchScreenProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: User[];
  searchLoading: boolean;
  onStartChat: (user: User) => void;
  onBackToChats: () => void;
  isMobile?: boolean;
}

export interface ChatsListProps {
  chats: Chat[];
  activeChat: Chat | null;
  currentUserId: string;
  loading: boolean;
  isInitialized: boolean;
  onSelectChat: (chat: Chat) => void;
  onStartNewChat: () => void;
  isMobile?: boolean;
}
