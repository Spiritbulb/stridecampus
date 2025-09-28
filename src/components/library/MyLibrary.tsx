'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { getUserFiles } from '@/utils/r2';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { SearchFilters } from '@/components/library/SearchFilters';
import { ResourcesGrid } from '@/components/library/ResourcesGrid';
import { LibraryFile } from '@/components/library/types';
import { User } from '@/utils/supabaseClient';
import { BookOpen, Upload, TrendingUp } from 'lucide-react';

interface MyLibraryProps {
  user: User;
}

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

export const MyLibrary: React.FC<MyLibraryProps> = ({ user }) => {
  const router = useRouter();
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [libraryStats, setLibraryStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    subjectCount: {} as Record<string, number>,
    recentUploads: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isInitialLoad = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateLibraryStats = useCallback((filesData: LibraryFile[]) => {
    const totalFiles = filesData.length;
    const totalSize = filesData.reduce((sum, file) => sum + file.file_size, 0);
    
    // Count files by subject
    const subjectCount: Record<string, number> = {};
    filesData.forEach(file => {
      subjectCount[file.subject] = (subjectCount[file.subject] || 0) + 1;
    });

    // Count recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = filesData.filter(file => 
      new Date(file.created_at) > sevenDaysAgo
    ).length;

    setLibraryStats({
      totalFiles,
      totalSize,
      subjectCount,
      recentUploads
    });
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fetchUserFiles = useCallback(async (page = 1, resetPage = false) => {
    if (!user?.id) {
      console.log('No user ID available');
      setIsLoading(false);
      setIsPageLoading(false);
      return;
    }
    
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      
      if (isInitialLoad.current) {
        setIsPageLoading(true);
      }
      
      const targetPage = resetPage ? 1 : page;
      
      const result = await getUserFiles(user.id, {
        search: debouncedSearchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        resourceType: selectedResourceType !== 'all' ? selectedResourceType : undefined,
        page: targetPage,
        limit: pagination.limit
      });
      
      if (result && 'files' in result && 'pagination' in result) {
        // Format files with proper structure
        const formattedFiles: LibraryFile[] = (result.files || []).map(file => ({
          ...file,
          // For user's own files, populate user info from the user prop
          users: {
            full_name: user.full_name || 'You',
            school_name: user.school_name || '',
            username: user.username || '',
            checkmark: user.checkmark || false
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

        // Calculate stats only on initial load or when filters are reset
        if (resetPage || isInitialLoad.current) {
          // For stats, we want all files, not just the current page
          // If this is paginated data, we might need to make a separate call for stats
          calculateLibraryStats(formattedFiles);
        }
      } else {
        console.error('Unexpected response format:', result);
        setFiles([]);
        setLibraryStats({
          totalFiles: 0,
          totalSize: 0,
          subjectCount: {},
          recentUploads: 0
        });
      }
      
    } catch (error: any) {
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
  }, [user, debouncedSearchQuery, selectedCategory, selectedSubject, selectedResourceType, pagination.limit, calculateLibraryStats]);

  useEffect(() => {
    if (user?.id) {
      fetchUserFiles(1, true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isInitialLoad.current && user?.id) {
      fetchUserFiles(1, true);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubject, selectedResourceType, user?.id]);

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
    toast({
      title: 'Refreshed',
      description: 'Your library has been updated',
    });
  }, [fetchUserFiles, pagination.page]);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="ml-4 mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading your library...</p>
        </div>
      </div>
    );
  }

  // Enhanced empty state for user's own library
  if (!isPageLoading && files.length === 0 && !isLoading) {
    const hasActiveFilters = searchQuery || selectedCategory !== 'all' || 
                            selectedSubject !== 'all' || selectedResourceType !== 'all';
    
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl sm:px-3 lg:px-5 py-8 content-max-width">
          <LibraryHeader 
            user={user} 
            onUploadClick={handleUploadClick}
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

          <div className="text-center py-16 card-responsive">
            <div className="mx-auto h-32 w-32 text-gray-300 mb-6">
              {hasActiveFilters ? (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ) : (
                <BookOpen className="w-full h-full" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-responsive">
              {hasActiveFilters ? 'No matching resources found' : 'Your library is empty'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto text-responsive">
              {hasActiveFilters 
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                : 'Start building your personal resource collection by uploading your first file or link.'
              }
            </p>
            {!hasActiveFilters && (
              <div className="space-y-3">
                <button
                  onClick={handleUploadClick}
                  className="inline-flex items-center gap-2 bg-[#f23b36] hover:bg-[#e12b26] text-white px-6 py-3 rounded-lg font-medium transition-colors btn-hover"
                >
                  <Upload size={20} />
                  Upload Your First Resource
                </button>
                <p className="text-sm text-gray-400 text-responsive">
                  Supported: PDF, DOCX, PPTX, XLSX, images, videos, YouTube links
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  const topSubject = Object.entries(libraryStats.subjectCount)
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="min-h-screen">
      <div className="mx-auto sm:px-6 lg:px-8 py-8 content-max-width">
        <LibraryHeader 
          user={user} 
          onUploadClick={handleUploadClick} 
          owner={true}
        />
        
        {/* Personal stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 card-responsive">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen size={20} className="text-blue-600" />
              </div>
              <div className="overflow-safe">
                <p className="text-sm font-medium text-gray-600 text-responsive">Total Resources</p>
                <p className="text-2xl font-bold text-gray-900 text-responsive">{libraryStats.totalFiles}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 card-responsive">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div className="overflow-safe">
                <p className="text-sm font-medium text-gray-600 text-responsive">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900 text-responsive">
                  {formatFileSize(libraryStats.totalSize)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 card-responsive">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload size={20} className="text-purple-600" />
              </div>
              <div className="overflow-safe">
                <p className="text-sm font-medium text-gray-600 text-responsive">Recent Uploads</p>
                <p className="text-2xl font-bold text-gray-900 text-responsive">{libraryStats.recentUploads}</p>
                <p className="text-xs text-gray-500 text-responsive">Last 7 days</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 card-responsive">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen size={20} className="text-orange-600" />
              </div>
              <div className="overflow-safe">
                <p className="text-sm font-medium text-gray-600 text-responsive">Top Subject</p>
                <p className="text-lg font-bold text-gray-900 truncate text-responsive">
                  {topSubject ? topSubject[0] : 'None yet'}
                </p>
                {topSubject && (
                  <p className="text-xs text-gray-500 text-responsive">{topSubject[1]} resources</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
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

        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4 card-responsive">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-600 gap-2 sm:gap-0">
            <span className="text-responsive">
              Showing {files.length} of {pagination.total} your resources
              {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
            </span>
            <span className="text-responsive">Page {pagination.page} of {pagination.pages}</span>
          </div>
        </div>

        <ResourcesGrid
          files={files}
          isLoading={isLoading}
          user={user}
          pagination={pagination}
          onRefresh={handleRefresh}
          onPageChange={handlePageChange}
          showOwner={false} // Don't show owner in personal library (it's always you)
        />

      </div>
    </div>
  );
};