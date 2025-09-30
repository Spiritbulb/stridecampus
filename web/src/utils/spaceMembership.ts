import { supabase } from './supabaseClient';
import { User } from './supabaseClient';

export interface SpaceMembership {
  space_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface SpaceWithMembership {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_public: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  members_count?: number;
  posts_count?: number;
  user_role?: 'admin' | 'moderator' | 'member';
  is_joined?: boolean;
  logo_url?: string;
}

/**
 * Check if a user is a member of a specific space
 */
export const checkUserMembership = async (
  spaceId: string, 
  userId: string
): Promise<{ isMember: boolean; role?: string }> => {
  try {
    const { data, error } = await supabase
      .from('space_memberships')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user membership:', error);
      return { isMember: false };
    }

    return {
      isMember: !!data,
      role: data?.role
    };
  } catch (error) {
    console.error('Error checking user membership:', error);
    return { isMember: false };
  }
};

/**
 * Check if a user is the creator/admin of a space
 */
export const isSpaceCreator = (space: { creator_id: string }, user: User | null): boolean => {
  return user ? space.creator_id === user.id : false;
};

/**
 * Get user's role in a space (creator is always admin)
 */
export const getUserSpaceRole = async (
  space: { id: string; creator_id: string }, 
  user: User | null
): Promise<'admin' | 'moderator' | 'member' | undefined> => {
  if (!user) return undefined;

  // Creator is always admin
  if (space.creator_id === user.id) {
    return 'admin';
  }

  // Check membership
  const { role } = await checkUserMembership(space.id, user.id);
  return role as 'admin' | 'moderator' | 'member' | undefined;
};

/**
 * Check if user can perform admin actions in a space
 */
export const canUserAdminSpace = async (
  space: { id: string; creator_id: string }, 
  user: User | null
): Promise<boolean> => {
  const role = await getUserSpaceRole(space, user);
  return role === 'admin';
};

/**
 * Check if user can perform moderator actions in a space
 */
export const canUserModerateSpace = async (
  space: { id: string; creator_id: string }, 
  user: User | null
): Promise<boolean> => {
  const role = await getUserSpaceRole(space, user);
  return role === 'admin' || role === 'moderator';
};

/**
 * Check if user can post in a space
 */
export const canUserPostInSpace = async (
  space: { id: string; creator_id: string }, 
  user: User | null
): Promise<boolean> => {
  if (!user) return false;
  
  // Creator can always post
  if (space.creator_id === user.id) return true;
  
  // Check if user is a member
  const { isMember } = await checkUserMembership(space.id, user.id);
  return isMember;
};

/**
 * Join a space
 */
export const joinSpace = async (
  spaceId: string, 
  userId: string, 
  role: 'member' = 'member'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('space_memberships')
      .insert({
        space_id: spaceId,
        user_id: userId,
        role
      });

    if (error) {
      console.error('Error joining space:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error joining space:', error);
    return { success: false, error: 'Failed to join space' };
  }
};

/**
 * Leave a space
 */
export const leaveSpace = async (
  spaceId: string, 
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('space_memberships')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving space:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error leaving space:', error);
    return { success: false, error: 'Failed to leave space' };
  }
};
