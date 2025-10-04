'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/utils/supabaseClient';
import { Space, User as SupabaseUser } from '@/utils/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, Globe, Lock, Crown, Shield, User as UserIcon } from 'lucide-react';
import SpaceCreationWizard from '@/components/create/SpaceCreationWizard';
import { joinSpace, leaveSpace } from '@/utils/spaceMembership';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface SpaceWithMembership extends Space {
  user_role?: string;
  members_count?: number;
  posts_count?: number;
  is_joined?: boolean;
  latest_post_at?: string;
}

type TabType = 'foryou' | 'public';

export default function SpacesPage() {
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const { toast } = useToast();
  
  // Fetch full Supabase user
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [spaces, setSpaces] = useState<SpaceWithMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('foryou');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch Supabase user data
  useEffect(() => {
    const fetchSupabaseUser = async () => {
      if (!user || !appUser) {
        setLoadingUser(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', appUser.email)
          .single();

        if (error) {
          console.error('Error fetching Supabase user:', error);
          
          // If user doesn't exist yet, show a helpful message
          if (error.code === 'PGRST116') {
            toast({
              title: 'Profile Loading',
              description: 'Your profile is being set up. Please refresh in a moment.',
            });
          }
        } else {
          setSupabaseUser(data);
        }
      } catch (error) {
        console.error('Error fetching Supabase user:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchSupabaseUser();
  }, [user, appUser]);

  // Fetch spaces
  useEffect(() => {
    if (!supabaseUser) return;
    
    const fetchSpaces = async () => {
      try {
        setIsLoading(true);
        
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select('*')
          .or(`is_public.eq.true,creator_id.eq.${supabaseUser.id}`);

        if (spacesError) throw spacesError;

        const spacesWithCounts = await Promise.all(
          (spacesData || []).map(async (space) => {
            const [membersResult, postsResult, userMembershipResult, latestPostResult] = await Promise.all([
              supabase
                .from('space_memberships')
                .select('*', { count: 'exact', head: true })
                .eq('space_id', space.id),
              supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('space_id', space.id),
              supabase
                .from('space_memberships')
                .select('role')
                .eq('space_id', space.id)
                .eq('user_id', supabaseUser.id)
                .maybeSingle(),
              supabase
                .from('posts')
                .select('created_at')
                .eq('space_id', space.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            ]);

            let userRole = undefined;
            if (space.creator_id === supabaseUser.id) {
              userRole = 'admin';
            } else if (userMembershipResult.data) {
              userRole = userMembershipResult.data.role;
            }
            
            return {
              ...space,
              user_role: userRole,
              is_joined: !!userRole,
              members_count: membersResult.count || 0,
              posts_count: postsResult.count || 0,
              latest_post_at: latestPostResult.data?.created_at || space.created_at
            };
          })
        );

        setSpaces(spacesWithCounts);
      } catch (error) {
        console.error('Error fetching spaces:', error);
        toast({
          title: 'Error',
          description: 'Failed to load spaces',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaces();
  }, [supabaseUser]);

  const refetchSpaces = async () => {
    if (!supabaseUser) return;
    
    try {
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .or(`is_public.eq.true,creator_id.eq.${supabaseUser.id}`);

      if (spacesError) throw spacesError;

      const spacesWithCounts = await Promise.all(
        (spacesData || []).map(async (space) => {
          const [membersResult, postsResult, userMembershipResult, latestPostResult] = await Promise.all([
            supabase
              .from('space_memberships')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', space.id),
            supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .eq('space_id', space.id),
            supabase
              .from('space_memberships')
              .select('role')
              .eq('space_id', space.id)
              .eq('user_id', supabaseUser.id)
              .maybeSingle(),
            supabase
              .from('posts')
              .select('created_at')
              .eq('space_id', space.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          ]);

          let userRole = undefined;
          if (space.creator_id === supabaseUser.id) {
            userRole = 'admin';
          } else if (userMembershipResult.data) {
            userRole = userMembershipResult.data.role;
          }
          
          return {
            ...space,
            user_role: userRole,
            is_joined: !!userRole,
            members_count: membersResult.count || 0,
            posts_count: postsResult.count || 0,
            latest_post_at: latestPostResult.data?.created_at || space.created_at
          };
        })
      );

      setSpaces(spacesWithCounts);
    } catch (error) {
      console.error('Error refetching spaces:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh spaces',
        variant: 'destructive'
      });
    }
  };

  const handleJoin = async (spaceId: string) => {
    if (!supabaseUser || actionLoading) return;
    
    setActionLoading(spaceId);
    try {
      const result = await joinSpace(spaceId, supabaseUser.id, 'member');
      
      if (result.success) {
        setSpaces(prev => prev.map(space => 
          space.id === spaceId 
            ? { ...space, is_joined: true, user_role: 'member', members_count: (space.members_count || 0) + 1 }
            : space
        ));
        
        toast({
          title: 'Success',
          description: 'You have joined this space'
        });
      } else {
        throw new Error(result.error || 'Failed to join space');
      }
    } catch (error) {
      console.error('Error joining space:', error);
      toast({
        title: 'Error',
        description: 'Failed to join space',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (spaceId: string) => {
    if (!supabaseUser || actionLoading) return;
    
    setActionLoading(spaceId);
    try {
      const result = await leaveSpace(spaceId, supabaseUser.id);
      
      if (result.success) {
        setSpaces(prev => prev.map(space => 
          space.id === spaceId 
            ? { ...space, is_joined: false, user_role: undefined, members_count: Math.max((space.members_count || 0) - 1, 0) }
            : space
        ));
        
        toast({
          title: 'Success',
          description: 'You have left this space'
        });
      } else {
        throw new Error(result.error || 'Failed to leave space');
      }
    } catch (error) {
      console.error('Error leaving space:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave space',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAndSortedSpaces = useMemo(() => {
    let filtered = spaces;
    
    if (activeTab === 'foryou') {
      filtered = spaces.filter(space => space.is_joined);
    } else {
      filtered = spaces.filter(space => space.is_public);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(space => 
        space.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.latest_post_at || a.created_at).getTime();
      const dateB = new Date(b.latest_post_at || b.created_at).getTime();
      return dateB - dateA;
    });
  }, [spaces, activeTab, searchQuery]);

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

  // Show loading while auth or user data is loading
  if (userLoading || loadingUser) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23b36] border-t-transparent mx-auto"></div>
          <p className="text-gray-500 text-sm">Loading spaces...</p>
        </div>
      </div>
    );
  }

  // Show message if user data failed to load
  if (!supabaseUser || !user || !appUser) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Profile Not Found</h3>
          <p className="text-gray-500 text-sm">
            Your profile is still being set up. Please refresh the page in a moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          {/* Title and Create Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Spaces</h1>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Create space"
            >
              <Plus className="w-5 h-5 text-[#f23b36]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('foryou')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'foryou'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              For You
              {activeTab === 'foryou' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f23b36] rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'public'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Public
              {activeTab === 'public' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f23b36] rounded-full"></div>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:bg-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spaces List */}
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23b36] border-t-transparent mx-auto"></div>
          </div>
        ) : filteredAndSortedSpaces.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No spaces found' : activeTab === 'foryou' ? 'No joined spaces yet' : 'No public spaces'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : activeTab === 'foryou' 
                  ? 'Join some public spaces to see them here' 
                  : 'Be the first to create a public space'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => activeTab === 'foryou' ? setActiveTab('public') : setShowCreateWizard(true)}
                className="px-6 py-2.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
              >
                {activeTab === 'foryou' ? 'Explore Public Spaces' : 'Create Space'}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedSpaces.map((space) => (
              <div key={space.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-3">
                  {/* Logo */}
                  <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center ${
                    space.is_public ? 'bg-gray-100' : 'bg-purple-100'
                  }`}>
                    {space.logo_url ? (
                      <img 
                        src={space.logo_url} 
                        alt={space.display_name} 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">
                        {space.display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{space.display_name}</h3>
                        {getRoleIcon(space.user_role)}
                        <span className="flex items-center gap-1 text-gray-500 text-sm flex-shrink-0">
                          {space.is_public ? (
                            <Globe className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {space.description && (
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{space.description}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {space.members_count || 0}
                      </span>
                      <span>{space.posts_count || 0} posts</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <a
                        href={`/spaces/${space.id}`}
                        className="flex-1 px-4 py-1.5 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-center text-sm font-semibold"
                      >
                        View
                      </a>
                      {space.is_joined ? (
                        <button
                          onClick={() => handleLeave(space.id)}
                          disabled={actionLoading === space.id}
                          className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === space.id ? 'Leaving...' : 'Leave'}
                        </button>
                      ) : space.is_public ? (
                        <button
                          onClick={() => handleJoin(space.id)}
                          disabled={actionLoading === space.id}
                          className="px-4 py-1.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === space.id ? 'Joining...' : 'Join'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Space Wizard Modal */}
      {showCreateWizard && (
        <SpaceCreationWizard
          onSuccess={(space) => {
            setShowCreateWizard(false);
            refetchSpaces();
            toast({
              title: 'Success',
              description: `Space "${space.display_name}" created successfully`
            });
          }}
          onCancel={() => setShowCreateWizard(false)}
        />
      )}
    </div>
  );
}