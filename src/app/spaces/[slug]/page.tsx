'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { User, Space, Post } from '@/utils/supabaseClient';
import { useFeedData } from '@/hooks/useFeedData';
import { usePostActions } from '@/hooks/usePostActions';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import PostCard from '@/components/feed/main/PostCard'; // Assuming you have a PostCard component
import { useMemberCounts } from '@/components/feed/main/deps/sidebar';
import { useApp } from '@/contexts/AppContext';
import SpaceManagement from '@/components/spaces/SpaceManagement';
import SpaceSettings from '@/components/spaces/SpaceSettings';
import { Plus, Filter, TrendingUp, Clock, Users, Settings, Crown, Shield, User as UserIcon } from 'lucide-react';

export default function SpacePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useApp()
  const [sortBy, setSortBy] = useState<'new' | 'hot'>('new');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>();
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'settings'>('posts');
  
  // Use the hook to fetch data
  const { posts, spaces, isLoading, refetch } = useFeedData(slug, sortBy, user);
  const { memberCounts, postCounts } = useMemberCounts(spaces);
  
  // Find the current space details
  const currentSpace = spaces.find(space => space.id === slug);
  
  const { handleVote, handleShare, joinSpace } = usePostActions(user, refetch);
  const selectPost = useCallback((post: Post | null) => {
    setSelectedPost(post);
  }, []);

  // Refresh function for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Register refresh function for pull-to-refresh
  usePageRefresh(handleRefresh);
  
  const handleCreateSpace = () => {
    setShowCreateModal(true);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'member':
        return <UserIcon className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Admin</span>;
      case 'moderator':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Moderator</span>;
      case 'member':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Member</span>;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!currentSpace) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Space not found</h1>
          <p className="text-gray-600">The space you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Space Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            {currentSpace.logo_url && (
              <img 
                src={currentSpace.logo_url} 
                alt={currentSpace.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentSpace.display_name}</h1>
              <p className="text-gray-600">{currentSpace.description}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Users size={16} className="mr-1" />
                {memberCounts[currentSpace.id] || 0} members
              </span>
              <span>•</span>
              <span>{postCounts[currentSpace.id] || 0} posts</span>
              <span>•</span>
              <span>
                {currentSpace.is_public ? 'Public' : 'Private'} space
              </span>
              {currentSpace.user_role && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(currentSpace.user_role)}
                    {getRoleBadge(currentSpace.user_role)}
                  </div>
                </>
              )}
            </div>
            
            {user && !currentSpace.user_role && currentSpace.is_public && (
              <button
                onClick={() => joinSpace(currentSpace.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Join Space
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'posts', label: 'Posts', icon: TrendingUp },
              { key: 'members', label: 'Members', icon: Users },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Posts</h2>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSortBy(sortBy === 'new' ? 'hot' : 'new')}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  {sortBy === 'new' ? (
                    <>
                      <Clock size={16} className="mr-1" />
                      New
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} className="mr-1" />
                      Hot
                    </>
                  )}
                </button>
                
                {user && currentSpace.user_role && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    Create Post
                  </button>
                )}
              </div>
            </div>
            
            {/* Posts List */}
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} user={user} onSelect={selectPost} onShare={handleShare} onVote={handleVote}/>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No posts yet in this space.</p>
                {user && currentSpace.user_role && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Be the first to post!
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <SpaceManagement 
            spaceId={currentSpace.id}
            currentUserRole={currentSpace.user_role}
            onMemberUpdate={refetch}
          />
        )}

        {activeTab === 'settings' && (
          <SpaceSettings 
            space={currentSpace}
            currentUserRole={currentSpace.user_role}
            onSpaceUpdate={(updatedSpace) => {
              // Update the space in the local state
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}