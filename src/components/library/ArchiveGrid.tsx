import React from 'react';
import { ArchiveResource } from './types';
import { ArchiveResourceCard } from './ArchiveResourceCard';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { RefreshCw, Archive } from 'lucide-react';

interface ArchiveGridProps {
  resources: ArchiveResource[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ArchiveGrid: React.FC<ArchiveGridProps> = ({ 
  resources, 
  isLoading, 
  onRefresh 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-32 w-32 text-gray-300 mb-6">
          <Archive className="w-full h-full" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your archive is empty
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Purchase resources from the library to build your personal collection. 
          Once purchased, they'll stay in your archive forever.
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <RefreshCw size={20} />
          Refresh Archive
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Your Purchased Resources ({resources.length})
        </h2>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ArchiveResourceCard 
            key={resource.resource_id} 
            resource={resource} 
          />
        ))}
      </div>
    </div>
  );
};
