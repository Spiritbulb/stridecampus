import { User, Space } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { supabase } from '@/utils/supabaseClient';
import { getUserCreditSummary, getUserArchive } from '@/utils/creditEconomy';

// Enhanced cache with TTL and memory management
class ContextCache {
  private cache = new Map<string, { context: OptimizedUserContext; timestamp: number; hits: number }>();
  private maxSize = 100; // Prevent memory leaks
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  get(userId: string): OptimizedUserContext | null {
    const cached = this.cache.get(userId);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(userId);
      return null;
    }
    
    // Update hit count for LRU eviction
    cached.hits++;
    return cached.context;
  }

  set(userId: string, context: OptimizedUserContext): void {
    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const leastUsed = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.hits - b.hits)[0];
      this.cache.delete(leastUsed[0]);
    }
    
    this.cache.set(userId, {
      context,
      timestamp: Date.now(),
      hits: 1
    });
  }

  delete(userId: string): boolean {
    return this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      entries: Array.from(this.cache.keys())
    };
  }

  private calculateHitRate(): number {
    // This would need to be implemented with actual hit/miss tracking
    return 0;
  }
}

// Token-optimized context data structure
export interface OptimizedUserContext {
  // Core user info (always included)
  profile: {
    username: string;
    school: string;
    level: string;
    credits: number;
    verified: boolean;
  };
  
  // Spaces (summarized)
  spaces: {
    joined: number;
    admin: number;
    recent: string[]; // Last 3 space names
  };
  
  // Resources (summarized)
  resources: {
    uploaded: number;
    purchased: number;
    categories: string[]; // Top 3 categories
  };
  
  // Credit activity (summarized)
  credits: {
    level: string;
    balance: number;
    recentActivity: string; // Last 3 transaction types
  };
  
  // Social activity (summarized)
  social: {
    posts: number;
    followers: number;
    upvotes: number;
  };
}

// Enhanced cache instance
const contextCache = new ContextCache();

// Platform context for AI - moved to constant to avoid recreation
export const PLATFORM_CONTEXT = `Stride Campus is a verified campus community platform for students. Key features:

**Core Platform:**
- Verified student communities using school emails
- Credit-based economy rewarding participation
- Spaces for campus communities, clubs, courses
- Shared Library for educational resources
- Polls and discussions for campus engagement

**Credit System:**
- Earn: Upload resources (+20), receive upvotes (+1), daily login (+5), Nia chat bonus (1-20)
- Spend: Download files (50-250), chat with Nia (+1), create polls
- Levels: Novice→Apprentice→Scholar→Expert→Master→Sage→Luminary→Legend→Mythic→Transcendent

**Value Proposition:**
- Connect with verified campus communities
- Share and access educational resources
- Build influence through credit system
- Official spaces for schools/clubs
- Authentic student interactions only

**Target Users:** University students in Kenya (KU, UoN, Strathmore, JKUAT, etc.)
**Company:** Built by Spiritbulb team (spiritbulb.org)
**Website:** stridecampus.com

**IMPORTANT:** All user data in the context below is REAL and from the database. Do not make up or hallucinate any numbers, stats, or credit information. Only reference what is actually provided.`;

// Request deduplication
const pendingRequests = new Map<string, Promise<OptimizedUserContext>>();

/**
 * Fetch comprehensive user context with token optimization and caching
 */
export async function fetchUserContext(user: User): Promise<OptimizedUserContext> {
  // Check cache first
  const cached = contextCache.get(user.id);
  if (cached) {
    return cached;
  }

  // Deduplicate simultaneous requests
  const pending = pendingRequests.get(user.id);
  if (pending) {
    return pending;
  }

  const request = performUserContextFetch(user);
  pendingRequests.set(user.id, request);

  try {
    const context = await request;
    return context;
  } finally {
    pendingRequests.delete(user.id);
  }
}

/**
 * Actual fetch implementation separated for clarity
 */
