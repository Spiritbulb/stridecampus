'use client';

import { useState } from 'react';
import { Space } from '@/utils/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { joinSpace, leaveSpace } from '@/utils/spaceMembership';
import { 
  Users, 
  Globe, 
  Lock, 
  Crown, 
  Shield, 
  User as UserIcon,
  MoreVertical
} from 'lucide-react';

interface SpaceCardProps {
  space: Space & {
    user_role?: string;
    members_count?: number;
    posts_count?: number;
    is_joined?: boolean;
  };
  onJoin?: (spaceId: string) => void;
  onLeave?: (spaceId: string) => void;
  onUpdate?: () => void;
}

export default function SpaceCard({ space, onJoin, onLeave, onUpdate }: SpaceCardProps) {
  const { user } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await joinSpace(space.id, user.id, 'member');
      
      if (result.success) {
        onJoin?.(space.id);
        onUpdate?.();
        
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
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await leaveSpace(space.id, user.id);
      
      if (result.success) {
        onLeave?.(space.id);
        onUpdate?.();
        
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
      setIsLoading(false);
    }
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            space.is_public ? 'bg-blue-100' : 'bg-purple-100'
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
          <div>
            <h3 className="font-semibold text-gray-900">{space.display_name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {space.is_public ? (
                <Globe className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {space.is_public ? 'Public' : 'Private'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getRoleIcon(space.user_role)}
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {space.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{space.description}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {space.members_count || 0} members
          </span>
          <span>{space.posts_count || 0} posts</span>
        </div>
        {getRoleBadge(space.user_role)}
      </div>

      <div className="flex gap-2">
        <a
          href={`/spaces/${space.id}`}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
        >
          View Space
        </a>
        {space.is_joined ? (
          <button
            onClick={handleLeave}
            disabled={isLoading}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Leaving...' : 'Leave'}
          </button>
        ) : space.is_public ? (
          <button
            onClick={handleJoin}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Joining...' : 'Join'}
          </button>
        ) : (
          <button
            disabled
            className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium"
          >
            Private
          </button>
        )}
      </div>
    </div>
  );
}
