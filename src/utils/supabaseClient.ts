import { createClient } from '@supabase/supabase-js';
import { LibraryFile } from '@/components/library/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on your schema
export interface Space {
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
  user_role?: string;
  logo_url?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string | null;
  space_id: string;
  author_id: string;
  is_link_post: boolean;
  link_url: string | null;
  created_at: string;
  updated_at: string;
  vote_count?: number;
  user_vote?: number;
  comment_count?: number;
  share_count?: number;
  pinned: boolean;
  author?: {
    full_name: string;
    avatar_url?: string;
    checkmark: boolean;
    username: string;
  };
  space?: {
    name: string;
    display_name: string;
    id: string;
  };
  resource_tags?: LibraryFile[];
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  vote_count?: number;
  user_vote?: number;
  author?: {
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
  resource_tags?: LibraryFile[];
}

export interface PostVote {
  id: string;
  post_id: string;
  user_id: string;
  vote_type: number;
  created_at: string;
}

export interface CommentVote {
  id: string;
  comment_id: string;
  user_id: string;
  vote_type: number;
  created_at: string;
}

export interface PostShare {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface ResourceTag {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  resource_id: string;
  created_at: string;
  resource?: LibraryFile;
  library_id: string;
}


export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  school_email?: string;
  school_domain?: string;
  school_name?: string;
  credits: number;
  level_name: string;
  level_points: number;
  referral_code: string;
  is_verified: boolean;
  checkmark: boolean;
  login_streak: number;
  last_login_date?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  year_of_study?: string;
  major?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  recipient_id: string;
  sender_id: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  type: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  school_domain: string;
  credits: number;
  rank_position: number;
  users: {
    full_name: string;
    avatar_url?: string;
    school_name?: string;
  };
}