async function performUserContextFetch(user: User): Promise<OptimizedUserContext> {
  try {
    // Fetch all data in parallel with optimized queries
    const [
      creditSummary,
      userSpaces,
      userResources,
      userPosts,
      userArchive
    ] = await Promise.allSettled([
      getUserCreditSummary(user.id),
      fetchUserSpaces(user.id),
      fetchUserResources(user.id),
      fetchUserPosts(user.id),
      getUserArchive(user.id, 5) // Limit to 5 for summary
    ]);

    // Process results with error handling for each
    const creditData = creditSummary.status === 'fulfilled' ? creditSummary.value : null;
    const spacesData = userSpaces.status === 'fulfilled' ? userSpaces.value : { total: 0, adminCount: 0, recent: [] };
    const resourcesData = userResources.status === 'fulfilled' ? userResources.value : [];
    const postsData = userPosts.status === 'fulfilled' ? userPosts.value : [];
    const archiveData = userArchive.status === 'fulfilled' ? userArchive.value : { resources: [] };

    // Get top resource categories efficiently
    const topCategories = getTopCategories(resourcesData);

    // Get recent transaction types
    const recentActivity = creditData?.recentTransactions
      ?.slice(0, 3)
      .map(t => t.category)
      .join(', ') || 'none';

    const context: OptimizedUserContext = {
      profile: {
        username: user.username,
        school: user.school_name || 'Unknown',
        level: user.level_name,
        credits: user.credits,
        verified: user.is_verified
      },
      spaces: {
        joined: spacesData.total,
        admin: spacesData.adminCount,
        recent: spacesData.recent.map(s => s.display_name)
      },
      resources: {
        uploaded: resourcesData.length,
        purchased: archiveData.resources?.length || 0,
        categories: topCategories
      },
      credits: {
        level: creditData?.levelInfo?.name || user.level_name,
        balance: user.credits,
        recentActivity
      },
      social: {
        posts: postsData.length,
        followers: 0, // TODO: Add followers count when available in User interface
        upvotes: postsData.reduce((sum, post) => sum + (post.upvotes || 0), 0)
      }
    };

    // Cache the result
    contextCache.set(user.id, context);
    
    return context;
  } catch (error) {
    console.error('Error fetching user context:', error);
    
    // Return minimal context on error
    const fallbackContext: OptimizedUserContext = createFallbackContext(user);
    
    // Cache fallback to avoid repeated errors (shorter TTL might be better here)
    contextCache.set(user.id, fallbackContext);
    return fallbackContext;
  }
}

/**
 * Extract category calculation for better readability and performance
 */
