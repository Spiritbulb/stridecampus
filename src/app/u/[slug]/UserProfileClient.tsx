'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import PostsList from '@/components/feed/main/ProfilePostsList';
import { usePostActions } from '@/hooks/usePostActions';
import { Post, User, Notification } from '@/utils/supabaseClient';
import { fetchProfileData } from './server';
import { supabase } from '@/utils/supabaseClient';
import { Calendar, MapPin, Link as LinkIcon, MoreHorizontal, Plus, User2, Camera, X } from 'lucide-react';
import PostCard from '@/components/feed/main/ProfilePostCard';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Message01Icon } from '@hugeicons/core-free-icons';

interface ProfileData {
  user: User;
  posts: Post[];
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing?: boolean;
}

interface UserProfileClientProps {
  profileData: ProfileData | null;
}

export default function UserProfileClient({ profileData: initialProfileData }: UserProfileClientProps) {
  // Use AppContext for all auth state and navigation
  const { 
    user: currentUser, 
    isLoading: appIsLoading, 
    currentScreen, 
    handleNavigateToAuth, 
    isAuthenticated 
  } = useApp();

  const [profileData, setProfileData] = useState(initialProfileData);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'resources'>('posts');
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    school_name: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  // Chat functionality
  const handleStartChat = useCallback(() => {
    if (!isAuthenticated) {
      handleNavigateToAuth();
      return;
    }
    
    if (profileData) {
      router.push(`/chats?username=${profileData.user.username}`);
    }
  }, [isAuthenticated, handleNavigateToAuth, profileData, router]);

  const openCreatePost = useCallback(() => {
    router.push('/create?type=post');
  }, [router]);

  const openCreateSpace = useCallback(() => {
    router.push('/create?type=space');
  }, [router]);

  // Redirect to auth if not authenticated and trying to access auth-required features
  useEffect(() => {
    // Only redirect if app has finished loading and user is definitely not authenticated
    // Allow viewing profiles without authentication, but some features won't be available
    if (!appIsLoading && !isAuthenticated && (isEditModalOpen || isFollowLoading)) {
      handleNavigateToAuth();
    }
  }, [appIsLoading, isAuthenticated, handleNavigateToAuth, isEditModalOpen, isFollowLoading]);

  // Initialize form data when profile data changes
  useEffect(() => {
    if (profileData) {
      setEditFormData({
        full_name: profileData.user.full_name || '',
        username: profileData.user.username || '',
        bio: profileData.user.bio || '',
        school_name: profileData.user.school_name || '',
      });
      setAvatarPreview(profileData.user.avatar_url || '');
      setBannerPreview(profileData.user.banner_url || '');
    }
  }, [profileData]);

  // Initialize and sync server data with client state
  useEffect(() => {
    if (initialProfileData && !isInitialized) {
      setProfileData(initialProfileData);
      setIsInitialized(true);
    }
  }, [initialProfileData, isInitialized]);

  // Refetch follow status when current user changes
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser || !profileData || currentUser.id === profileData.user.id) {
        return;
      }

      try {
        const { data: followData, error } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', currentUser.id)
          .eq('followed_id', profileData.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking follow status:', error);
          return;
        }

        const isFollowing = !!followData;
        
        setProfileData(prev => prev ? {
          ...prev,
          isFollowing
        } : null);
      } catch (error) {
        console.error('Error in follow status check:', error);
      }
    };

    if (isInitialized && currentUser && profileData && isAuthenticated) {
      checkFollowStatus();
    }
  }, [currentUser, isInitialized, profileData?.user.id, isAuthenticated]);

  const pinnedPost = useMemo(() => {
    if (!profileData) return null;
    return profileData.posts.find(post => post.pinned);
  }, [profileData]);

  const notifyUser = useCallback(async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    if (!isAuthenticated) return;
    
    const { error } = await supabase.from('notifications').insert(notification);
    if (error) {
      console.error('Error notifying user:', error);
    }
  }, [isAuthenticated]);

  const handlePinToggle = useCallback(async () => {
    if (!currentUser || !profileData || !pinnedPost || !isAuthenticated) return;

    const { error } = await supabase
      .from('posts')
      .update({ pinned: !pinnedPost.pinned })
      .eq('id', pinnedPost.id);

    if (error) {
      console.error('Error updating pinned status:', error);
    } else {
      setProfileData(prev => prev ? {
        ...prev,
        posts: prev.posts.map(post => 
          post.id === pinnedPost.id 
            ? { ...post, pinned: !post.pinned }
            : post
        )
      } : null);
    }
  }, [currentUser, profileData, pinnedPost, isAuthenticated]);

  // Only initialize post actions if user is authenticated
  const { handleVote, handleShare } = usePostActions(
    isAuthenticated ? currentUser : null, 
    () => {
      // Optional: Add refetch logic if needed
    }
  );

  const handleFollow = useCallback(async () => {
    if (!currentUser || !profileData || isFollowLoading || !isAuthenticated) {
      if (!isAuthenticated) {
        handleNavigateToAuth();
      }
      return;
    }
    
    setIsFollowLoading(true);
    try {
      if (profileData.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('followed_id', profileData.user.id);
        
        if (error) throw error;
        
        setProfileData(prev => prev ? {
          ...prev,
          isFollowing: false,
          stats: {
            ...prev.stats,
            followersCount: Math.max(0, prev.stats.followersCount - 1)
          }
        } : null);
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            followed_id: profileData.user.id
          });
        
        if (error) {
          // Check if it's a duplicate key error (already following)
          if (error.code === '23505') {
            // Already following, just update the UI
            setProfileData(prev => prev ? {
              ...prev,
              isFollowing: true
            } : null);
            return;
          }
          throw error;
        }
        
        setProfileData(prev => prev ? {
          ...prev,
          isFollowing: true,
          stats: {
            ...prev.stats,
            followersCount: prev.stats.followersCount + 1
          }
        } : null);

        // Notify user
        notifyUser({
          user_id: profileData.user.id,
          recipient_id: profileData.user.id,
          sender_id: currentUser.id,
          type: 'follow',
          title: 'New Follower',
          message: `${currentUser.full_name} started following you.`,
          is_read: false
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      // Optionally show user-friendly error message
    } finally {
      setIsFollowLoading(false);
    }
  }, [currentUser, profileData, notifyUser, isFollowLoading, isAuthenticated, handleNavigateToAuth]);

  const selectPost = useCallback((post: Post | null) => {
    if (post) {
      // Redirect to the individual post page
      router.push(`/post/${post.id}`);
    }
  }, [router]);

  const handleEditProfile = useCallback(() => {
    if (!isAuthenticated) {
      handleNavigateToAuth();
      return;
    }
    setIsEditModalOpen(true);
  }, [isAuthenticated, handleNavigateToAuth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profileData?.user.avatar_url || '');
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(profileData?.user.banner_url || '');
  };

  // Fixed upload function to maintain consistent filenames
  const uploadFileToR2 = async (file: File, type: 'avatar' | 'banner'): Promise<string> => {
    if (!profileData?.user.id) {
      throw new Error('User ID not found');
    }

    // Use consistent filename based on user ID and file type
    const fileExtension = file.name.split('.').pop();
    const consistentFilename = `${type}_${profileData.user.id}.${fileExtension}`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', consistentFilename);
    formData.append('metadata', JSON.stringify({
      userId: profileData.user.id,
      subject: 'profile',
      description: `${type} upload for user ${profileData.user.username}`
    }));

    try {
      const response = await fetch('https://stride-media-api.spiritbulb.workers.dev/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return `https://media.stridecampus.com/${consistentFilename}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !profileData || !isAuthenticated) return;
    
    setIsUploading(true);
    
    try {
      let avatarUrl = profileData.user.avatar_url;
      let bannerUrl = profileData.user.banner_url;
      
      // Upload new avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadFileToR2(avatarFile, 'avatar');
      }
      
      // Upload new banner if selected
      if (bannerFile) {
        bannerUrl = await uploadFileToR2(bannerFile, 'banner');
      }
      
      // Update user profile in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editFormData.full_name,
          username: editFormData.username,
          bio: editFormData.bio,
          school_name: editFormData.school_name,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Refresh profile data
      const updatedProfileData = await fetchProfileData(editFormData.username || profileData.user.username, currentUser.id);
      if (updatedProfileData) {
        setProfileData(updatedProfileData);
      }
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Show global loading state
  if (appIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User not found</h1>
          <p className="text-gray-600">This account doesn't exist</p>
          {!isAuthenticated && (
            <a href="/arena" className="mt-4 inline-block px-4 py-2 bg-[#f23b36] text-white rounded-lg hover:shadow-md transition-all">
                Go to Arena
            </a>
          )}
        </div>
      </div>
    );
  }

  const { user: profileUser, posts, stats, isFollowing } = profileData;
  const isOwnProfile = isAuthenticated && currentUser?.id === profileUser.id;
  const defaultAvatar = '/default-avatar.png';
  const bannerUrl = profileUser.banner_url || '';

  return (
    <div className="max-w-3xl mx-auto mb-16">
      {/* Header Banner */}
      <div className="relative">
        <div className="h-32 sm:h-48 bg-gray-200">
          {profileUser.banner_url ? (
            <img src={profileUser.banner_url} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gray-300 flex items-center justify-center">
              <User2 className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="px-4 sm:px-6 flex justify-end mt-3">
          {!isOwnProfile && isAuthenticated && (
            <div className='grid grid-cols-2 gap-2'>
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${
                isFollowing
                  ? 'bg-white text-[#f23b36] border-[#f23b36] hover:bg-red-50'
                  : 'bg-[#f23b36] text-white border-transparent hover:bg-red-600'
              } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFollowLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
                onClick={handleStartChat}
                className="px-2 py-1.5 border rounded-lg text-sm font-medium bg-white text-[#f23b36] border-[#f23b36] hover:bg-[#f23b36] transition-colors cursor-pointer hover:text-white"
              >
                <HugeiconsIcon 
                  icon={Message01Icon} 
                  size={24} 
                  color="currentColor" 
                  strokeWidth={1.5} 
                />
              </button>
            </div>
          )}
          {!isOwnProfile && !isAuthenticated && (
            <div className='grid grid-cols-2 gap-2'>
            <button
              onClick={handleNavigateToAuth}
              className="px-4 py-2 border rounded-full text-sm font-medium transition-colors bg-[#f23b36] text-white border-transparent hover:bg-red-600"
            >
              Follow
            </button>
            <button
                onClick={handleStartChat}
                className="px-4 py-1.5 border rounded-lg text-sm font-medium bg-white text-[#f23b36] border-[#f23b36] hover:bg-[#f23b36] transition-colors cursor-pointer hover:text-white"
              >
                <HugeiconsIcon 
                  icon={Message01Icon} 
                  size={24} 
                  color="currentColor" 
                  strokeWidth={1.5} 
                />
              </button>
              </div>
          )}
          {isOwnProfile && (
            <>
              <button
                onClick={handleEditProfile}
                className="px-4 py-1.5 border rounded-lg text-sm font-medium bg-white text-[#f23b36] border-[#f23b36] hover:bg-[#f23b36] transition-colors cursor-pointer hover:text-white"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-4 sm:left-6">
          <div className="relative">
            <img
              src={profileUser.avatar_url || defaultAvatar}
              alt={profileUser.full_name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white object-cover"
            />
          </div>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="px-4 sm:px-6 pt-20 pb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {profileUser.full_name}{profileUser.school_name && `, from ${profileUser.school_name}`}
            </h1>
            {profileUser.checkmark && (
              <div className="ml-1">
                <img src="/check.png" alt="Verified" className="w-5 h-5" />
              </div>
            )}
          </div>
          <p className="text-gray-500 mb-3">@{profileUser.username}</p>
          
          {profileUser.bio && (
            <p className="text-gray-900 mb-3 whitespace-pre-wrap">{profileUser.bio}</p>
          )}
          
          {/* Profile Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {formatDate(profileUser.created_at)}</span>
            </div>
          </div>
          
          {/* Follow Stats */}
          <div className="flex gap-6 text-sm">
            <button className="hover:underline">
              <span className="font-bold text-gray-900">{stats.followingCount}</span>
              <span className="text-gray-500 ml-1">Following</span>
            </button>
            <button className="hover:underline">
              <span className="font-bold text-gray-900">{stats.followersCount}</span>
              <span className="text-gray-500 ml-1">Followers</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {(['posts', 'replies', 'resources'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-4 text-center font-medium text-sm capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f23b36] rounded-full"></div>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Posts Feed */}
      <div className="min-h-screen py-4 px-4 sm:px-6">
        {pinnedPost && activeTab === 'posts' && (
          <div className="mb-4">
            <PostCard 
              post={pinnedPost} 
              onVote={handleVote} 
              onShare={handleShare} 
              user={currentUser} 
              onSelect={selectPost} 
            />
          </div>
        )}
        {activeTab === 'posts' && (
          <PostsList 
            posts={posts.filter(post => !post.pinned)} // Don't show pinned post twice
            onPostSelect={selectPost}
            onVote={handleVote}
            onShare={handleShare}
            user={currentUser}
            onShowCreatePost={() => {}}
            isLoading={false}
            currentUser={currentUser}
            emptyStateMessage={
              isOwnProfile && posts.length === 0
                ? "You haven't posted anything yet"
                : `${profileUser.full_name} hasn't posted anything yet`
            }
          />
        )}
        
        {activeTab !== 'posts' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nothing to see here — yet</h3>
            <p>We're still working on this</p>
            <p className="text-gray-500 max-w-sm">
              {activeTab === 'replies' && `When @${profileUser.username} replies to posts, they'll show up here.`}
              {activeTab === 'resources' && `When @${profileUser.username} posts photos and videos, they'll show up here.`}
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal - Only render if authenticated */}
      {isEditModalOpen && isAuthenticated && (
        <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50 p-4 mb-16">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Banner Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner</label>
                <div className="relative h-32 rounded-lg overflow-hidden bg-gray-200">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {/* Previous Banner */}
                  {profileUser.banner_url && !bannerPreview && (
                    <img src={profileUser.banner_url} alt="Current Banner" className="w-full h-full object-cover absolute top-0 left-0" />
                  )}

                  <label className="absolute inset-0 flex items-center justify-center bg-opacity-0 hover:bg-opacity-50 cursor-pointer transition-all">
                    <Camera className="w-6 h-6 text-white opacity-0 hover:opacity-100" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>
                  {bannerPreview && (
                    <button
                      onClick={removeBanner}
                      className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Avatar Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {/* Previous Avatar */}
                  {profileData?.user.avatar_url && !avatarPreview && (
                    <img src={profileData.user.avatar_url} alt="Previous Avatar" className="w-full h-full object-cover" />
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-opacity-0 hover:bg-opacity-50 cursor-pointer transition-all rounded-full">
                    <Camera className="w-6 h-6 text-white opacity-0 hover:opacity-100" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  {avatarPreview && (
                    <button
                      onClick={removeAvatar}
                      className="absolute top-3 right-3 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={editFormData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
                  />
                </div>
                
                <div>
                  <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    id="school_name"
                    name="school_name"
                    value={editFormData.school_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
                  />
                </div>
                
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isUploading}
                  className="px-4 py-2 bg-[#f23b36] text-white rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}