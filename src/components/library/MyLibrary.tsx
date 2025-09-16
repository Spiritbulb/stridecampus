'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { getUserFiles } from '@/utils/r2';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { SearchFilters } from '@/components/library/SearchFilters';
import { ResourcesGrid } from '@/components/library/ResourcesGrid';
import { UploadModal } from '@/components/library/UploadModal';
import { LibraryFile } from '@/components/library/types';

// Custom hook for debounced value
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function MyLibrary() {
  const { user } = useAuth();
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // Debounce search query by 500ms
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Ref to track if this is the initial load
  const isInitialLoad = useRef(true);
  
  // Ref to prevent multiple simultaneous requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUserFiles = useCallback(async (page = 1, resetPage = false) => {
    if (!user?.id) {
      console.log('No user ID available');
      setIsLoading(false);
      setIsPageLoading(false);
      return;
    }
    
    try {
      console.log('Fetching files for user:', user.id, 'page:', page);
      // Cancel previous request if it's still ongoing
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      if (isInitialLoad.current) {
        setIsPageLoading(true);
      }
      
      // Reset to page 1 if filters changed (not pagination)
      const targetPage = resetPage ? 1 : page;
      
      const result = await getUserFiles(user.id, {
        search: debouncedSearchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        resourceType: selectedResourceType !== 'all' ? selectedResourceType : undefined,
        page: targetPage,
        limit: pagination.limit
      });
      
      console.log('API response:', result);
      
      if (result && 'files' in result && 'pagination' in result) {
        setFiles(result.files || []);
        setPagination(prev => ({
          ...prev,
          page: targetPage,
          total: result.pagination?.total || 0,
          pages: result.pagination?.pages || 1
        }));
      } else {
        console.error('Unexpected response format:', result);
        setFiles([]);
      }
      
    } catch (error: any) {
      // Don't show error if request was aborted
      if (error.name !== 'AbortError') {
        console.error('Error fetching user files:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch your files',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
      if (isInitialLoad.current) {
        setIsPageLoading(false);
        isInitialLoad.current = false;
      }
      abortControllerRef.current = null;
    }
  }, [user, debouncedSearchQuery, selectedCategory, selectedSubject, selectedResourceType, pagination.limit]);

  // Effect for initial load
  useEffect(() => {
    if (user?.id) {
      fetchUserFiles(1, true);
    }
  }, [user?.id]);

  // Effect for filter changes (uses debounced search query)
  useEffect(() => {
    if (!isInitialLoad.current && user?.id) {
      fetchUserFiles(1, true);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubject, selectedResourceType, user?.id]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSubjectChange = useCallback((subject: string) => {
    setSelectedSubject(subject);
  }, []);

  const handleResourceTypeChange = useCallback((resourceType: string) => {
    setSelectedResourceType(resourceType);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchUserFiles(page, false);
  }, [fetchUserFiles]);

  const handleRefresh = useCallback(() => {
    fetchUserFiles(pagination.page, false);
  }, [fetchUserFiles, pagination.page]);

  const handleUploadSuccess = useCallback(() => {
    setShowUploadModal(false);
    fetchUserFiles(1, true);
  }, [fetchUserFiles]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
        <p className="ml-4">Loading user information...</p>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Empty state
  if (!isPageLoading && files.length === 0 && !isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <LibraryHeader 
          user={user} 
          onUploadClick={() => setShowUploadModal(true)}
          owner={true} 
        />
        
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedSubject={selectedSubject}
          onSubjectChange={handleSubjectChange}
          selectedResourceType={selectedResourceType}
          onResourceTypeChange={handleResourceTypeChange}
        />

        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No resources yet</h3>
          <p className="text-gray-500 mt-2">Upload your first resource to get started.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Upload Your First Resource
          </button>
        </div>

        {showUploadModal && (
          <UploadModal
            user={user}
            onClose={() => setShowUploadModal(false)}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <LibraryHeader 
        user={user} 
        onUploadClick={() => setShowUploadModal(true)} 
        owner={true}
      />
      
      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        selectedSubject={selectedSubject}
        onSubjectChange={handleSubjectChange}
        selectedResourceType={selectedResourceType}
        onResourceTypeChange={handleResourceTypeChange}
      />

      <ResourcesGrid
        files={files}
        isLoading={isLoading}
        user={user}
        pagination={pagination}
        onRefresh={handleRefresh}
        onPageChange={handlePageChange}
        showOwner={false}
      />

      {showUploadModal && (
        <UploadModal
          user={user}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}