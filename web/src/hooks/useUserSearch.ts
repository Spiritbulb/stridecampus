import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';

export interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

interface UseUserSearchProps {
  currentUserId?: string;
  debounceMs?: number;
}

export const useUserSearch = ({ currentUserId, debounceMs = 300 }: UseUserSearchProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search users function
  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!query.trim() || !currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, bio')
        .ilike('username', `%${query}%`)
        .limit(10)
        .neq('id', currentUserId);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }
      
      return (data as User[]) || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, [currentUserId]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    
    //@ts-ignore
    searchTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      
      try {
        const results = await searchUsers(searchQuery);
        if (isMountedRef.current) {
          setSearchResults(results);
        }
      } catch (error) {
        console.error('Search error:', error);
        if (isMountedRef.current) {
          setSearchResults([]);
        }
      } finally {
        if (isMountedRef.current) {
          setSearchLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchUsers, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchLoading(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    clearSearch
  };
};
