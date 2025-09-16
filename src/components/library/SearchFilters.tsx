import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, BookOpen, Play, X } from 'lucide-react';
import { SUBJECT_OPTIONS, RESOURCE_TYPE_OPTIONS } from './types';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  selectedResourceType: string;
  onResourceTypeChange: (resourceType: string) => void;
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

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSubject,
  onSubjectChange,
  selectedResourceType,
  onResourceTypeChange
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce the search query by 500ms
  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  // Update the parent component when debounced value changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      setIsSearching(true);
      onSearchChange(debouncedSearchQuery);
      // Reset searching state after a short delay
      const timer = setTimeout(() => setIsSearching(false), 200);
      return () => clearTimeout(timer);
    }
  }, [debouncedSearchQuery, searchQuery, onSearchChange]);

  // Sync local state when external searchQuery changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle input change
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  }, []);

  // Clear search function
  const clearSearch = useCallback(() => {
    setLocalSearchQuery('');
    onSearchChange('');
  }, [onSearchChange]);

  // Memoize filter options to prevent unnecessary re-renders
  const subjectOptions = useMemo(() => SUBJECT_OPTIONS, []);
  const resourceTypeOptions = useMemo(() => RESOURCE_TYPE_OPTIONS, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return selectedCategory !== 'all' || 
           selectedSubject !== 'all' || 
           selectedResourceType !== 'all' ||
           searchQuery.length > 0;
  }, [selectedCategory, selectedSubject, selectedResourceType, searchQuery]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setLocalSearchQuery('');
    onSearchChange('');
    onCategoryChange('all');
    onSubjectChange('all');
    onResourceTypeChange('all');
  }, [onSearchChange, onCategoryChange, onSubjectChange, onResourceTypeChange]);

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
      {/* Header with clear all option */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Filter size={20} className="text-[#f23b36]" />
          Search & Filter
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-[#f23b36] transition-colors duration-200 flex items-center gap-1"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <Search 
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
              isSearching ? 'text-[#f23b36] animate-pulse' : 'text-gray-400'
            }`} 
            size={20} 
          />
          <input
            type="text"
            placeholder="Search resources..."
            value={localSearchQuery}
            onChange={handleSearchInputChange}
            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent focus:bg-white transition-all duration-200"
          />
          {localSearchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={16} />
            </button>
          )}
          {/* Search indicator */}
          <div className="absolute -bottom-6 left-0 right-0">
            <div className="text-xs text-gray-500 text-center">
              {isSearching && localSearchQuery && (
                <span className="text-[#f23b36]">Searching...</span>
              )}
              {localSearchQuery && !isSearching && debouncedSearchQuery && (
                <span className="text-green-600">Search applied</span>
              )}
            </div>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <BookOpen size={20} className={selectedSubject !== 'all' ? 'text-[#f23b36]' : 'text-gray-400'} />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
          >
            <option className='p-2 hover:bg-[#f23b36] hover:text-white cursor-pointer' value="all">All Subjects</option>
            {subjectOptions.map(subject => (
              <option className='p-2 hover:bg-[#f23b36] hover:text-white cursor-pointer' key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          {selectedSubject !== 'all' && (
            <div className="absolute -bottom-1 left-3 right-3 h-0.5 bg-[#f23b36] rounded-full"></div>
          )}
        </div>

        {/* Resource Type Filter */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Play size={20} className={selectedResourceType !== 'all' ? 'text-[#f23b36]' : 'text-gray-400'} />
          </div>
          <select
            value={selectedResourceType}
            onChange={(e) => onResourceTypeChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="all">All Resources</option>
            {resourceTypeOptions.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {selectedResourceType !== 'all' && (
            <div className="absolute -bottom-1 left-3 right-3 h-0.5 bg-[#f23b36] rounded-full"></div>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {searchQuery && (
              <span className="px-3 py-1 bg-[#f23b36] text-white text-sm rounded-full flex items-center gap-1">
                Search: "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {selectedCategory}
              </span>
            )}
            {selectedSubject !== 'all' && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {selectedSubject}
              </span>
            )}
            {selectedResourceType !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                {resourceTypeOptions.find(type => type.value === selectedResourceType)?.label || selectedResourceType}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};