import { useState, useEffect, useCallback, useRef } from 'react';
import { Post, Space, User } from '@/utils/supabaseClient';
import { fetchSpaces, fetchPosts } from '../utils/feed';

interface CachedData {
  posts: Post[];
  spaces: Space[];
  timestamp: number;
  spaceId: string;
  sortBy: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedSpaceData = (selectedSpace: string, sortBy: string, user: User | null) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  const cacheRef = useRef<CachedData | null>(null);
  const loadingRef = useRef(false);

  const isCacheValid = useCallback((cache: CachedData | null): boolean => {
    if (!cache) return false;
    const now = Date.now();
    return (
      cache.spaceId === selectedSpace &&
      cache.sortBy === sortBy &&
      (now - cache.timestamp) < CACHE_DURATION
    );
  }, [selectedSpace, sortBy]);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent loads
    if (loadingRef.current && !forceRefresh) return;
    
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheRef.current)) {
      const cache = cacheRef.current!;
      setPosts(cache.posts);
      setSpaces(cache.spaces);
      setIsLoading(false);
      setHasInitialLoad(true);
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const [spacesData, postsData] = await Promise.all([
        fetchSpaces(user),
        fetchPosts(selectedSpace, sortBy, user),
      ]);
      
      // Update cache
      cacheRef.current = {
        posts: postsData,
        spaces: spacesData,
        timestamp: Date.now(),
        spaceId: selectedSpace,
        sortBy: sortBy
      };
      
      setSpaces(spacesData);
      setPosts(postsData);
      setHasInitialLoad(true);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [selectedSpace, sortBy, user, isCacheValid]);

  // Optimistic update for post actions
  const updatePostOptimistically = useCallback((postId: string, updates: Partial<Post> | ((post: Post) => Partial<Post>)) => {
    const updatePost = (post: Post) => {
      if (post.id !== postId) return post;
      
      const updatesObj = typeof updates === 'function' ? updates(post) : updates;
      const processedUpdates: Partial<Post> = {};
      
      // Process each update, handling functions
      Object.entries(updatesObj).forEach(([key, value]) => {
        if (typeof value === 'function') {
          // @ts-ignore
          processedUpdates[key as keyof Post] = value(post[key as keyof Post]);
        } else {
          // @ts-ignore
          processedUpdates[key as keyof Post] = value;
        }
      });
      
      return { ...post, ...processedUpdates };
    };

    setPosts(prevPosts => prevPosts.map(updatePost));
    
    // Update cache as well
    if (cacheRef.current) {
      cacheRef.current.posts = cacheRef.current.posts.map(updatePost);
    }
  }, []);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Initial load and dependency changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return { 
    posts, 
    spaces, 
    isLoading, 
    hasInitialLoad,
    refetch: forceRefresh,
    updatePostOptimistically
  };
};
