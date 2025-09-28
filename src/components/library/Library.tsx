'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { getFiles } from '@/utils/r2';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { SearchFilters } from '@/components/library/SearchFilters';
import { ResourcesGrid } from '@/components/library/ResourcesGrid';
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
  const router = useRouter();
  const { 
    isLoading: appIsLoading, 
    handleNavigateToAuth, 
    user,
  } = useApp();
  
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [isFileLoading, setIsFileLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isInitialLoad = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFiles = useCallback(async (page = 1, resetPage = false) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      setIsFileLoading(true);
      
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
        // Ensure each file has the proper structure with user information
        const formattedFiles: LibraryFile[] = (result.files || []).map(file => ({
          ...file,
          // Ensure user information is properly structured
          users: file.users || {
            full_name: 'Unknown User',
            school_name: '',
            username: '',
            checkmark: false
          },
          // Ensure tags is always an array
          tags: Array.isArray(file.tags) ? file.tags : 
          //@ts-ignore
                typeof file.tags === 'string' ? file.tags.split(',').map(t => t.trim()) : 
                ['educational'],
          // Ensure metadata exists
          metadata: file.metadata || {}
        }));
        
        setFiles(formattedFiles);
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

  useEffect(() => {
    if (!appIsLoading) {
      fetchFiles(1, true);
    }
  }, [appIsLoading, fetchFiles]);

  useEffect(() => {
    if (!isInitialLoad.current && !appIsLoading) {
      fetchFiles(1, true);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubject, selectedResourceType, fetchFiles, appIsLoading]);

  useEffect(() => {
    if (!isFileLoading && isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [isFileLoading]);

  useEffect(() => {
    if (!appIsLoading && !user) {
      handleNavigateToAuth();
    }
  }, [appIsLoading, user, handleNavigateToAuth]);

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

  const handleUploadClick = useCallback(() => {
    router.push('/library/upload');
  }, [router]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (appIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    handleNavigateToAuth();
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LibraryHeader 
          user={user} 
          onUploadClick={handleUploadClick} 
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

        {/* Stats bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {files.length} of {pagination.total} resources
              {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
            </span>
            <span>Page {pagination.page} of {pagination.pages}</span>
          </div>
        </div>

        <ResourcesGrid
          files={files}
          isLoading={isFileLoading}
          user={user}
          pagination={pagination}
          onRefresh={handleRefresh}
          onPageChange={handlePageChange}
          showOwner={true}
        />
      </div>
    </div>
  );
}