'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useCreateModal } from '@/hooks/useCreateModal';
import CreateModal from '@/components/create/CreateModal';
import { Home01Icon, UserSharingIcon, PlusSignIcon, Book01Icon, PeerToPeer01FreeIcons, MeetingRoomIcon, VersusFreeIcons, VersusIcon, RankingIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AIModal } from './ai';
import { BotFreeIcons } from '@hugeicons/core-free-icons';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const createModal = useCreateModal();
  
  // Navigation items with icons - AI button is now in the tab layout
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
      name: 'AI',
      icon: BotFreeIcons,
      isActive: false,
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

  const handleAIClick = () => {
    setIsAIModalOpen(true);
  };

  const handlePostCreated = () => {
    console.log('Post created successfully!');
  };

  const handleSpaceCreated = (space: any) => {
    console.log('Space created:', space);
  };

  const router = useRouter();

  return (
    <>
      {/* Mobile Footer Navigation */}
      {user && (
        <div className="block md:hidden fixed bottom-0 left-0 right-0 z-40">
          {/* Floating Create Button */}
          <div className="absolute bottom-20 right-2 transform -translate-x-1/2 z-50">
            <button
              onClick={handleCreateClick}
              className="bg-[#f23b36] text-white p-4 rounded-full shadow-lg hover:bg-[#e03530] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={24} color="currentColor" strokeWidth={1.5} />
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
                    onClick={() => item.name === 'AI' ? handleAIClick() : (item.isAction ? handleCreateClick() : router.push(`${item.href}`))}
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
      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />

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