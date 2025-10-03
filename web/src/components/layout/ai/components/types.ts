export interface Message {
  id?: string;
  content: string;
  isUser: boolean;
  timestamp?: Date;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
}

export interface MessageStore {
  activeSession: ChatSession | null;
  isInitialized: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<string | null>;
  updateMessage: (messageId: string, content: string) => void;
  createSession: () => Promise<ChatSession>;
  getSessionById: (sessionId: string) => Promise<ChatSession | null>;
}

export interface ChatHook {
  messages: Message[];
  inputMessage: string;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  updateInputMessage: (message: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<string | null>;
  clearMessages: () => void;
  messageStore: MessageStore;
  currentSessionId?: string;
}

