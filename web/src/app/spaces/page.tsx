'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users } from 'lucide-react';
import SpaceCard from '@/components/spaces/SpaceCard';
import SpaceCreationWizard from '@/components/create/SpaceCreationWizard';

interface SpaceWithMembership extends Space {
  user_role?: string;
  members_count?: number;
  posts_count?: number;
  is_joined?: boolean;
}

export default function SpacesPage() {
  const { user } = useApp();
  const { toast } = useToast();
  const [spaces, setSpaces] = useState<SpaceWithMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [filter, setFilter] = useState<'all' | 'joined' | 'public' | 'private'>('all');

  useEffect(() => {
    if (user) {
      fetchSpaces();
    }
  }, [user]);

  const fetchSpaces = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch all public spaces and spaces the user created
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .or(`is_public.eq.true,creator_id.eq.${user.id}`);

      if (spacesError) throw spacesError;

      // Get member and post counts, and user membership for each space
      const spacesWithCounts = await Promise.all(
        (spacesData || []).map(async (space) => {
          const [membersResult, postsResult, userMembershipResult] = await Promise.all([
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
              .eq('user_id', user.id)
              .maybeSingle()
          ]);

          // Determine user role - creator is always admin, otherwise check membership
          let userRole = undefined;
          if (space.creator_id === user.id) {
            userRole = 'admin';
          } else if (userMembershipResult.data) {
            userRole = userMembershipResult.data.role;
          }
          
          return {
            ...space,
            user_role: userRole,
            is_joined: !!userRole,
            members_count: membersResult.count || 0,
            posts_count: postsResult.count || 0
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

  const handleJoin = (spaceId: string) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId 
        ? { ...space, is_joined: true, user_role: 'member', members_count: (space.members_count || 0) + 1 }
        : space
    ));
  };

  const handleLeave = (spaceId: string) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId 
        ? { ...space, is_joined: false, user_role: undefined, members_count: Math.max((space.members_count || 0) - 1, 0) }
        : space
    ));
  };

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         space.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filter) {
      case 'joined':
        return matchesSearch && space.is_joined;
      case 'public':
        return matchesSearch && space.is_public;
      case 'private':
        return matchesSearch && !space.is_public;
      default:
        return matchesSearch;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mb-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Spaces</h1>
              <p className="text-gray-600 mt-2">Discover and manage your communities</p>
            </div>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Space
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'joined', label: 'Joined' },
                { key: 'public', label: 'Public' },
                { key: 'private', label: 'Private' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onUpdate={fetchSpaces}
            />
          ))}
        </div>

        {filteredSpaces.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a space'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateWizard(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Space
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateWizard && (
        <SpaceCreationWizard
          onSuccess={(space) => {
            setShowCreateWizard(false);
            fetchSpaces(); // Refresh the list
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