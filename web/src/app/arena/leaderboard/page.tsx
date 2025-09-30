'use client';
import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { FullLeaderboard } from '@/components/dashboard/FullLeaderboard';
import { useApp } from '@/contexts/AppContext';

export default function LeaderboardPage() {
  const { user, authLoading } = useApp();
  const { leaderboard, loading } = useLeaderboard(user?.id);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please log in to view the leaderboard.</p>
            <a 
              href="/auth" 
              className="inline-flex items-center px-4 py-2 bg-[#f23b36] text-white rounded-lg hover:bg-[#f23b36]/90 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
            <p className="text-gray-600">See how you rank among all users</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <FullLeaderboard 
              leaderboard={leaderboard} 
              currentUserId={user.id}
              user={user}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
