import { NextRequest, NextResponse } from 'next/server';
import { migrateUserData, migrateAllUsersData, verifyMigration } from '@/utils/aiMigration';
import { supabase } from '@/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { action, userId }: { action?: string; userId?: string } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'migrate_user':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for user migration' },
            { status: 400 }
          );
        }

        const userResult = await migrateUserData(userId);
        return NextResponse.json(userResult);

      case 'migrate_all':
        const allUsersResult = await migrateAllUsersData();
        return NextResponse.json(allUsersResult);

      case 'verify':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for verification' },
            { status: 400 }
          );
        }

        const verifyResult = await verifyMigration(userId);
        return NextResponse.json(verifyResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: migrate_user, migrate_all, or verify' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // Get migration status for a user or all users
      if (userId) {
        const { data: sessions, error } = await supabase
          .from('ai_chat_sessions')
          .select('id, title, message_count, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch migration status' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          userId,
          hasSupabaseData: sessions && sessions.length > 0,
          sessionCount: sessions?.length || 0,
          totalMessages: sessions?.reduce((sum, s) => sum + s.message_count, 0) || 0,
          sessions: sessions || [],
        });
      } else {
        // Get overall migration status
        const { data: stats, error } = await supabase
          .from('ai_chat_sessions')
          .select('user_id, message_count');

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch migration status' },
            { status: 500 }
          );
        }

        const userCount = new Set(stats?.map(s => s.user_id) || []).size;
        const totalSessions = stats?.length || 0;
        const totalMessages = stats?.reduce((sum, s) => sum + s.message_count, 0) || 0;

        return NextResponse.json({
          totalUsers: userCount,
          totalSessions,
          totalMessages,
          migrationComplete: totalSessions > 0,
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Migration status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
