'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { User, Space, Post } from '@/utils/supabaseClient';
import { useFeedData } from '@/hooks/useFeedData';
import FeedSidebar from '@/components/feed/main/FeedSidebar';
import PostCard from '@/components/feed/main/PostCard'; // Assuming you have a PostCard component
import { usePostActions } from '@/hooks/usePostActions';
import { useMemberCounts } from '@/components/feed/main/deps/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Filter, TrendingUp, Clock, Users } from 'lucide-react';

export default function SpacePage() {
  const params = useParams();
  const slug = params.slug as string;
  const user = useAuth().user
  const [sortBy, setSortBy] = useState<'new' | 'hot'>('new');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>();
  
  // Use the hook to fetch data
  const { posts, spaces, isLoading, refetch } = useFeedData(slug, sortBy, user);
  const { memberCounts } = useMemberCounts(spaces);
  
  // Find the current space details
  const currentSpace = spaces.find(space => space.id === slug);
  
    const { handleVote, handleShare, joinSpace } = usePostActions(user, refetch);
    const selectPost = useCallback((post: Post | null) => {
        setSelectedPost(post);
      }, []);
  
  const handleCreateSpace = () => {
    setShowCreateModal(true);
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
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center">
                <Users size={16} className="mr-1" />
                {/* You would need to implement member count for this specific space */}
                {memberCounts[currentSpace.id]} members
              </span>
              <span>•</span>
              <span>
                {currentSpace.is_public ? 'Public' : 'Private'} space
              </span>
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
      
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Create Post & Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Posts</h2>
              
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
        </div>
        
        {/* Sidebar */}
        <div className="lg:w-80">
          <FeedSidebar 
            spaces={spaces} 
            onJoinSpace={joinSpace}
            user={user}
            onCreateSpace={handleCreateSpace}
          />
        </div>
      </div>
    </div>
  );
}