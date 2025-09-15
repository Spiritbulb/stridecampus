import { supabase, type User } from '@/utils/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Cache for user profiles to avoid redundant fetches
export const userProfileCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const VALID_SCHOOL_DOMAINS = [
  'ac.ke',
  'sc.ke'
];

// Common non-educational domains to reject
const INVALID_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  // Add more personal email domains
];

export function isValidSchoolEmail(email: string): { isValid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  const domain = email.split('@')[1].toLowerCase();
  const domainParts = domain.split('.');
  const topLevelDomain = domainParts[domainParts.length - 1];

  // Check if it's a known personal email domain
  if (INVALID_DOMAINS.includes(domain)) {
    return { 
      isValid: false, 
      message: 'Please use your school email address, not a personal email' 
    };
  }

  // Check for educational top-level domains or .edu subdomains
  if (VALID_SCHOOL_DOMAINS.includes(topLevelDomain) || domain.endsWith('.edu')) {
    return { isValid: true };
  }

  // Additional check for common school domain patterns
  if (domain.includes('.edu.') || domain.includes('.ac.')) {
    return { isValid: true };
  }

  // If we're not sure, allow but warn (you can make this stricter)
  return { 
    isValid: true,
    message: 'Please ensure this is your official school email address'
  };
}

export async function isUsernameAvailable(username: string): Promise<{ available: boolean; message?: string }> {
  try {
    // Basic validation
    if (!username || username.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters long' };
    }

    if (username.length > 20) {
      return { available: false, message: 'Username must be less than 20 characters' };
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return { 
        available: false, 
        message: 'Username can only contain letters, numbers, and underscores' 
      };
    }

    // Check reserved usernames
    const reservedUsernames = ['admin', 'administrator', 'root', 'system', 'support', 'help'];
    if (reservedUsernames.includes(username.toLowerCase())) {
      return { available: false, message: 'This username is not available' };
    }

    // Check database for existing username
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('Error checking username:', error);
      return { available: false, message: 'Error checking username availability' };
    }

    if (data) {
      return { available: false, message: 'Username is already taken' };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return { available: false, message: 'Error checking username availability' };
  }
}

export async function fetchUserProfile(userId: string, forceRefresh = false): Promise<User | null> {
  try {
    // Check cache first unless forced refresh
    const cachedUser = userProfileCache.get(userId);
    if (cachedUser && !forceRefresh && Date.now() - cachedUser.timestamp < CACHE_DURATION) {
      return cachedUser.user;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    // Update cache
    userProfileCache.set(userId, { user: data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateLoginStreak(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('login_streak, last_login_date, credits')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data for streak update:', userError);
      return;
    }
    if (!userData) return;

    const lastLogin = userData.last_login_date;
    
    // Don't update if already logged in today
    if (lastLogin === today) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastLogin === yesterdayStr) {
      newStreak = userData.login_streak + 1;
    }

    // Award daily login credits only if streak increased
    const shouldAwardCredits = newStreak > userData.login_streak;
    const newCredits = shouldAwardCredits ? userData.credits + 5 : userData.credits;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        login_streak: newStreak,
        last_login_date: today,
        credits: newCredits
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating login streak:', updateError);
      return;
    }

    // Log credit transaction and notification only if credits were awarded
    if (shouldAwardCredits) {
      // Don't await these operations to avoid blocking
      Promise.all([
        supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: 5,
            transaction_type: 'daily_login',
            description: `Daily login streak bonus - Day ${newStreak}`
          }),
        supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Daily Login Bonus!',
            message: `+5 credits for your ${newStreak}${newStreak === 1 ? 'st' : newStreak === 2 ? 'nd' : newStreak === 3 ? 'rd' : 'th'} consecutive login`,
            type: 'credit_earned'
          }),
        supabase
          .from('leaderboard')
          .update({
            credits: newCredits
          })
          .eq('user_id', userId)
      ]).catch(error => {
        console.error('Error with login bonus operations:', error);
      });
    }

    // Force refresh user profile to get updated data
    await fetchUserProfile(userId, true);
  } catch (error) {
    console.error('Error updating login streak:', error);
  }
}

export async function initializeAuth(): Promise<{ session: Session | null; user: User | null }> {
  try {
    // Always fetch fresh session data from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { session: null, user: null };
    }
    
    let user = null;
    if (session?.user) {
      // Fetch user profile
      user = await fetchUserProfile(session.user.id);
    }
    
    return { session, user };
  } catch (error) {
    console.error('Error initializing auth:', error);
    return { session: null, user: null };
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

export async function signUp(email: string, password: string, username: string, referralCode?: string): Promise<{ data: any; error: any }> {
  try {
    // Validate school email
    const emailValidation = isValidSchoolEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.message || 'Invalid school email address');
    }

    // Check username availability
    const usernameCheck = await isUsernameAvailable(username);
    if (!usernameCheck.available) {
      throw new Error(usernameCheck.message || 'Username is not available');
    }

    // Extract school domain
    const schoolDomain = email.split('@')[1];
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          school_email: email,
          school_domain: schoolDomain,
          username: username.toLowerCase(),
          credits: 120, // Welcome bonus
          is_verified: true, // Set to true since verification is disabled
          referred_by_code: referralCode || null
        });

      if (profileError) throw profileError;

      // If referral code was provided, create a referral record
      if (referralCode) {
        // Get the referrer's user ID
        const { data: referrerData } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single();

        if (referrerData) {
          // Create referral record
          await supabase
            .from('referrals')
            .insert({
              referrer_id: referrerData.id,
              referred_id: authData.user.id,
              referral_code: referralCode,
              status: 'pending'
            });
        }
      }


      // Add welcome bonus operations in background
      Promise.all([
        supabase
          .from('credit_transactions')
          .insert({
            user_id: authData.user.id,
            amount: 120,
            transaction_type: 'welcome_bonus',
            description: 'Welcome bonus'
          }),
        supabase
          .from('notifications')
          .insert({
            user_id: authData.user.id,
            title: 'Welcome to StrideCampus!',
            message: 'You received 120 welcome credits to get started',
            type: 'welcome'
          }),
        supabase
          .from('leaderboard')
          .insert({
            user_id: authData.user.id,
            school_domain: schoolDomain,
            credits: 120,
          })
      ]).catch(error => {
        console.error('Error with welcome bonus operations:', error);
      });

      // Create and cache the new user profile
      //@ts-ignore
      const newUser = {
        id: authData.user.id,
        email,
        school_email: email,
        school_domain: schoolDomain,
        username: username,
        credits: 120,
        is_verified: true,
        login_streak: 0,
        last_login_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        referred_by_code: referralCode || null
      } as User;
      
      userProfileCache.set(authData.user.id, { user: newUser, timestamp: Date.now() });
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }
}

export async function signIn(email: string, password: string): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
}

export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear cache on sign out
    userProfileCache.clear();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export async function updateUser(user: User, updatedFields: Partial<User>): Promise<{ data: User | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updatedFields)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update cache
    const updatedUser = { ...user, ...data, updated_at: new Date().toISOString() };
    userProfileCache.set(user.id, { user: updatedUser, timestamp: Date.now() });

    return { data: updatedUser, error: null };
  } catch (error) {
    console.error('Update user error:', error);
    return { data: null, error };
  }
}

export async function refreshUser(session: Session | null): Promise<User | null> {
  if (session?.user) {
    return fetchUserProfile(session.user.id, true);
  }
  return null;
}

// Auth state change listener setup
export function setupAuthListener(
  onAuthChange: (event: string, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    onAuthChange(event, session);
  });

  return subscription;
}