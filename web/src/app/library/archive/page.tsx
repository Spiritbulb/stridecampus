'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ArchiveGrid } from '@/components/library/ArchiveGrid';
import { ArchiveHeader } from '@/components/library/ArchiveHeader';
import { ArchiveStats } from '@/components/library/ArchiveStats';
import { getUserArchive } from '@/utils/creditEconomy';
import { ArchiveResource } from '@/components/library/types';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useApp } from '@/contexts/AppContext';

export default function ArchivePage() {
  const { loading: authLoading } = useAuth();
  const { user: appUser } = useApp();
  const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const [archiveResources, setArchiveResources] = useState<ArchiveResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPurchased: 0,
    totalSpent: 0,
    averageCost: 0,
    recentPurchases: 0
  });

  useEffect(() => {
    if (user && appUser && !authLoading) {
      fetchArchiveData();
    }
  }, [user, authLoading]);

  const fetchArchiveData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await getUserArchive(user.id, 100, 0);
      
      if (result.resources) {
        setArchiveResources(result.resources);
        
        // Calculate stats
        const totalSpent = result.resources.reduce((sum, resource) => sum + resource.cost_paid, 0);
        const paidResources = result.resources.filter(resource => resource.cost_paid > 0);
        const averageCost = paidResources.length > 0 ? totalSpent / paidResources.length : 0;
        
        // Count recent purchases (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPurchases = result.resources.filter(resource => 
          new Date(resource.purchased_at) > sevenDaysAgo
        ).length;

        setStats({
          totalPurchased: result.resources.length,
          totalSpent,
          averageCost: Math.round(averageCost),
          recentPurchases
        });
      }
    } catch (err) {
      console.error('Error fetching archive data:', err);
      setError('Failed to load your archive');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading your archive...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to view your archive.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchArchiveData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArchiveHeader user={user} />
        
        <ArchiveStats stats={stats} />
        
        <ArchiveGrid 
          resources={archiveResources}
          isLoading={isLoading}
          onRefresh={fetchArchiveData}
        />
      </div>
    </div>
  );
}