function getTopCategories(resources: any[]): string[] {
  if (!resources.length) return [];

  const categories = resources.reduce((acc: Record<string, number>, resource) => {
    const category = resource.file_category || 'other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(categories)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([category]) => category);
}

/**
 * Create fallback context for error scenarios
 */
function createFallbackContext(user: User): OptimizedUserContext {
  return {
    profile: {
      username: user.username,
      school: user.school_name || 'Unknown',
      level: user.level_name,
      credits: user.credits,
      verified: user.is_verified
    },
    spaces: { joined: 0, admin: 0, recent: [] },
    resources: { uploaded: 0, purchased: 0, categories: [] },
    credits: { level: user.level_name, balance: user.credits, recentActivity: 'none' },
    social: { posts: 0, followers: 0, upvotes: 0 }
  };
}

/**
 * Fetch user's spaces with role information - optimized query
 */
async function fetchUserSpaces(userId: string): Promise<{
  total: number;
  adminCount: number;
  recent: Space[];
}> {
  try {
    const { data: memberships, error } = await supabase
      .from('space_memberships')
      .select(`
        role,
        spaces (
          id,
          display_name,
          name,
          is_public,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5); // Reduced from 10 to 5 since we only use 3

    if (error) throw error;

    const spaces = memberships?.map(m => m.spaces).filter(Boolean) || [];
    const adminCount = memberships?.filter(m => m.role === 'admin').length || 0;

    return {
      total: spaces.length,
      adminCount,
      recent: spaces.slice(0, 3) as unknown as Space[]
    };
  } catch (error) {
    console.error('Error fetching user spaces:', error);
    return { total: 0, adminCount: 0, recent: [] };
  }
}

/**
 * Fetch user's uploaded resources - optimized with only needed fields
 */
async function fetchUserResources(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('library')
      .select('file_category')
      .eq('user_id', userId)
      .limit(15); // Reduced from 20 since we only need categories

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user resources:', error);
    return [];
  }
}

/**
 * Fetch user's posts with engagement metrics - optimized
 */
async function fetchUserPosts(userId: string): Promise<any[]> {
  try {
    // Get posts first with limit
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', userId)
      .limit(5); // Reduced from 10

    if (postsError) throw postsError;
    
    if (!posts || posts.length === 0) {
      return [];
    }
    
    // Get vote counts for all posts in one query
    const postIds = posts.map(post => post.id);
    const { data: votes, error: votesError } = await supabase
      .from('post_votes')
      .select('post_id')
      .in('post_id', postIds)
      .eq('vote_type', 1); // Only upvotes
    
    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return posts.map(post => ({ ...post, upvotes: 0 }));
    }
    
    // Count upvotes per post efficiently
    const voteCounts = votes?.reduce((acc, vote) => {
      acc[vote.post_id] = (acc[vote.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Combine posts with vote counts
    return posts.map(post => ({
      ...post,
      upvotes: voteCounts[post.id] || 0
    }));
    
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

/**
 * Convert context to token-efficient string format
 */
export function contextToString(context: OptimizedUserContext): string {
  const { profile, spaces, resources, credits, social } = context;
  
  return `User Context:
- ${profile.username} (${profile.school}) - ${profile.level} level, ${profile.credits} credits
- Joined ${spaces.joined} spaces (${spaces.admin} admin), recent: ${spaces.recent.join(', ')}
- Uploaded ${resources.uploaded} resources, purchased ${resources.purchased}, top categories: ${resources.categories.join(', ')}
- Recent activity: ${credits.recentActivity}
- Social: ${social.posts} posts, ${social.followers} followers, ${social.upvotes} upvotes`;
}

/**
 * Get subtle engagement suggestions based on user context (for internal use)
 * This is more aggressive than contextual hints - use sparingly
 */
export function getSellingPoints(context: OptimizedUserContext): string {
  const { profile, spaces, resources, credits, social } = context;
  
  const points = [];
  
  // Credit-based incentives
  if (credits.balance < 100) {
    points.push("Earn credits by uploading resources (+20) and getting upvotes (+1)");
  }
  
  // Space engagement
  if (spaces.joined < 3) {
    points.push("Join more campus spaces to connect with different communities");
  }
  
  // Resource sharing
  if (resources.uploaded < 5) {
    points.push("Share study materials to earn credits and help fellow students");
  }
  
  // Social engagement
  if (social.posts < 3) {
    points.push("Create posts and polls to build your campus influence");
  }
  
  // Level progression
  if (credits.level === 'Novice' || credits.level === 'Apprentice') {
    points.push("Level up by earning credits - unlock higher status and perks");
  }
  
  return points.length > 0 ? points.join('. ') : "You're doing great! Keep engaging to maximize your campus impact.";
}

/**
 * Get subtle contextual hints only when conversationally relevant
 */
export function getContextualHints(context: OptimizedUserContext, userInput: string): string {
  const input = userInput.toLowerCase();
  const hints = [];
  
  // Only provide hints when user is asking about relevant topics
  if (input.includes('credit') || input.includes('earn') || input.includes('money')) {
    if (context.credits.balance < 50) {
      hints.push("User has low credits - could mention earning opportunities if they ask");
    }
  }
  
  if (input.includes('space') || input.includes('join') || input.includes('community')) {
    if (context.spaces.joined < 2) {
      hints.push("User in few spaces - could mention exploring more communities if relevant");
    }
  }
  
  if (input.includes('upload') || input.includes('share') || input.includes('resource')) {
    if (context.resources.uploaded < 3) {
      hints.push("User hasn't uploaded much - could mention sharing benefits if they ask");
    }
  }
  
  if (input.includes('level') || input.includes('progress') || input.includes('status')) {
    if (context.credits.level === 'Novice' || context.credits.level === 'Apprentice') {
      hints.push("User is early level - could mention leveling up if they ask about progression");
    }
  }
  
  if (input.includes('post') || input.includes('discuss') || input.includes('talk')) {
    if (context.social.posts < 2) {
      hints.push("User hasn't posted much - could mention engagement if they ask about participation");
    }
  }
  
  // Only return hints if user is actually asking about related topics
  return hints.length > 0 ? hints.join('. ') : '';
}

/**
 * Clear context cache (useful for testing or when user data changes)
 */
export function clearContextCache(userId?: string): void {
  if (userId) {
    contextCache.delete(userId);
  } else {
    contextCache.clear();
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): ReturnType<ContextCache['getStats']> {
  return contextCache.getStats();
}

/**
 * Prefetch user context for anticipated needs
 */
export function prefetchUserContext(user: User): void {
  if (!contextCache.get(user.id)) {
    fetchUserContext(user).catch(error => {
      console.warn('Prefetch failed:', error);
    });
  }
}