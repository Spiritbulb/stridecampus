import { ChatSession } from '@/hooks/useMessageStore';

// Database configuration
const DB_CONFIG = {
  FILE_NAME: 'nia_chat_sessions.json',
  MAX_SESSIONS: 100,
  MAX_MESSAGES_PER_SESSION: 1000,
  AUTO_SAVE_INTERVAL: 2000, // 2 seconds
  BACKUP_INTERVAL: 300000, // 5 minutes
};

// Database state interface
interface DatabaseState {
  sessions: Record<string, ChatSession>;
  activeSessionId: string | null;
  lastSyncTime: string;
  version: string;
  userId: string;
}

// In-memory cache for fast access
let memoryCache: DatabaseState | null = null;
let lastSaveTime = 0;
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;


/**
 * Initialize database for a user
 */
export async function initializeDatabase(userId: string): Promise<DatabaseState> {
  try {
    // Try to load existing database
    const existingData = await loadDatabase(userId);
    if (existingData) {
      memoryCache = existingData;
      return existingData;
    }
  } catch (error) {
    console.warn('Failed to load existing database, creating new one:', error);
  }

  // Create new database
  const newDatabase: DatabaseState = {
    sessions: {},
    activeSessionId: null,
    lastSyncTime: new Date().toISOString(),
    version: '1.0.0',
    userId,
  };

  memoryCache = newDatabase;
  await saveDatabase(userId, newDatabase);
  return newDatabase;
}

/**
 * Load database from file
 */
async function loadDatabase(userId: string): Promise<DatabaseState | null> {
  try {
    const response = await fetch(`/api/database/load?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Validate database structure
    if (!data.sessions || !data.version || !data.userId) {
      throw new Error('Invalid database structure');
    }
    
    // Convert string dates back to Date objects
    const sessions: Record<string, ChatSession> = {};
    Object.entries(data.sessions).forEach(([id, session]: [string, any]) => {
      sessions[id] = {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
    });
    
    return {
      ...data,
      sessions,
      lastSyncTime: new Date(data.lastSyncTime),
    };
  } catch (error) {
    console.error('Error loading database:', error);
    return null;
  }
}

/**
 * Save database to file
 */
async function saveDatabase(userId: string, data: DatabaseState): Promise<void> {
  try {
    // Convert dates to strings for JSON serialization
    const serializedData = {
      ...data,
      lastSyncTime: typeof data.lastSyncTime === 'string' ? data.lastSyncTime : (data.lastSyncTime as Date).toISOString(),
      sessions: Object.fromEntries(
        Object.entries(data.sessions).map(([id, session]) => [
          id,
          {
            ...session,
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
            messages: session.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString(),
            })),
          },
        ])
      ),
    };

    const response = await fetch('/api/database/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        data: serializedData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save database: ${response.statusText}`);
    }

    lastSaveTime = Date.now();
  } catch (error) {
    console.error('Error saving database:', error);
    throw error;
  }
}

/**
 * Auto-save database if needed
 */
function scheduleAutoSave(userId: string): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(async () => {
    if (memoryCache && Date.now() - lastSaveTime > DB_CONFIG.AUTO_SAVE_INTERVAL) {
      try {
        await saveDatabase(userId, memoryCache);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, DB_CONFIG.AUTO_SAVE_INTERVAL);
}

/**
 * Create a new session
 */
export async function createSession(userId: string, title?: string): Promise<ChatSession> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newSession: ChatSession = {
    id: sessionId,
    title: title || `Chat ${new Date().toLocaleDateString()}`,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    messageCount: 0,
  };

  // Deactivate current active session
  if (memoryCache!.activeSessionId) {
    const currentSession = memoryCache!.sessions[memoryCache!.activeSessionId];
    if (currentSession) {
      memoryCache!.sessions[memoryCache!.activeSessionId] = {
        ...currentSession,
        isActive: false,
      };
    }
  }

  // Add new session
  memoryCache!.sessions[sessionId] = newSession;
  memoryCache!.activeSessionId = sessionId;
  memoryCache!.lastSyncTime = new Date().toISOString();

  // Clean up old sessions if needed
  const sessionCount = Object.keys(memoryCache!.sessions).length;
  if (sessionCount > DB_CONFIG.MAX_SESSIONS) {
    const sortedSessions = Object.entries(memoryCache!.sessions)
      .sort(([,a], [,b]) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    const sessionsToKeep = sortedSessions.slice(0, DB_CONFIG.MAX_SESSIONS);
    memoryCache!.sessions = Object.fromEntries(sessionsToKeep);
  }

  scheduleAutoSave(userId);
  return newSession;
}

/**
 * Switch to an existing session
 */
export async function switchToSession(userId: string, sessionId: string): Promise<void> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  const session = memoryCache!.sessions[sessionId];
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Deactivate current active session
  if (memoryCache!.activeSessionId) {
    const currentSession = memoryCache!.sessions[memoryCache!.activeSessionId];
    if (currentSession) {
      memoryCache!.sessions[memoryCache!.activeSessionId] = {
        ...currentSession,
        isActive: false,
      };
    }
  }

  // Activate target session
  memoryCache!.sessions[sessionId] = {
    ...session,
    isActive: true,
  };
  memoryCache!.activeSessionId = sessionId;
  memoryCache!.lastSyncTime = new Date().toISOString();

  scheduleAutoSave(userId);
}

/**
 * Add message to active session
 */
export async function addMessage(userId: string, message: Omit<ChatSession['messages'][0], 'id' | 'timestamp'>): Promise<string> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  if (!memoryCache!.activeSessionId) {
    throw new Error('No active session');
  }

  const newMessage = {
    ...message,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };

  const activeSession = memoryCache!.sessions[memoryCache!.activeSessionId];
  if (!activeSession) {
    throw new Error('Active session not found');
  }

  // Add message
  activeSession.messages.push(newMessage);
  activeSession.messageCount = activeSession.messages.length;
  activeSession.updatedAt = new Date();

  // Update session title based on first user message
  if (activeSession.messageCount === 1 && message.isUser && message.content.trim()) {
    activeSession.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
  }

  // Limit messages per session
  if (activeSession.messages.length > DB_CONFIG.MAX_MESSAGES_PER_SESSION) {
    activeSession.messages = activeSession.messages.slice(-DB_CONFIG.MAX_MESSAGES_PER_SESSION);
    activeSession.messageCount = activeSession.messages.length;
  }

  memoryCache!.lastSyncTime = new Date().toISOString();
  scheduleAutoSave(userId);

  return newMessage.id;
}

