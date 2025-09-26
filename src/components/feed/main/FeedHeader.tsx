'use client';
import React, { useRef, useEffect, useState } from 'react';
import { User } from '@/utils/supabaseClient';
import { useCreateModal } from '@/hooks/useCreateModal';
import CreateModal from '@/components/create/CreateModal';

interface FeedHeaderProps {
  user: User | null;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onPostCreated?: () => void;
  onSpaceCreated?: (space: any) => void;
  spaces?: Array<{ id: string; display_name: string; member_count?: number }>;
  selectedSpace?: string;
  onSpaceChange?: (spaceId: string) => void;
}

export default function FeedHeader({
  user,
  sortBy,
  onSortChange,
  onPostCreated,
  onSpaceCreated,
  spaces = [],
  selectedSpace = 'all',
  onSpaceChange
}: FeedHeaderProps) {
  const createModal = useCreateModal();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // Main navigation options (like Twitter's For You/Following)
  const mainTabs = [
    { key: 'all', label: 'For you' },
    { key: 'following', label: 'Following' }
  ];

  // Check scroll shadows
  const updateScrollShadows = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftShadow(scrollLeft > 0);
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateScrollShadows();
      container.addEventListener('scroll', updateScrollShadows);
      return () => container.removeEventListener('scroll', updateScrollShadows);
    }
  }, [spaces]);

  useEffect(() => {
    updateScrollShadows();
  }, [spaces]);

  const handleTabClick = (key: string) => {
    if (mainTabs.some(tab => tab.key === key)) {
      onSortChange?.(key);
    } else {
      onSpaceChange?.(key);
    }
  };

  const handlePostCreated = () => {
    console.log('Post created successfully!');
    onPostCreated?.();
  };

  const handleSpaceCreated = (space: any) => {
    console.log('Space created:', space);
    onSpaceCreated?.(space);
  };

  // Determine active tab
  const getActiveTab = () => {
    if (mainTabs.some(tab => tab.key === sortBy)) {
      return sortBy;
    }
    return selectedSpace;
  };

  const activeTab = getActiveTab();

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 mb-5">
      <div className="relative">
        {/* Left shadow */}
        {showLeftShadow && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Right shadow */}
        {showRightShadow && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable tab container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide px-4 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Main tabs (For you, Following) */}
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`
                flex-shrink-0 px-4 py-2 mr-6 text-[15px] font-medium transition-all duration-200 relative
                ${activeTab === tab.key
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
              {/* Active indicator */}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f23b36] rounded-full" />
              )}
            </button>
          ))}

          {/* Separator */}
          {spaces.length > 0 && (
            <div className="flex-shrink-0 w-px h-8 bg-gray-200 mr-6 self-center" />
          )}

          {/* Community spaces */}
          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => handleTabClick(space.id)}
              className={`
                flex-shrink-0 px-4 py-2 mr-6 text-[15px] font-medium transition-all duration-200 relative whitespace-nowrap
                ${activeTab === space.id
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {space.display_name}
                {space.member_count && (
                  <span className="text-xs text-gray-400 font-normal">
                    {space.member_count}
                  </span>
                )}
              </span>
              {/* Active indicator */}
              {activeTab === space.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f23b36] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <CreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        initialType={createModal.type}
        initialSpaceId={createModal.initialSpaceId}
        onPostCreated={handlePostCreated}
        onSpaceCreated={handleSpaceCreated}
      />
    </div>
  );
}