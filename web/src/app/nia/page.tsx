'use client';

import { useRouter } from 'next/navigation';
import { ChatContainer } from '@/components/layout/ai/ChatContainer';
import { Layout } from '@/components/layout/Layout';

export default function NiaPage() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="min-h-[90vh] bg-white">
      <div className="h-[90vh] flex flex-col">
        <ChatContainer 
          onClose={handleClose} 
          className="flex-1"
          initialView="list"
        />
      </div>
    </div>
  );
}
