import { useState, useEffect } from 'react';
import { Post, Space } from '@/utils/supabaseClient';
import { User } from '@/utils/supabaseClient';
import { fetchSpaces, fetchPosts} from '../utils/feed';

export const useFeedData = (selectedSpace: string, sortBy: string, user: User | null) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    loadData();
  }, [selectedSpace, sortBy, user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [spacesData, postsData] = await Promise.all([
        fetchSpaces(user),
        fetchPosts(selectedSpace, sortBy, user),
        
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