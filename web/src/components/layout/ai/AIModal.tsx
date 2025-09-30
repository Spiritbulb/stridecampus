import { ChatContainer } from './ChatContainer';
import { AIModalProps } from './types';

export default function AIModal({ isOpen, onClose }: AIModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ top: '64px', bottom: '64px' }}>
      <ChatContainer onClose={onClose} className="h-[80vh]" />
    </div>
  );
}