'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useCreateModal } from '@/hooks/useCreateModal';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import CreateModal from '@/components/create/CreateModal';
import { Home01Icon, UserSharingIcon, PlusSignIcon, Book01Icon, PeerToPeer01FreeIcons, MeetingRoomIcon, VersusFreeIcons, VersusIcon, RankingIcon, Message01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { BotFreeIcons } from '@hugeicons/core-free-icons';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const createModal = useCreateModal();
  
  // Pages where the create button should be hidden
  const hiddenPages = ['/library', '/chats'];
  
  // Use scroll direction hook
  const { isVisible: isScrollVisible } = useScrollDirection({ 
    threshold: 15,
    hideOnPages: hiddenPages 
  });
  
  // Determine if create button should be shown
  const shouldShowCreateButton = useMemo(() => {
    // Hide on specific pages
    if (hiddenPages.some(page => pathname.startsWith(page))) {
      return false;
    }
    // Show based on scroll direction
    return isScrollVisible;
  }, [pathname, isScrollVisible]);
  
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
      name: 'AI',
      href: '/nia',
      icon: BotFreeIcons,
      isActive: pathname === '/nia'
    },
    {
      name: 'Library',
      href: '/library',
      icon: Book01Icon,
      isActive: pathname === '/library' || pathname.startsWith('/library/')
    },
    {
      name: 'Chats',
      href: '/chats',
      icon: Message01Icon,
      isActive: pathname === '/chats' || pathname.startsWith('/chats/')
    }
  ];

  // Close all modals function
  const closeAllModals = useCallback(() => {
    createModal.closeModal();
  }, [createModal]);

  // Handle navigation with modal closure
  const handleNavigation = useCallback((href: string) => {
    closeAllModals();
    router.push(href);
  }, [closeAllModals, router]);

  // Handle create click
  const handleCreateClick = useCallback(() => {
    closeAllModals();
    // Small delay to ensure modals are closed before opening new one
    setTimeout(() => {
      createModal.openPostModal();
    }, 50);
  }, [closeAllModals, createModal]);


  // Handle footer item click
  const handleFooterItemClick = useCallback((item: typeof navItems[0]) => {
    if (item.href) {
      handleNavigation(item.href);
    }
  }, [handleNavigation]);

  // Handle post created
  const handlePostCreated = useCallback(() => {
    console.log('Post created successfully!');
  }, []);

  // Handle space created
  const handleSpaceCreated = useCallback((space: any) => {
    console.log('Space created:', space);
  }, []);


  const handleCreateModalClose = useCallback(() => {
    createModal.closeModal();
  }, [createModal]);

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile Footer Navigation */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 z-40">
        {/* Floating Create Button */}
        <div 
          className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ease-in-out ${
            shouldShowCreateButton 
              ? 'opacity-100 transform translate-y-0 scale-100' 
              : 'opacity-0 transform translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <button
            onClick={handleCreateClick}
            className="bg-[#f23b36] text-white p-4 rounded-full shadow-lg hover:bg-[#e03530] transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:ring-opacity-50 hover:shadow-xl"
            aria-label="Create new post"
            disabled={!shouldShowCreateButton}
          >
            <HugeiconsIcon 
              icon={PlusSignIcon} 
              size={24} 
              color="currentColor" 
              strokeWidth={2} 
            />
          </button>
        </div>

        {/* Main Footer */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-5 py-4 px-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleFooterItemClick(item)}
                className={`flex flex-col items-center justify-center p-2 text-xs rounded-lg transition-all duration-200 ${
                  item.isActive
                    ? 'text-[#f23b36] bg-red-50'
                    : 'text-gray-600 hover:text-[#f23b36] hover:bg-gray-50 active:bg-gray-100'
                }`}
                aria-label={`Navigate to ${item.name}`}
              >
                <HugeiconsIcon 
                  icon={item.icon} 
                  size={24} 
                  color="currentColor" 
                  strokeWidth={1.5} 
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <CreateModal
        isOpen={createModal.isOpen}
        onClose={handleCreateModalClose}
        initialType={createModal.type}
        initialSpaceId={createModal.initialSpaceId}
        onPostCreated={handlePostCreated}
        onSpaceCreated={handleSpaceCreated}
      />
    </>
  );
};