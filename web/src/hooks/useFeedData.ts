import { useState, useEffect } from 'react';
import { Post, Space, User } from '@/utils/supabaseClient';
import { fetchSpaces, fetchPosts } from '../utils/feed';
import { supabase } from '@/utils/supabaseClient';

export const useFeedData = (
  selectedSpace: string, 
  sortBy: string, 
  userEmail: string | null // Changed: pass email instead of user object
) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Supabase user by email
  useEffect(() => {
    const fetchUser = async () => {
      if (!userEmail) {
        setSupabaseUser(null);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        setSupabaseUser(null);
      } else {
        setSupabaseUser(data);
      }
    };

    fetchUser();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && !supabaseUser) {
      // Wait for Supabase user to load
      return;
    }
    loadData();
  }, [selectedSpace, sortBy, supabaseUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [spacesData, postsData] = await Promise.all([
        fetchSpaces(supabaseUser),
        fetchPosts(selectedSpace, sortBy, supabaseUser),
      ]);
      
      setSpaces(spacesData);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { posts, spaces, isLoading, refetch: loadData };
};