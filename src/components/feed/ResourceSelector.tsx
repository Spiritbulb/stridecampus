'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LibraryFile } from '@/app/library/page';
import { X, Search, FileText, Check, Filter } from 'lucide-react';
import { getFiles } from '@/utils/r2';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

interface ResourceSelectorProps {
  onSelect: (resource: LibraryFile) => void;
  onClose: () => void;
  excludedResources: string[];
}

export default function ResourceSelector({ onSelect, onClose, excludedResources }: ResourceSelectorProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<LibraryFile[]>([]);
  const [filteredResources, setFilteredResources] = useState<LibraryFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Subject options for filtering
  const SUBJECT_OPTIONS = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Engineering',
    'Literature',
    'History',
    'Geography',
    'Economics',
    'Business',
    'Psychology',
    'Philosophy',
    'Art & Design',
    'Music',
    'Health Sciences',
    'Law',
    'Education',
    'Other'
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchQuery, selectedCategory, selectedSubject]);

  const fetchResources = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await getFiles({
        page: 1,
        limit: 100 // Increase limit to show more resources
      });
      
      if (result && 'files' in result) {
        // Filter out excluded resources and only show user's own files
        const userResources = result.files.filter(
          (file: LibraryFile) => 
            file.user_id === user.id && 
            !excludedResources.includes(file.id)
        );
        setResources(userResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.file_type === selectedCategory);
    }

    // Apply subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(resource => resource.subject === selectedSubject);
    }

    setFilteredResources(filtered);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 flex backdrop-blur items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Select a resource to attach</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="document">Documents</option>
                <option value="presentation">Presentations</option>
              </select>
            </div>
            
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {SUBJECT_OPTIONS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resources list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="small" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No resources found</p>
              <p>
                {resources.length === 0 
                  ? "You haven't uploaded any resources yet." 
                  : "No resources match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  onClick={() => onSelect(resource)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#f23b36] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText size={32} className="text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{resource.original_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(resource.file_size)}</span>
                        <span>•</span>
                        <span>{resource.subject}</span>
                        <span>•</span>
                        <span>{formatDate(resource.created_at)}</span>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate">{resource.description}</p>
                      )}
                    </div>
                  </div>
                  <Check size={20} className="text-[#f23b36] flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}