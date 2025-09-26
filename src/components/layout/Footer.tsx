'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useCreateModal } from '@/hooks/useCreateModal';
import CreateModal from '@/components/create/CreateModal';
import { Home01Icon, UserSharingIcon, PlusSignIcon, Book01Icon, PeerToPeer01FreeIcons, MeetingRoomIcon, VersusFreeIcons, VersusIcon, RankingIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { X, MessageCirclePlus } from 'lucide-react';
import { BotFreeIcons } from '@hugeicons/core-free-icons';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const createModal = useCreateModal();
  
  // Navigation items with icons
  const navItems = [
    {
      name: 'Spaces',
      href: '/spaces',
      icon: Home01Icon,
      isActive: pathname === '/spaces' || pathname.startsWith('/spaces/')
    },
    {
      name: 'Arena',
      href: '/arena',
      icon: RankingIcon,
      isActive: pathname === '/arena'
    },
    {
      name: 'Create',
      icon: PlusSignIcon,
      isActive: pathname === '/create' || pathname.startsWith('/create/'),
      isAction: true
    },
    {
      name: 'Library',
      href: '/library',
      icon: Book01Icon,
      isActive: pathname === '/library' || pathname.startsWith('/library/')
    }
  ];

  const handleCreateClick = () => {
    createModal.openPostModal();
  };

  const handlePostCreated = () => {
    console.log('Post created successfully!');
  };

  const handleSpaceCreated = (space: any) => {
    console.log('Space created:', space);
  };

  const router = useRouter();

  // AI Modal Component
  const AIModal = () => (
    <div className="fixed inset-0 z-50 bottom-18 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-50 transition-opacity"
        onClick={() => setIsAIModalOpen(false)}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ask Nia</h2>
          <button
            onClick={() => setIsAIModalOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Chat Area */}
        <div className="h-96 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-none p-3 max-w-[80%]">
                <p className="text-sm">Is there anything on your mind?</p>
              </div>
            </div>
            {/* Add more chat messages here */}
          </div>
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#f23b36]"
            />
            <button className="bg-[#f23b36] text-white rounded-full p-2 hover:bg-[#e03530] transition-colors">
              <MessageCirclePlus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Footer Navigation */}
      {user && (
        <div className="block md:hidden fixed bottom-0 left-0 right-0 z-40">
          {/* Floating AI Button */}
          <div className="absolute bottom-20 right-2 transform -translate-x-1/2 z-50">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="bg-[#f23b36] text-white p-4 rounded-full shadow-lg hover:bg-[#e03530] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <HugeiconsIcon icon={BotFreeIcons} size={24} color="currentColor" strokeWidth={1.5} />
            </button>
          </div>

          {/* Main Footer */}
          <div className="bg-white border-t border-gray-200">
            <div className="grid grid-cols-4 py-4">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => item.isAction ? handleCreateClick() : router.push(`${item.href}`)}
                    className={`flex flex-col items-center justify-center p-1 text-xs ${
                      item.isActive
                        ? 'text-[#f23b36]'
                        : 'text-gray-600 hover:text-[#f23b36]'
                    }`}
                  >
                    <HugeiconsIcon icon={item.icon} size={24} color="currentColor" strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAIModalOpen && <AIModal />}

      {/* Create Modal */}
      <CreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        initialType={createModal.type}
        initialSpaceId={createModal.initialSpaceId}
        onPostCreated={handlePostCreated}
        onSpaceCreated={handleSpaceCreated}
      />
    </>
  );
};