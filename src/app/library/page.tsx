'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Upload, Search, Filter, Trash2, Download, Plus, X, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFile, getFiles, deleteFile, getFileUrl } from '@/utils/r2'; // Import the utility functions
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

export interface LibraryFile {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_category: string;
  description: string;
  tags: string[];
  subject: string;
  storage_path: string;
  created_at: string;
  users: {
    full_name: string;
    school_name: string;
    username: string;
    checkmark: boolean;
  };
}

// Subject options for categorization
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

export default function Library() {
  const { user } = useAuth();
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    tags: '',
    subject: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // Fetch all files (not just current user's)
  const fetchFiles = async (page = 1) => {
    try {
      setIsLoading(true);
      setIsPageLoading(true);
      
      const result = await getFiles({
        search: searchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        page,
        limit: pagination.limit
      });
      
      // Handle the response structure from getFiles
      if (result && 'files' in result && 'pagination' in result) {
        setFiles(result.files || []);
        setPagination(prev => ({
          ...prev,
          page,
          total: result.pagination?.total || 0,
          pages: result.pagination?.pages || 1
        }));
      } else {
        // Handle case where result might be a Response (for file download)
        console.error('Unexpected response format:', result);
        setFiles([]);
      }
      
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch files',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [searchQuery, selectedCategory, selectedSubject]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !user) return;
    
    // Check if file is PDF
    if (uploadForm.file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF files are allowed',
        variant: 'destructive'
      });
      return;
    }

    // Validate subject is selected
    if (!uploadForm.subject) {
      toast({
        title: 'Subject required',
        description: 'Please select a subject for this resource',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const result = await uploadFile(
        uploadForm.file,
        user.id,
        uploadForm.description,
        uploadForm.tags,
        uploadForm.subject
      );
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully'
      });
      setShowUploadModal(false);
      setUploadForm({ file: null, description: '', tags: '', subject: '' });
      fetchFiles(); // Refresh the list
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred during upload',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const result = await deleteFile(fileId, user.id);
      
      toast({
        title: 'Success',
        description: 'File deleted successfully'
      });
      fetchFiles(); // Refresh the list
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'An error occurred during deletion',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = async (file: LibraryFile) => {
    try {
      // Use the getFileUrl utility function to get the direct download URL
      const fileUrl = 'https://media.stridecampus.com/' + file.filename;
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = fileUrl;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileUrl);
      }, 100);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'An error occurred during download',
        variant: 'destructive'
      });
    }
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

  const checkmarkImg = <img src="/check.png" alt="Verified" className="inline mb-1 w-3 h-3 ml-0.5" />;

  // Show loading spinner while page is loading
    if (isPageLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      );
    }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Resource Library</h1>
          <p className="text-gray-600 text-lg mt-2">
            Access learning materials shared by all students
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#f23b36] text-white rounded-2xl hover:shadow-lg transition-all duration-300"
          >
            <Plus size={20} />
            Upload Resource
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="document">Documents</option>
              <option value="presentation">Presentations</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {SUBJECT_OPTIONS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f23b36]"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-12 text-center">
          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources yet</h3>
          <p className="text-gray-500 mb-6">
            {user ? 'Upload the first resource to get started' : 'No resources have been uploaded yet'}
          </p>
          {user && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-[#f23b36] text-white rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              Upload Resource
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {files.map((file) => (
              <div key={file.id} className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText size={36} className="text-red-500" />
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {file.subject}
                    </span>
                  </div>
                  {user?.id === file.user_id && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete file"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 truncate">{file.original_name}</h3>
                
                {file.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{file.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {file.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  <div className="flex justify-between">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                  <div className="mt-2 text-gray-600">
                    Uploaded by <a href={`/u/${file.users?.username || 'Unknown'}`} className='hover:underline font-medium'>{file.users?.full_name || 'Unknown'}{file.users?.checkmark && checkmarkImg}</a>
                    {file.users?.school_name && ` • ${file.users.school_name}`}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(file)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => fetchFiles(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchFiles(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex backdrop-blur items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Resource</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File *
                </label>
                <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 text-center">
                    {uploadForm.file ? uploadForm.file.name : 'Click to select PDF file'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm({...uploadForm, subject: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                  required
                >
                  <option value="">Select a subject</option>
                  {SUBJECT_OPTIONS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the resource"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                  placeholder="e.g., calculus, exam-prep, chapter-3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadForm.file || !uploadForm.subject}
                  className="flex-1 px-4 py-3 bg-[#f23b36] text-white rounded-xl disabled:opacity-50 hover:shadow-lg transition-all duration-300"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}