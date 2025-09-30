import React from 'react';
import { Pagination } from './types';

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange
}) => {
  return (
    <div className="flex justify-center items-center gap-4">
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
        className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Previous
      </button>
      <span className="text-gray-600">
        Page {pagination.page} of {pagination.pages}
      </span>
      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.pages}
        className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
};