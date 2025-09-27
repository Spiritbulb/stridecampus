export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ChatState {
  messages: Message[];
  inputMessage: string;
  isLoading: boolean;
}