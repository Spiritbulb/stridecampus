import { supabase } from './supabaseClient';

// Credit Economy Configuration
export const CREDIT_CONFIG = {
  // Earning Rules
  EARN: {
    RESOURCE_UPLOAD: 20,           // Uploading a resource (file or link)
    UPVOTE_RECEIVED: 1,            // Per upvote received on posts
    FOLLOWER_MILESTONE: 10,        // Every 100 new followers
    FOLLOWER_MILESTONE_THRESHOLD: 100,
    NIA_CHAT_BONUS_MAX: 20,        // Max random bonus from Nia per session
    DAILY_LOGIN: 5,                // Daily login streak bonus
    WELCOME_BONUS: 120,            // New user welcome bonus
  },
  
  // Spending Rules
  SPEND: {
    FILE_DOWNLOAD_MIN: 50,         // Minimum cost for file downloads
    FILE_DOWNLOAD_MAX: 250,        // Maximum cost for file downloads
    NIA_MESSAGE: 1,               // Cost per message to Nia AI
  },
  
  // Level System
  LEVELS: {
    // Level progression based on total credits earned (not current balance)
    // Each level requires exponentially more credits
    LEVEL_THRESHOLDS: [
      { level: 1, name: "Novice", creditsRequired: 0 },
      { level: 2, name: "Apprentice", creditsRequired: 100 },
      { level: 3, name: "Scholar", creditsRequired: 300 },
      { level: 4, name: "Expert", creditsRequired: 600 },
      { level: 5, name: "Master", creditsRequired: 1000 },
      { level: 6, name: "Sage", creditsRequired: 1500 },
      { level: 7, name: "Luminary", creditsRequired: 2200 },
      { level: 8, name: "Legend", creditsRequired: 3000 },
      { level: 9, name: "Mythic", creditsRequired: 4000 },
      { level: 10, name: "Transcendent", creditsRequired: 5000 },
    ]
  }
};

// Transaction Types
export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
  BONUS = 'bonus',
  PENALTY = 'penalty'
}

export enum TransactionCategory {
  RESOURCE_UPLOAD = 'resource_upload',
  UPVOTE_RECEIVED = 'upvote_received',
  FOLLOWER_MILESTONE = 'follower_milestone',
  NIA_CHAT_BONUS = 'nia_chat_bonus',
  DAILY_LOGIN = 'daily_login',
  WELCOME_BONUS = 'welcome_bonus',
  FILE_DOWNLOAD = 'file_download',
  NIA_MESSAGE = 'nia_message',
  REFERRAL_BONUS = 'referral_bonus',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  RESOURCE_PURCHASE = 'resource_purchase',
  RESOURCE_COMMISSION = 'resource_commission'
}

// Interface for credit transactions
export interface CreditTransaction {
  userId: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

// Interface for level information
export interface LevelInfo {
  level: number;
  name: string;
  creditsRequired: number;
  creditsToNext: number;
  progressPercentage: number;
}

/**
 * Calculate file download cost based on file size
 */
export function calculateFileDownloadCost(fileSizeBytes: number): number {
  const sizeMB = fileSizeBytes / (1024 * 1024);
  
  // Linear scaling between min and max cost based on file size
  // Files under 1MB = min cost, files over 10MB = max cost
  const minSizeMB = 1;
  const maxSizeMB = 10;
  
  if (sizeMB <= minSizeMB) {
    return CREDIT_CONFIG.SPEND.FILE_DOWNLOAD_MIN;
  }
  
  if (sizeMB >= maxSizeMB) {
    return CREDIT_CONFIG.SPEND.FILE_DOWNLOAD_MAX;
  }
  
  // Linear interpolation
  const ratio = (sizeMB - minSizeMB) / (maxSizeMB - minSizeMB);
  const costRange = CREDIT_CONFIG.SPEND.FILE_DOWNLOAD_MAX - CREDIT_CONFIG.SPEND.FILE_DOWNLOAD_MIN;
  
  return Math.round(CREDIT_CONFIG.SPEND.FILE_DOWNLOAD_MIN + (ratio * costRange));
}

/**
 * Calculate user's current level based on total credits earned
 */
export function calculateUserLevel(totalCreditsEarned: number): LevelInfo {
  const levels = CREDIT_CONFIG.LEVELS.LEVEL_THRESHOLDS;
  
  // Find current level
  let currentLevel = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalCreditsEarned >= levels[i].creditsRequired) {
      currentLevel = levels[i];
      break;
    }
  }
  
  // Find next level
  const nextLevelIndex = levels.findIndex(level => level.level === currentLevel.level + 1);
  const nextLevel = nextLevelIndex !== -1 ? levels[nextLevelIndex] : null;
  
  const creditsToNext = nextLevel ? nextLevel.creditsRequired - totalCreditsEarned : 0;
  const progressPercentage = nextLevel 
    ? Math.min(100, Math.max(0, ((totalCreditsEarned - currentLevel.creditsRequired) / (nextLevel.creditsRequired - currentLevel.creditsRequired)) * 100))
    : 100;
  
  return {
    level: currentLevel.level,
    name: currentLevel.name,
    creditsRequired: currentLevel.creditsRequired,
    creditsToNext,
    progressPercentage
  };
}

