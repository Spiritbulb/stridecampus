'use client';
import React from 'react';
import { User } from '@/utils/supabaseClient';
import { Users, Plus, TrendingUp, Clock, Trophy } from 'lucide-react';
import { useCreateModal } from '@/hooks/useCreateModal';
import CreateModal from '@/components/create/CreateModal';

interface FeedHeaderProps {
  user: User | null;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onPostCreated?: () => void;
  onSpaceCreated?: (space: any) => void;
}

export default function FeedHeader({ 
  user, 
  sortBy, 
  onSortChange,
  onPostCreated,
  onSpaceCreated
}: FeedHeaderProps) {
  const createModal = useCreateModal();

  const sortOptions = [
    { key: 'hot', label: 'Hot', icon: TrendingUp },
    { key: 'new', label: 'New', icon: Clock },
    { key: 'top', label: 'Top', icon: Trophy }
  ];

  const handlePostCreated = () => {
    console.log('Post created successfully!');
    onPostCreated?.();
  };

  const handleSpaceCreated = (space: any) => {
    console.log('Space created:', space);
    onSpaceCreated?.(space);
  };

  return (
    <div className="space-y-4 mb-6">
      {user && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white shadow-md">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-lg">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>

            {/* Create Post Button */}
            <button 
              onClick={() => createModal.openPostModal()}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl px-6 py-3 text-left transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm group"
            >
              <span className="text-base group-hover:text-gray-700">
                What's on your mind, {user.full_name?.split(' ')[0] || 'there'}?
              </span>
            </button>

            {/* Create Space Button */}
            <div className="flex gap-2">
              <button 
                onClick={() => createModal.openSpaceModal()}
                className="p-3 text-gray-500 hover:text-white hover:bg-blue-500 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-500 group"
                title="Create community"
              >
                <Users size={20} className="group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Sorting Options */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
        <div className="flex items-center">
          <div className="flex bg-gray-50 rounded-lg p-1 gap-1 w-full">
            {sortOptions.map(({ key, label, icon: Icon }) => (
              <button 
                key={key}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 justify-center
                  ${sortBy === key 
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
                onClick={() => onSortChange(key)}
              >
                <Icon size={16} className={sortBy === key ? 'text-blue-500' : ''} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optional: Quick stats or info bar */}
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>Latest posts</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live updates
        </span>
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