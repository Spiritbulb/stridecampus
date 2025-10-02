'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Crown, 
  Shield, 
  User as UserIcon,
  UserPlus,
  UserMinus,
  CheckCircle,
  Search,
  MoreVertical
} from 'lucide-react';

interface SpaceMember {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    checkmark: boolean;
  };
}

interface SpaceManagementProps {
  spaceId: string;
  currentUserRole?: string;
  onMemberUpdate?: () => void;
}

export default function SpaceManagement({ 
  spaceId, 
  currentUserRole, 
  onMemberUpdate 
}: SpaceManagementProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'member'>('all');
  const [managingMember, setManagingMember] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [spaceId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      
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
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberRole = async (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      const { error } = await supabase
        .from('space_memberships')
        .update({ role: newRole })
        .eq('space_id', spaceId)
        .eq('user_id', userId);

      if (error) throw error;

      setMembers(prev => prev.map(member => 
        member.user_id === userId 
          ? { ...member, role: newRole }
          : member
      ));

      toast({
        title: 'Success',
        description: 'Member role updated successfully'
      });

      setManagingMember(null);
      onMemberUpdate?.();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      });
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('space_memberships')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', userId);

      if (error) throw error;

      setMembers(prev => prev.filter(member => member.user_id !== userId));

      toast({
        title: 'Success',
        description: 'Member removed successfully'
      });

      setManagingMember(null);
      onMemberUpdate?.();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
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

  const canManageMember = (memberRole: string) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'moderator' && memberRole === 'member') return true;
    return false;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23b36] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Stats */}
      <div className="py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Members</h2>
            <p className="text-xs text-gray-500">{members.length} total</p>
          </div>
          {(currentUserRole === 'admin' || currentUserRole === 'moderator') && (
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <UserPlus className="w-5 h-5 text-[#f23b36]" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:bg-white text-sm"
          />
        </div>

        {/* Role Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', count: members.length },
            { key: 'admin', label: 'Admins', count: members.filter(m => m.role === 'admin').length },
            { key: 'moderator', label: 'Moderators', count: members.filter(m => m.role === 'moderator').length },
            { key: 'member', label: 'Members', count: members.filter(m => m.role === 'member').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                roleFilter === key
                  ? 'bg-[#f23b36] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No members found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {member.user.avatar_url ? (
                    <img 
                      src={member.user.avatar_url} 
                      alt={member.user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-gray-900 truncate">
                      {member.user.full_name || member.user.username}
                    </span>
                    {member.user.checkmark && (
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                    {getRoleIcon(member.role)}
                  </div>
                  <p className="text-sm text-gray-500">@{member.user.username}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined {new Date(member.joined_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Actions */}
                {canManageMember(member.role) && (
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setManagingMember(managingMember === member.user_id ? null : member.user_id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Management Menu */}
              {managingMember === member.user_id && canManageMember(member.role) && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                      Change Role
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMemberRole(member.user_id, 'member')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          member.role === 'member'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <UserIcon className="w-3 h-3 inline mr-1" />
                        Member
                      </button>
                      <button
                        onClick={() => updateMemberRole(member.user_id, 'moderator')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          member.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Shield className="w-3 h-3 inline mr-1" />
                        Moderator
                      </button>
                      {currentUserRole === 'admin' && (
                        <button
                          onClick={() => updateMemberRole(member.user_id, 'admin')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            member.role === 'admin'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Crown className="w-3 h-3 inline mr-1" />
                          Admin
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${member.user.full_name || member.user.username} from this space?`)) {
                        removeMember(member.user_id);
                      }
                    }}
                    className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <UserMinus className="w-3 h-3" />
                    Remove Member
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}