/**
 * Get total credits earned by a user (sum of all positive transactions)
 */
export async function getTotalCreditsEarned(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', TransactionType.EARN);
    
    if (error) throw error;
    
    return data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
  } catch (error) {
    console.error('Error getting total credits earned:', error);
    return 0;
  }
}

/**
 * Check if user has enough credits for a transaction
 */
export async function checkUserCredits(userId: string, requiredAmount: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return data.credits >= requiredAmount;
  } catch (error) {
    console.error('Error checking user credits:', error);
    return false;
  }
}

/**
 * Process a credit transaction with atomic database operations
 */
export async function processCreditTransaction(transaction: CreditTransaction): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user has enough credits for spending transactions
    if (transaction.type === TransactionType.SPEND) {
      const hasEnoughCredits = await checkUserCredits(transaction.userId, transaction.amount);
      if (!hasEnoughCredits) {
        return { success: false, error: 'Insufficient credits' };
      }
    }
    
    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits, level_name, level_points')
      .eq('id', transaction.userId)
      .single();
    
    if (userError) throw userError;
    
    // Calculate new credit balance
    const creditChange = transaction.type === TransactionType.EARN ? transaction.amount : -transaction.amount;
    const newCredits = userData.credits + creditChange;
    
    // Ensure credits don't go negative
    if (newCredits < 0) {
      return { success: false, error: 'Insufficient credits' };
    }
    
    // Get total credits earned for level calculation
    const totalCreditsEarned = await getTotalCreditsEarned(transaction.userId);
    const newTotalEarned = transaction.type === TransactionType.EARN 
      ? totalCreditsEarned + transaction.amount 
      : totalCreditsEarned;
    
    // Calculate new level
    const levelInfo = calculateUserLevel(newTotalEarned);
    
    // Use database transaction to ensure atomicity
    const { error: transactionError } = await supabase.rpc('process_credit_transaction', {
      p_user_id: transaction.userId,
      p_amount: transaction.amount,
      p_type: transaction.type,
      p_category: transaction.category,
      p_description: transaction.description,
      p_reference_id: transaction.referenceId || null,
      p_metadata: transaction.metadata || {},
      p_new_credit_balance: newCredits,
      p_new_level_name: levelInfo.name,
      p_new_level_points: levelInfo.level
    });
    
    if (transactionError) throw transactionError;
    
    return { success: true };
  } catch (error) {
    console.error('Error processing credit transaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Award credits for resource upload
 */
export async function awardResourceUploadCredits(userId: string, resourceId: string, resourceType: 'file' | 'link'): Promise<{ success: boolean; error?: string }> {
  return processCreditTransaction({
    userId,
    amount: CREDIT_CONFIG.EARN.RESOURCE_UPLOAD,
    type: TransactionType.EARN,
    category: TransactionCategory.RESOURCE_UPLOAD,
    description: `${resourceType} upload reward`,
    referenceId: `upload_${resourceId}`,
    metadata: { resourceId, resourceType }
  });
}

/**
 * Award credits for upvotes received
 */
export async function awardUpvoteCredits(userId: string, postId: string, upvoteCount: number): Promise<{ success: boolean; error?: string }> {
  const totalCredits = upvoteCount * CREDIT_CONFIG.EARN.UPVOTE_RECEIVED;
  
  return processCreditTransaction({
    userId,
    amount: totalCredits,
    type: TransactionType.EARN,
    category: TransactionCategory.UPVOTE_RECEIVED,
    description: `Received ${upvoteCount} upvote${upvoteCount > 1 ? 's' : ''}`,
    referenceId: `upvotes_${postId}`,
    metadata: { postId, upvoteCount }
  });
}

/**
 * Award credits for follower milestones
 */
export async function awardFollowerMilestoneCredits(userId: string, followerCount: number): Promise<{ success: boolean; error?: string }> {
  const milestonesReached = Math.floor(followerCount / CREDIT_CONFIG.EARN.FOLLOWER_MILESTONE_THRESHOLD);
  const totalCredits = milestonesReached * CREDIT_CONFIG.EARN.FOLLOWER_MILESTONE;
  
  if (totalCredits === 0) {
    return { success: true }; // No milestone reached
  }
  
  return processCreditTransaction({
    userId,
    amount: totalCredits,
    type: TransactionType.EARN,
    category: TransactionCategory.FOLLOWER_MILESTONE,
    description: `Follower milestone: ${followerCount} followers`,
    referenceId: `followers_${followerCount}`,
    metadata: { followerCount, milestonesReached }
  });
}

/**
 * Award random Nia chat bonus (up to max per session)
 */
export async function awardNiaChatBonus(userId: string, sessionId: string, bonusAmount: number): Promise<{ success: boolean; error?: string }> {
  // Ensure bonus doesn't exceed maximum
  const actualBonus = Math.min(bonusAmount, CREDIT_CONFIG.EARN.NIA_CHAT_BONUS_MAX);
  
  return processCreditTransaction({
    userId,
    amount: actualBonus,
    type: TransactionType.EARN,
    category: TransactionCategory.NIA_CHAT_BONUS,
    description: `Nia chat engagement bonus`,
    referenceId: `nia_chat_${sessionId}`,
    metadata: { sessionId, bonusAmount: actualBonus }
  });
}

/**
 * Charge credits for file download
 */
export async function chargeFileDownloadCredits(userId: string, fileId: string, fileSizeBytes: number): Promise<{ success: boolean; error?: string; cost?: number }> {
  const cost = calculateFileDownloadCost(fileSizeBytes);
  
  const result = await processCreditTransaction({
    userId,
    amount: cost,
    type: TransactionType.SPEND,
    category: TransactionCategory.FILE_DOWNLOAD,
    description: `File download (${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB)`,
    referenceId: `download_${fileId}`,
    metadata: { fileId, fileSizeBytes, cost }
  });
  
  return { ...result, cost };
}

/**
 * Charge credits for Nia message
 */
export async function chargeNiaMessageCredits(userId: string, messageId: string): Promise<{ success: boolean; error?: string }> {
  return processCreditTransaction({
    userId,
    amount: CREDIT_CONFIG.SPEND.NIA_MESSAGE,
    type: TransactionType.SPEND,
    category: TransactionCategory.NIA_MESSAGE,
    description: 'Nia AI message',
    referenceId: `nia_message_${messageId}`,
    metadata: { messageId }
  });
}

/**
 * Award daily login credits
 */
export async function awardDailyLoginCredits(userId: string, streakDay: number): Promise<{ success: boolean; error?: string }> {
  return processCreditTransaction({
    userId,
    amount: CREDIT_CONFIG.EARN.DAILY_LOGIN,
    type: TransactionType.EARN,
    category: TransactionCategory.DAILY_LOGIN,
    description: `Daily login streak bonus - Day ${streakDay}`,
    referenceId: `login_${new Date().toISOString().split('T')[0]}`,
    metadata: { streakDay, date: new Date().toISOString().split('T')[0] }
  });
}

/**
 * Award welcome bonus credits
 */
export async function awardWelcomeBonusCredits(userId: string): Promise<{ success: boolean; error?: string }> {
  return processCreditTransaction({
    userId,
    amount: CREDIT_CONFIG.EARN.WELCOME_BONUS,
    type: TransactionType.EARN,
    category: TransactionCategory.WELCOME_BONUS,
    description: 'Welcome bonus',
    referenceId: `welcome_${userId}`,
    metadata: { isWelcomeBonus: true }
  });
}

/**
 * Get user's credit summary including level information
 */
export async function getUserCreditSummary(userId: string): Promise<{
  currentCredits: number;
  totalEarned: number;
  levelInfo: LevelInfo;
  recentTransactions: any[];
} | null> {
  try {
    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits, level_name, level_points')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Get total credits earned
    const totalEarned = await getTotalCreditsEarned(userId);
    
    // Calculate level info
    const levelInfo = calculateUserLevel(totalEarned);
    
    // Get recent transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transactionError) throw transactionError;
    
    return {
      currentCredits: userData.credits,
      totalEarned,
      levelInfo,
      recentTransactions: transactions || []
    };
  } catch (error) {
    console.error('Error getting user credit summary:', error);
    return null;
  }
}

/**
 * Generate random Nia chat bonus amount
 */
export function generateNiaChatBonus(): number {
  // Random bonus between 1-20 credits, weighted towards lower amounts
  const weights = [0.4, 0.3, 0.2, 0.1]; // 40% chance for 1-5, 30% for 6-10, etc.
  const ranges = [
    { min: 1, max: 5 },
    { min: 6, max: 10 },
    { min: 11, max: 15 },
    { min: 16, max: 20 }
  ];
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      const range = ranges[i];
      return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }
  }
  
  return 1; // Fallback
}

