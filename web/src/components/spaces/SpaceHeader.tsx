'use client';

import { toast } from '@/hooks/use-toast';
import { Space, User } from '@/utils/supabaseClient';
import { Users, Crown, Shield, User as UserIcon } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useMemo, useState, useEffect } from 'react';

interface SpaceHeaderProps {
  space: Space;
  user: User | null;
  memberCount: number;
  postCount: number;
  onJoinSpace: (spaceId: string) => void;
}

interface SpaceMembership {
  id: string;
  space_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  created_at: string;
  user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    checkmark: boolean;
  };
}

export default function SpaceHeader({ 
  space, 
  user, 
  memberCount, 
  postCount, 
  onJoinSpace 
}: SpaceHeaderProps) {
  const [memberships, setMemberships] = useState<SpaceMembership[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Fetch user's membership for this space
  useEffect(() => {
    const fetchUserMembership = async () => {
      if (!user) {
        setMemberships(null);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('space_memberships')
          .select(`
            *,
            user:users (
              id,
              full_name,
              username,
              avatar_url,
              checkmark
            )
          `)
          .eq('space_id', space.id)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          throw error;
        }

        setMemberships(data ? [data] : []);
      } catch (error) {
        console.error('Error fetching user membership:', error);
        toast({
          title: 'Error',
          description: 'Failed to load membership data',
          variant: 'destructive'
        });
        setMemberships(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserMembership();
  }, [space.id, user]);

  const currentUserMembership = useMemo(() => {
    if (!user || !memberships) return null;
    return memberships.find(member => member.user_id === user.id);
  }, [memberships, user]);

  const isCurrentUserMember = !!currentUserMembership;
  const userRole = currentUserMembership?.role || space.user_role;

  // Show loading state for membership check
  if (isLoading) {
    return (
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="flex gap-3">
        {space.logo_url ? (
          <img 
            src={space.logo_url} 
            alt={space.display_name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-gray-600">
              {space.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {space.display_name}
            </h1>
            {getRoleIcon(userRole)}
          </div>
          
          {space.description && (
            <p className="text-sm text-gray-600 line-clamp-1">
              {space.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount.toLocaleString()}
            </span>
            <span>{postCount.toLocaleString()} posts</span>
            <span>{space.is_public ? 'Public' : 'Private'}</span>
          </div>
        </div>

        {user && space.is_public && !isCurrentUserMember && (
          <button
            onClick={() => onJoinSpace(space.id)}
            disabled={isLoading}
            className="px-4 py-1.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold self-start"
          >
            Join
          </button>
        )}

        {isCurrentUserMember && (
          <div className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-full self-start">
            Member
          </div>
        )}
      </div>
    </div>
  );
}