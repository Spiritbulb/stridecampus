'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext'; // Using AppContext for all auth state
import { toast } from '@/hooks/use-toast';
import { getFiles } from '@/utils/r2';
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

export default function Library() {
  // Use AppContext for all auth state and navigation
  const { 
    isLoading: appIsLoading, 
    currentScreen, 
    handleNavigateToAuth, 
    user,
    isAuthenticated 
  } = useApp();
  
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(true); // Renamed for clarity
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

  const fetchFiles = useCallback(async (page = 1, resetPage = false) => {
    try {
      // Cancel previous request if it's still ongoing
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      setIsFileLoading(true);
      
      // Reset to page 1 if filters changed (not pagination)
      const targetPage = resetPage ? 1 : page;
      
      const result = await getFiles({
        search: debouncedSearchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        resourceType: selectedResourceType !== 'all' ? selectedResourceType : undefined,
        page: targetPage,
        limit: pagination.limit
      });
      
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
        console.error('Error fetching files:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch files',
          variant: 'destructive'
        });
      }
    } finally {
      setIsFileLoading(false);
      abortControllerRef.current = null;
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubject, selectedResourceType, pagination.limit]);

  // Effect for initial load
  useEffect(() => {
    // Only fetch if app is not loading and we're on the correct screen
    if (!appIsLoading && currentScreen === 'dashboard') {
      fetchFiles(1, true);
    }
  }, [appIsLoading, currentScreen, fetchFiles]);

  // Effect for filter changes (uses debounced search query)
  useEffect(() => {
    if (!isInitialLoad.current && !appIsLoading && currentScreen === 'dashboard') {
      fetchFiles(1, true);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubject, selectedResourceType, fetchFiles, appIsLoading, currentScreen]);

  // Update initial load ref when files are first loaded
  useEffect(() => {
    if (!isFileLoading && isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [isFileLoading]);

  // Redirect to auth if not on dashboard screen
  useEffect(() => {
    if (!appIsLoading && currentScreen === 'auth') {
      handleNavigateToAuth();
    }
  }, [appIsLoading, currentScreen, handleNavigateToAuth]);

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
    fetchFiles(page, false);
  }, [fetchFiles]);

  const handleRefresh = useCallback(() => {
    fetchFiles(pagination.page, false);
  }, [fetchFiles, pagination.page]);

  const handleUploadSuccess = useCallback(() => {
    setShowUploadModal(false);
    fetchFiles(1, true);
  }, [fetchFiles]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Show global loading state if app is still loading
  if (appIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Don't render if not on dashboard screen
  if (currentScreen !== 'dashboard') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <LibraryHeader 
        user={user} 
        onUploadClick={() => setShowUploadModal(true)} 
        owner={false}
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
        isLoading={isFileLoading} // Using renamed local loading state
        user={user}
        pagination={pagination}
        onRefresh={handleRefresh}
        onPageChange={handlePageChange}
        showOwner={true}
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