/**
 * Update message content (for streaming)
 */
export async function updateMessage(userId: string, messageId: string, content: string): Promise<void> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  if (!memoryCache!.activeSessionId) {
    return;
  }

  const activeSession = memoryCache!.sessions[memoryCache!.activeSessionId];
  if (!activeSession) {
    return;
  }

  const messageIndex = activeSession.messages.findIndex(msg => msg.id === messageId);
  if (messageIndex !== -1) {
    activeSession.messages[messageIndex] = {
      ...activeSession.messages[messageIndex],
      content,
    };
    activeSession.updatedAt = new Date();
    memoryCache!.lastSyncTime = new Date().toISOString();
    scheduleAutoSave(userId);
  }
}

/**
 * Delete a session
 */
export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  delete memoryCache!.sessions[sessionId];

  // If we deleted the active session, switch to another one
  if (memoryCache!.activeSessionId === sessionId) {
    const remainingSessions = Object.values(memoryCache!.sessions)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    memoryCache!.activeSessionId = remainingSessions.length > 0 ? remainingSessions[0].id : null;
    
    // Activate the new session
    if (memoryCache!.activeSessionId) {
      const newActiveSession = memoryCache!.sessions[memoryCache!.activeSessionId];
      if (newActiveSession) {
        memoryCache!.sessions[memoryCache!.activeSessionId] = {
          ...newActiveSession,
          isActive: true,
        };
      }
    }
  }

  memoryCache!.lastSyncTime = new Date().toISOString();
  scheduleAutoSave(userId);
}

/**
 * Get all sessions
 */
export async function getSessions(userId: string): Promise<ChatSession[]> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  return Object.values(memoryCache!.sessions)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * Get active session
 */
export async function getActiveSession(userId: string): Promise<ChatSession | null> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  if (!memoryCache!.activeSessionId) {
    return null;
  }

  return memoryCache!.sessions[memoryCache!.activeSessionId] || null;
}

/**
 * Get session by ID
 */
export async function getSessionById(userId: string, sessionId: string): Promise<ChatSession | null> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  return memoryCache!.sessions[sessionId] || null;
}

/**
 * Clear all sessions
 */
export async function clearAllSessions(userId: string): Promise<void> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  memoryCache!.sessions = {};
  memoryCache!.activeSessionId = null;
  memoryCache!.lastSyncTime = new Date().toISOString();
  
  await saveDatabase(userId, memoryCache!);
}

/**
 * Force save database
 */
export async function forceSave(userId: string): Promise<void> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  await saveDatabase(userId, memoryCache!);
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(userId: string): Promise<{
  totalSessions: number;
  totalMessages: number;
  activeSessionId: string | null;
  lastSyncTime: Date;
}> {
  if (!memoryCache) {
    await initializeDatabase(userId);
  }

  const sessions = Object.values(memoryCache!.sessions);
  const totalMessages = sessions.reduce((sum, session) => sum + session.messageCount, 0);

  return {
    totalSessions: sessions.length,
    totalMessages,
    activeSessionId: memoryCache!.activeSessionId,
    lastSyncTime: new Date(memoryCache!.lastSyncTime),
  };
}
