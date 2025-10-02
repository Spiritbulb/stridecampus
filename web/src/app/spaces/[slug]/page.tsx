'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, Space, Post } from '@/utils/supabaseClient';
import { supabase } from '@/utils/supabaseClient';
import { useFeedData } from '@/hooks/useFeedData';
import { usePostActions } from '@/hooks/usePostActions';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import PostCard from '@/components/feed/main/PostCard';
import { useMemberCounts } from '@/components/feed/main/deps/sidebar';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import SpaceManagement from '@/components/spaces/SpaceManagement';
import SpaceSettings from '@/components/spaces/SpaceSettings';
import { Plus, TrendingUp, Clock, Users, Settings, Crown, Shield, User as UserIcon, ShoppingBag, DollarSign, FileText, CheckCircle, XCircle } from 'lucide-react';

interface MarketplaceListing {
  id: number;
  user_id: string;
  space_id: string;
  title: string;
  description: string;
  price: number;
  created_at: string;
  virtual_contract_signatures: string[];
  contract_applications: string[];
  author?: User;
}

type TabType = 'posts' | 'marketplace' | 'members' | 'settings';

export default function SpacePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useApp();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<'new' | 'hot'>('new');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [newListing, setNewListing] = useState({ title: '', description: '', price: '' });
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  
  const { posts, spaces, isLoading, refetch } = useFeedData(slug, sortBy, user);
  const { memberCounts, postCounts } = useMemberCounts(spaces);
  
  const currentSpace = spaces.find(space => space.id === slug);
  
  const { handleVote, handleShare, joinSpace } = usePostActions(user, refetch);
  const selectPost = useCallback((post: Post | null) => {
    setSelectedPost(post);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
    if (activeTab === 'marketplace') {
      fetchMarketplaceListings();
    }
  }, [refetch, activeTab]);

  usePageRefresh(handleRefresh);

  useEffect(() => {
    if (activeTab === 'marketplace' && currentSpace) {
      fetchMarketplaceListings();
    }
  }, [activeTab, currentSpace]);

  const fetchMarketplaceListings = async () => {
    if (!currentSpace) return;
    
    setIsLoadingMarketplace(true);
    try {
      const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .eq('space_id', currentSpace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user data for each listing
      const listingsWithAuthors = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', listing.user_id)
            .single();
          
          return {
            ...listing,
            author: userData,
            virtual_contract_signatures: listing.virtual_contract_signatures || [],
            contract_applications: listing.contract_applications || []
          };
        })
      );

      setMarketplaceListings(listingsWithAuthors);
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace listings',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMarketplace(false);
    }
  };

  const handleCreateListing = async () => {
    if (!user || !currentSpace || !newListing.title || !newListing.description || !newListing.price) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('marketplace')
        .insert({
          user_id: user.id,
          space_id: currentSpace.id,
          title: newListing.title,
          description: newListing.description,
          price: parseInt(newListing.price),
          virtual_contract_signatures: [],
          contract_applications: []
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Listing created successfully'
      });

      setNewListing({ title: '', description: '', price: '' });
      setShowCreateListing(false);
      fetchMarketplaceListings();
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to create listing',
        variant: 'destructive'
      });
    }
  };

  const handleApplyToListing = async (listingId: number) => {
    if (!user) return;

    try {
      const listing = marketplaceListings.find(l => l.id === listingId);
      if (!listing) return;

      const applications = listing.contract_applications || [];
      if (applications.includes(user.id)) {
        toast({
          title: 'Info',
          description: 'You have already applied to this listing',
        });
        return;
      }

      const { error } = await supabase
        .from('marketplace')
        .update({
          contract_applications: [...applications, user.id]
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application submitted successfully'
      });

      fetchMarketplaceListings();
    } catch (error) {
      console.error('Error applying to listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive'
      });
    }
  };

  const handleAcceptApplication = async (listingId: number, applicantId: string) => {
    if (!user) return;

    try {
      const listing = marketplaceListings.find(l => l.id === listingId);
      if (!listing || listing.user_id !== user.id) return;

      const signatures = listing.virtual_contract_signatures || [];
      const applications = (listing.contract_applications || []).filter(id => id !== applicantId);

      const { error } = await supabase
        .from('marketplace')
        .update({
          virtual_contract_signatures: [...signatures, applicantId],
          contract_applications: applications
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application accepted'
      });

      fetchMarketplaceListings();
    } catch (error) {
      console.error('Error accepting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept application',
        variant: 'destructive'
      });
    }
  };

  const handleRejectApplication = async (listingId: number, applicantId: string) => {
    if (!user) return;

    try {
      const listing = marketplaceListings.find(l => l.id === listingId);
      if (!listing || listing.user_id !== user.id) return;

      const applications = (listing.contract_applications || []).filter(id => id !== applicantId);

      const { error } = await supabase
        .from('marketplace')
        .update({
          contract_applications: applications
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application rejected'
      });

      fetchMarketplaceListings();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject application',
        variant: 'destructive'
      });
    }
  };

  const getUserById = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3.5 h-3.5 text-yellow-600" />;
      case 'moderator':
        return <Shield className="w-3.5 h-3.5 text-blue-600" />;
      case 'member':
        return <UserIcon className="w-3.5 h-3.5 text-gray-600" />;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23b36] border-t-transparent"></div>
      </div>
    );
  }
  
  if (!currentSpace) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center px-4">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Space not found</h1>
          <p className="text-gray-600 text-sm">The space you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Space Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          {/* Space Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex gap-3">
              {currentSpace.logo_url ? (
                <img 
                  src={currentSpace.logo_url} 
                  alt={currentSpace.display_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-gray-600">
                    {currentSpace.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold text-gray-900 truncate">{currentSpace.display_name}</h1>
                  {getRoleIcon(currentSpace.user_role)}
                </div>
                {currentSpace.description && (
                  <p className="text-sm text-gray-600 line-clamp-1">{currentSpace.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {memberCounts[currentSpace.id] || 0}
                  </span>
                  <span>{postCounts[currentSpace.id] || 0} posts</span>
                  <span>{currentSpace.is_public ? 'Public' : 'Private'}</span>
                </div>
              </div>

              {user && !currentSpace.user_role && currentSpace.is_public && (
                <button
                  onClick={() => joinSpace(currentSpace.id)}
                  className="px-4 py-1.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold self-start"
                >
                  Join
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { key: 'posts', label: 'Posts', icon: TrendingUp },
              { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
              { key: 'members', label: 'Members', icon: Users },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === key
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f23b36] rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl mx-auto">
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <button 
                onClick={() => setSortBy(sortBy === 'new' ? 'hot' : 'new')}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {sortBy === 'new' ? (
                  <>
                    <Clock className="w-4 h-4" />
                    New
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Hot
                  </>
                )}
              </button>
              
              {user && currentSpace.user_role && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5 text-[#f23b36]" />
                </button>
              )}
            </div>
            
            {posts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} user={user} onSelect={selectPost} onShare={handleShare} onVote={handleVote}/>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <p className="text-gray-500 mb-4">No posts yet in this space.</p>
                {user && currentSpace.user_role && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
                  >
                    Be the first to post!
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Marketplace</h2>
              {user && currentSpace.user_role && (
                <button 
                  onClick={() => setShowCreateListing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5 text-[#f23b36]" />
                </button>
              )}
            </div>

            {showCreateListing && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Create Listing</h3>
                <input
                  type="text"
                  placeholder="Title"
                  value={newListing.title}
                  onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
                />
                <textarea
                  placeholder="Description"
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
                  rows={3}
                />
                <input
                  type="number"
                  placeholder="Price (KSH)"
                  value={newListing.price}
                  onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateListing}
                    className="flex-1 px-4 py-2 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateListing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isLoadingMarketplace ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23b36] border-t-transparent"></div>
              </div>
            ) : marketplaceListings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {marketplaceListings.map((listing) => (
                  <div key={listing.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{listing.title}</h3>
                        <p className="text-sm text-gray-700 mb-2">{listing.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            KSH {listing.price}
                          </span>
                          <span>By {listing.author?.full_name || 'Unknown'}</span>
                          <span>{listing.virtual_contract_signatures.length} signed</span>
                          <span>{listing.contract_applications.length} applied</span>
                        </div>
                      </div>
                    </div>

                    {user && listing.user_id !== user.id && !listing.virtual_contract_signatures.includes(user.id) && !listing.contract_applications.includes(user.id) && (
                      <button
                        onClick={() => handleApplyToListing(listing.id)}
                        className="mt-2 px-4 py-1.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
                      >
                        Apply
                      </button>
                    )}

                    {user && listing.user_id === user.id && (
                      <button
                        onClick={() => setSelectedListing(selectedListing?.id === listing.id ? null : listing)}
                        className="mt-2 px-4 py-1.5 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-semibold"
                      >
                        {selectedListing?.id === listing.id ? 'Hide' : 'View'} Applications ({listing.contract_applications.length})
                      </button>
                    )}

                    {selectedListing?.id === listing.id && (
                      <ApplicationsList
                        applications={listing.contract_applications}
                        signatures={listing.virtual_contract_signatures}
                        listingId={listing.id}
                        onAccept={handleAcceptApplication}
                        onReject={handleRejectApplication}
                        getUserById={getUserById}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No marketplace listings yet.</p>
                {user && currentSpace.user_role && (
                  <button 
                    onClick={() => setShowCreateListing(true)}
                    className="px-6 py-2.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
                  >
                    Create First Listing
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-4">
            <SpaceManagement 
              spaceId={currentSpace.id}
              currentUserRole={currentSpace.user_role}
              onMemberUpdate={refetch}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4">
            <SpaceSettings 
              space={currentSpace}
              currentUserRole={currentSpace.user_role}
              onSpaceUpdate={refetch}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Applications List Component
function ApplicationsList({ 
  applications, 
  signatures, 
  listingId, 
  onAccept, 
  onReject, 
  getUserById 
}: { 
  applications: string[];
  signatures: string[];
  listingId: number;
  onAccept: (listingId: number, userId: string) => void;
  onReject: (listingId: number, userId: string) => void;
  getUserById: (userId: string) => Promise<User | null>;
}) {
  const [users, setUsers] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const allUserIds = [...applications, ...signatures];
      const userMap: { [key: string]: User } = {};
      
      await Promise.all(
        allUserIds.map(async (userId) => {
          const user = await getUserById(userId);
          if (user) {
            userMap[userId] = user;
          }
        })
      );
      
      setUsers(userMap);
    };

    fetchUsers();
  }, [applications, signatures]);

  return (
    <div className="mt-3 space-y-3">
      {signatures.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Signed Contracts ({signatures.length})</h4>
          <div className="space-y-2">
            {signatures.map(userId => (
              <div key={userId} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {users[userId]?.avatar_url ? (
                    <img src={users[userId].avatar_url} alt={users[userId].full_name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{users[userId]?.full_name || 'Loading...'}</span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {applications.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Pending Applications ({applications.length})</h4>
          <div className="space-y-2">
            {applications.map(userId => (
              <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {users[userId]?.avatar_url ? (
                    <img src={users[userId].avatar_url} alt={users[userId].full_name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{users[userId]?.full_name || 'Loading...'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(listingId, userId)}
                    className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onReject(listingId, userId)}
                    className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}