/**
 * Process resource purchase with commission payment
 */
export async function processResourcePurchase(
  buyerId: string, 
  resourceId: string, 
  cost: number, 
  commissionRate: number = 0.20
): Promise<{ success: boolean; error?: string; cost?: number; commission?: number }> {
  try {
    // Validate user UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(buyerId)) {
      console.error('Invalid buyer ID format:', buyerId);
      return { success: false, error: 'Invalid buyer ID format' };
    }
    
    // Validate resource ID (should be numeric for int8)
    const resourceIdNum = parseInt(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      console.error('Invalid resource ID format:', resourceId);
      return { success: false, error: 'Invalid resource ID format' };
    }

    const { data, error } = await supabase.rpc('process_resource_purchase', {
      p_buyer_id: buyerId,
      p_resource_id: resourceIdNum,
      p_cost: cost,
      p_commission_rate: commissionRate
    });

    if (error) throw error;

    return {
      success: data.success,
      error: data.error,
      cost: data.cost,
      commission: data.commission
    };
  } catch (error) {
    console.error('Error processing resource purchase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has purchased a resource
 */
export async function hasUserPurchasedResource(userId: string, resourceId: string): Promise<boolean> {
  try {
    // Validate user UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(userId)) {
      console.error('Invalid user ID format:', userId);
      return false;
    }
    
    // Validate resource ID (should be numeric for int8)
    const resourceIdNum = parseInt(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      console.error('Invalid resource ID format:', resourceId);
      return false;
    }

    const { data, error } = await supabase.rpc('has_user_purchased_resource', {
      p_user_id: userId,
      p_resource_id: resourceIdNum
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return false;
  }
}

/**
 * Get user's archived resources
 */
export async function getUserArchive(userId: string, limit: number = 50, offset: number = 0): Promise<{
  resources: any[];
  total: number;
}> {
  try {
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(userId)) {
      console.error('Invalid user ID format:', userId);
      return { resources: [], total: 0 };
    }

    const { data, error } = await supabase.rpc('get_user_archive', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    });

    if (error) throw error;

    return {
      resources: data || [],
      total: data?.length || 0
    };
  } catch (error) {
    console.error('Error fetching user archive:', error);
    return { resources: [], total: 0 };
  }
}

/**
 * Check if a resource is a file (stored on media.stridecampus.com) vs a link
 */
export function isFileResource(resource: { resource_type: string; filename?: string | null; url?: string | null }): boolean {
  // If it has a filename, it's a file stored on our CDN
  if (resource.filename) {
    return true;
  }
  
  // If it has a URL but no filename, it's an external link
  if (resource.url && !resource.filename) {
    return false;
  }
  
  // Fallback: check resource_type
  return resource.resource_type === 'file';
}

/**
 * Calculate resource purchase cost based on whether it's a file or link
 */
export function calculateResourcePurchaseCost(fileSizeBytes: number, resource: { resource_type: string; filename?: string | null; url?: string | null }): number {
  // Only charge for actual file uploads that consume storage (have filename = stored on media.stridecampus.com)
  if (isFileResource(resource)) {
    // For files, add size-based cost similar to download cost
    const sizeCost = calculateFileDownloadCost(fileSizeBytes);
    return 100 + sizeCost; // Base cost + size factor
  }

  // All link resources (youtube, website, article, document_link) are free
  return 0;
}
