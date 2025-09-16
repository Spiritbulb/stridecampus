import React from 'react';
import { FileText } from 'lucide-react';
import { LibraryFile, Pagination } from './types';
import { User } from '@/utils/supabaseClient';
import { ResourceCard } from './ResourceCard';
import { PaginationControls } from './PaginationControls';
import { LoadingSpinner } from '../layout/LoadingSpinner';

interface ResourcesGridProps {
  files: LibraryFile[];
  isLoading: boolean;
  user: User | null;
  pagination: Pagination;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
}

export const ResourcesGrid: React.FC<ResourcesGridProps> = ({
  files,
  isLoading,
  user,
  pagination,
  onRefresh,
  onPageChange
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size='small'/>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-12 text-center">
        <FileText size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources yet</h3>
        <p className="text-gray-500 mb-6">
          {user ? 'Upload the first resource to get started' : 'No resources have been uploaded yet'}
        </p>
        {user && (
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-[#f23b36] text-white rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            Upload Resource
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {files.map((file) => (
          <ResourceCard
            key={file.id}
            file={file}
            user={user}
            onDeleteSuccess={onRefresh}
          />
        ))}
      </div>

      {pagination.pages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};