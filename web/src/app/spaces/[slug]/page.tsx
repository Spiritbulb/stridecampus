'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, Space, Post } from '@/utils/supabaseClient';
import { supabase } from '@/utils/supabaseClient';
import { useOptimizedSpaceData } from '@/hooks/useOptimizedSpaceData';
import { useOptimizedPostActions } from '@/hooks/useOptimizedPostActions';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import { useMemberCounts } from '@/components/feed/main/deps/sidebar';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import SpaceManagement from '@/components/spaces/SpaceManagement';
import SpaceSettings from '@/components/spaces/SpaceSettings';
import SpaceHeader from '@/components/spaces/SpaceHeader';
import TabNavigation from '@/components/spaces/TabNavigation';
import PostsTab from '@/components/spaces/PostsTab';
import MarketplaceTab from '@/components/spaces/MarketplaceTab';
import CreateListingModal from '@/components/spaces/CreateListingModal';

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
  
  const { posts, spaces, isLoading, refetch, updatePostOptimistically } = useOptimizedSpaceData(slug, sortBy, user);
  const { memberCounts, postCounts } = useMemberCounts(spaces);
  
  const currentSpace = spaces.find(space => space.id === slug);
  
  const { handleVote, handleShare, joinSpace } = useOptimizedPostActions(user, updatePostOptimistically, refetch);
  
  const selectPost = useCallback((post: Post | null) => {
    setSelectedPost(post);
  }, []);

  const fetchMarketplaceListings = useCallback(async () => {
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
  }, [currentSpace, toast]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    if (activeTab === 'marketplace') {
      fetchMarketplaceListings();
    }
  }, [refetch, activeTab, fetchMarketplaceListings]);

  const handleSortChange = useCallback((newSortBy: 'new' | 'hot') => {
    setSortBy(newSortBy);
  }, []);

  const handleCreatePost = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateListing = useCallback(async (listingData: { title: string; description: string; price: string }) => {
    if (!user || !currentSpace || !listingData.title || !listingData.description || !listingData.price) {
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
          title: listingData.title,
          description: listingData.description,
          price: parseInt(listingData.price),
          virtual_contract_signatures: [],
          contract_applications: []
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Listing created successfully'
      });

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
  }, [user, currentSpace, toast]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  usePageRefresh(handleRefresh);

  useEffect(() => {
    if (activeTab === 'marketplace' && currentSpace) {
      fetchMarketplaceListings();
    }
  }, [activeTab, currentSpace, fetchMarketplaceListings]);



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
          <SpaceHeader
            space={currentSpace}
            user={user}
            memberCount={memberCounts[currentSpace.id] || 0}
            postCount={postCounts[currentSpace.id] || 0}
            onJoinSpace={joinSpace}
          />
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl mx-auto">
        {activeTab === 'posts' && (
          <PostsTab
            posts={posts}
            user={user}
            sortBy={sortBy}
            canCreatePost={!!(user && currentSpace.user_role)}
            onSortChange={handleSortChange}
            onCreatePost={handleCreatePost}
            onSelectPost={selectPost}
            onVote={handleVote}
            onShare={handleShare}
          />
        )}

        {activeTab === 'marketplace' && (
          <>
            <CreateListingModal
              isOpen={showCreateListing}
              onClose={() => setShowCreateListing(false)}
              onCreate={handleCreateListing}
            />
            <MarketplaceTab
              listings={marketplaceListings}
              user={user}
              canCreateListing={!!(user && currentSpace.user_role)}
              isLoading={isLoadingMarketplace}
              onCreateListing={() => setShowCreateListing(true)}
              onApplyToListing={handleApplyToListing}
              onAcceptApplication={handleAcceptApplication}
              onRejectApplication={handleRejectApplication}
              getUserById={getUserById}
            />
          </>
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