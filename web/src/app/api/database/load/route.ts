import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Database configuration
const DB_CONFIG = {
  DATA_DIR: join(process.cwd(), 'data'),
};

/**
 * Get database file path
 */
function getDatabasePath(userId: string): string {
  return join(DB_CONFIG.DATA_DIR, userId, 'nia_chat_sessions.json');
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
