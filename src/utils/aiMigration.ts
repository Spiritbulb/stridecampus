import { supabase } from '@/utils/supabaseClient';

// Migration script to move AI chat data from JSON database to Supabase
// This script should be run once to migrate existing data

interface JsonMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface JsonSession {
  id: string;
  title: string;
  messages: JsonMessage[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  messageCount: number;
}

interface JsonDatabase {
  sessions: Record<string, JsonSession>;
  activeSessionId: string | null;
  lastSyncTime: string;
  version: string;
  userId: string;
}

/**
 * Load JSON database data from file
 */
async function loadJsonDatabase(userId: string): Promise<JsonDatabase | null> {
  try {
    const response = await fetch(`/api/database/load?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      console.log(`No existing JSON data found for user ${userId}`);
      return null;
    }
    
    const data = await response.json();
    
    // Validate database structure
    if (!data.sessions || !data.version || !data.userId) {
      throw new Error('Invalid JSON database structure');
    }
    
    return data;
  } catch (error) {
    console.error('Error loading JSON database:', error);
    return null;
  }
}

/**
 * Migrate a single session from JSON to Supabase
 */
async function migrateSession(userId: string, session: JsonSession): Promise<string | null> {
  try {
    // Create the session in Supabase
    const { data: newSession, error: sessionError } = await supabase
      .from('ai_chat_sessions')
      .insert([
        {
          user_id: userId,
          title: session.title,
          is_active: session.isActive,
          message_count: session.messageCount,
          created_at: session.createdAt,
          updated_at: session.updatedAt,
        }
      ])
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return null;
    }

    // Migrate messages if any exist
    if (session.messages && session.messages.length > 0) {
      const messagesToInsert = session.messages.map(msg => ({
        session_id: newSession.id,
        content: msg.content,
        is_user: msg.isUser,
        created_at: msg.timestamp,
      }));

      const { error: messagesError } = await supabase
        .from('ai_chat_messages')
        .insert(messagesToInsert);

      if (messagesError) {
        console.error('Error inserting messages:', messagesError);
        // Continue with session creation even if messages fail
      }
    }

    console.log(`Successfully migrated session: ${session.title} (${session.messageCount} messages)`);
    return newSession.id;
  } catch (error) {
    console.error('Error migrating session:', error);
    return null;
  }
}

/**
 * Migrate all sessions for a user from JSON to Supabase
 */
export async function migrateUserData(userId: string): Promise<{
  success: boolean;
  sessionsMigrated: number;
  messagesMigrated: number;
  errors: string[];
}> {
  const result = {
    success: false,
    sessionsMigrated: 0,
    messagesMigrated: 0,
    errors: [] as string[],
  };

  try {
    console.log(`Starting migration for user: ${userId}`);
    
    // Load JSON database
    const jsonData = await loadJsonDatabase(userId);
    if (!jsonData) {
      console.log(`No JSON data found for user ${userId}, skipping migration`);
      result.success = true;
      return result;
    }

    console.log(`Found ${Object.keys(jsonData.sessions).length} sessions to migrate`);

    // Check if user already has Supabase data
    const { data: existingSessions, error: checkError } = await supabase
      .from('ai_chat_sessions')
      .select('id')
      .eq('user_id', userId);

    if (checkError) {
      result.errors.push(`Error checking existing data: ${checkError.message}`);
      return result;
    }

    if (existingSessions && existingSessions.length > 0) {
      console.log(`User ${userId} already has ${existingSessions.length} sessions in Supabase, skipping migration`);
      result.success = true;
      return result;
    }

    // Migrate each session
    const sessions = Object.values(jsonData.sessions);
    let totalMessages = 0;

    for (const session of sessions) {
      const migratedSessionId = await migrateSession(userId, session);
      if (migratedSessionId) {
        result.sessionsMigrated++;
        totalMessages += session.messageCount;
      } else {
        result.errors.push(`Failed to migrate session: ${session.title}`);
      }
    }

    result.messagesMigrated = totalMessages;
    result.success = result.sessionsMigrated > 0;

    console.log(`Migration completed for user ${userId}:`, {
      sessionsMigrated: result.sessionsMigrated,
      messagesMigrated: result.messagesMigrated,
      errors: result.errors.length,
    });

  } catch (error) {
    console.error('Migration failed:', error);
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Migrate data for all users (admin function)
 */
export async function migrateAllUsersData(): Promise<{
  totalUsers: number;
  successfulUsers: number;
  failedUsers: string[];
  totalSessionsMigrated: number;
  totalMessagesMigrated: number;
}> {
  const result = {
    totalUsers: 0,
    successfulUsers: 0,
    failedUsers: [] as string[],
    totalSessionsMigrated: 0,
    totalMessagesMigrated: 0,
  };

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return result;
    }

    if (!users || users.length === 0) {
      console.log('No users found');
      return result;
    }

    result.totalUsers = users.length;
    console.log(`Starting migration for ${result.totalUsers} users`);

    // Migrate each user
    for (const user of users) {
      try {
        const userResult = await migrateUserData(user.id);
        
        if (userResult.success) {
          result.successfulUsers++;
          result.totalSessionsMigrated += userResult.sessionsMigrated;
          result.totalMessagesMigrated += userResult.messagesMigrated;
        } else {
          result.failedUsers.push(user.id);
        }
      } catch (error) {
        console.error(`Failed to migrate user ${user.id}:`, error);
        result.failedUsers.push(user.id);
      }
    }

    console.log('Migration completed:', result);
  } catch (error) {
    console.error('Bulk migration failed:', error);
  }

  return result;
}

/**
 * Verify migration integrity
 */
export async function verifyMigration(userId: string): Promise<{
  jsonSessions: number;
  jsonMessages: number;
  supabaseSessions: number;
  supabaseMessages: number;
  matches: boolean;
}> {
  const result = {
    jsonSessions: 0,
    jsonMessages: 0,
    supabaseSessions: 0,
    supabaseMessages: 0,
    matches: false,
  };

  try {
    // Load JSON data
    const jsonData = await loadJsonDatabase(userId);
    if (jsonData) {
      result.jsonSessions = Object.keys(jsonData.sessions).length;
      result.jsonMessages = Object.values(jsonData.sessions).reduce(
        (sum, session) => sum + session.messageCount, 
        0
      );
    }

    // Load Supabase data
    const { data: sessions, error: sessionsError } = await supabase
      .from('ai_chat_sessions')
      .select('id, message_count')
      .eq('user_id', userId);

    if (!sessionsError && sessions) {
      result.supabaseSessions = sessions.length;
      result.supabaseMessages = sessions.reduce((sum, session) => sum + session.message_count, 0);
    }

    result.matches = result.jsonSessions === result.supabaseSessions && 
                    result.jsonMessages === result.supabaseMessages;

    console.log(`Verification for user ${userId}:`, result);
  } catch (error) {
    console.error('Verification failed:', error);
  }

  return result;
}
