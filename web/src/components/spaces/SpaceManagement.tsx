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
  CheckCircle
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
        .order('joined_at', { ascending: false });

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

  const getRoleBadge = (role: string) => {
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

  const canManageMember = (memberRole: string) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'moderator' && memberRole === 'member') return true;
    return false;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Members</h2>
          <p className="text-gray-600 text-sm">{members.length} total members</p>
        </div>
        {(currentUserRole === 'admin' || currentUserRole === 'moderator') && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Members
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'admin', label: 'Admins' },
            { key: 'moderator', label: 'Moderators' },
            { key: 'member', label: 'Members' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No members found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {member.user.avatar_url ? (
                      <img 
                        src={member.user.avatar_url} 
                        alt={member.user.full_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {member.user.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{member.user.full_name}</span>
                      {member.user.checkmark && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>@{member.user.username}</span>
                      <span>•</span>
                      <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role)}
                  
                  {canManageMember(member.role) && (
                    <div className="flex items-center gap-2">
                      {/* Role Change Dropdown */}
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.user_id, e.target.value as any)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        {currentUserRole === 'admin' && (
                          <option value="admin">Admin</option>
                        )}
                      </select>
                      
                      {/* Remove Member */}
                      <button
                        onClick={() => removeMember(member.user_id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}