import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Database configuration
const DB_CONFIG = {
  DATA_DIR: join(process.cwd(), 'data'),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

/**
 * Ensure data directory exists
 */
async function ensureDataDir(userId: string): Promise<string> {
  const userDir = join(DB_CONFIG.DATA_DIR, userId);
  
  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }
  
  return userDir;
}

/**
 * Get database file path
 */
function getDatabasePath(userId: string): string {
  return join(DB_CONFIG.DATA_DIR, userId, 'nia_chat_sessions.json');
}

/**
 * Save database to file
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, data } = await request.json();

    if (!userId || !data) {
      return NextResponse.json(
        { error: 'Missing userId or data' },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    await ensureDataDir(userId);
    
    const filePath = getDatabasePath(userId);
    
    // Check file size before writing
    if (existsSync(filePath)) {
      const stats = await readFile(filePath, 'utf8');
      if (stats.length > DB_CONFIG.MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Database file too large' },
          { status: 413 }
        );
      }
    }

    // Write data to file
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving database:', error);
    return NextResponse.json(
      { error: 'Failed to save database' },
      { status: 500 }
    );
  }
}

/**
 * Load database from file
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const filePath = getDatabasePath(userId);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 404 }
      );
    }

    const data = await readFile(filePath, 'utf8');
    const parsedData = JSON.parse(data);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error loading database:', error);
    return NextResponse.json(
      { error: 'Failed to load database' },
      { status: 500 }
    );
  }
}

/**
 * Delete database file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const filePath = getDatabasePath(userId);
    
    if (existsSync(filePath)) {
      await writeFile(filePath, JSON.stringify({
        sessions: {},
        activeSessionId: null,
        lastSyncTime: new Date().toISOString(),
        version: '1.0.0',
        userId,
      }, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}
