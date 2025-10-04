'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Link, FileText, Youtube, Globe } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { uploadFile, uploadResourceLink, RESOURCE_TYPE_OPTIONS, SUPPORTED_FILE_TYPES } from '@/utils/r2';
import { toast } from '@/hooks/use-toast';
import { validateYouTubeUrl, extractYoutubeVideoId, validateUrl } from '@/components/library/utils';
import { SUBJECT_OPTIONS } from '@/components/library/types';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

export default function UploadPage() {
  const router = useRouter();
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadForm, setUploadForm] = useState({
    resourceType: 'file',
    file: null as File | null,
    url: '',
    description: '',
    tags: '',
    subject: ''
  });

  // Detect mobile devices
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [userLoading, user, router]);

  // Extract YouTube video ID from filename as fallback
  const extractYoutubeIdFromFilename = (filename: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
      /([a-zA-Z0-9_-]{11})\.(mp4|avi|mov|mkv|webm)$/i,
      /^([a-zA-Z0-9_-]{11})$/i
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file type
      const isSupported = Object.values(SUPPORTED_FILE_TYPES).some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.replace('/*', '');
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isSupported) {
        toast({
          title: 'Unsupported file type',
          description: 'Please select a supported file type (PDF, DOCX, PPTX, XLSX, images, videos, audio, or text files)',
          variant: 'destructive'
        });
        return;
      }

      // Check file size (optional: 100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 100MB',
          variant: 'destructive'
        });
        return;
      }
    }
    setUploadForm({...uploadForm, file});
  };

  // Enhanced URL validation and YouTube ID extraction
  const getYouTubeUrl = (): string => {
    // If URL is explicitly provided and valid, use it
    if (uploadForm.url && validateUrl(uploadForm.url)) {
      if (uploadForm.resourceType === 'youtube' && validateYouTubeUrl(uploadForm.url)) {
        return uploadForm.url;
      } else if (uploadForm.resourceType !== 'youtube') {
        return uploadForm.url;
      }
    }

    // For YouTube resources, try to extract from filename as fallback
    if (uploadForm.resourceType === 'youtube' && uploadForm.file) {
      const videoId = extractYoutubeIdFromFilename(uploadForm.file.name);
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    return uploadForm.url;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !appUser) return;
    
    if (!uploadForm.subject) {
      toast({
        title: 'Subject required',
        description: 'Please select a subject for this resource',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const tagsToSend = uploadForm.tags.trim() || 'educational';
      let finalUrl = uploadForm.url;

      if (uploadForm.resourceType === 'file') {
        if (!uploadForm.file) {
          toast({
            title: 'File required',
            description: 'Please select a file to upload',
            variant: 'destructive'
          });
          return;
        }
        
        await uploadFile(
          uploadForm.file,
          user?.id,
          uploadForm.description,
          tagsToSend,
          uploadForm.subject,
          (progress) => setUploadProgress(progress)
        );
        
        toast({
          title: 'Success',
          description: 'File uploaded successfully'
        });
      } else {
        // Use enhanced URL handling
        finalUrl = getYouTubeUrl();
        
        if (!finalUrl) {
          toast({
            title: 'URL required',
            description: 'Please enter a valid URL',
            variant: 'destructive'
          });
          return;
        }
        
        if (!validateUrl(finalUrl)) {
          toast({
            title: 'Invalid URL',
            description: 'Please enter a valid URL',
            variant: 'destructive'
          });
          return;
        }

        // Additional validation for YouTube URLs
        if (uploadForm.resourceType === 'youtube' && !validateYouTubeUrl(finalUrl)) {
          toast({
            title: 'Invalid YouTube URL',
            description: 'Please enter a valid YouTube URL',
            variant: 'destructive'
          });
          return;
        }
        
        await uploadResourceLink(
          finalUrl,
          user?.id,
          uploadForm.description,
          tagsToSend,
          uploadForm.subject,
          uploadForm.resourceType
        );
        
        toast({
          title: 'Success',
          description: 'Link added successfully'
        });
      }
      
      // Navigate back to library
      router.push('/library');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred during upload',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube size={16} className="text-red-500" />;
      case 'website': return <Globe size={16} className="text-blue-500" />;
      case 'article': return <FileText size={16} className="text-green-500" />;
      case 'document_link': return <FileText size={16} className="text-purple-500" />;
      case 'other_link': return <Link size={16} className="text-gray-500" />;
      default: return <Upload size={16} className="text-orange-500" />;
    }
  };

  const getResourceTypePlaceholder = (type: string) => {
    switch (type) {
      case 'youtube': return 'https://www.youtube.com/watch?v=... or upload a file with YouTube ID in name';
      case 'website': return 'https://example.com';
      case 'article': return 'https://arxiv.org/abs/...';
      case 'document_link': return 'https://docs.google.com/document/...';
      case 'other_link': return 'https://...';
      default: return 'Enter URL';
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f23b36] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !appUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 mb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Upload Resource</h1>
          <p className="text-gray-600 mt-2">Share educational resources with your campus community</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Type *
              </label>
              <select
                value={uploadForm.resourceType}
                onChange={(e) => setUploadForm({...uploadForm, resourceType: e.target.value, file: null, url: ''})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                required
              >
                {RESOURCE_TYPE_OPTIONS.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {uploadForm.resourceType === 'file' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Upload *
                </label>
                <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload size={32} className="text-gray-400 mb-3" />
                  <span className="text-sm text-gray-500 text-center">
                    {uploadForm.file ? uploadForm.file.name : 'Click to select file (PDF, DOCX, PPTX, XLSX, text)'}
                  </span>
                  <input
                    type="file"
                    accept={Object.values(SUPPORTED_FILE_TYPES).join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    required={uploadForm.resourceType === 'file'}
                  />
                </label>
                {uploadForm.file && (
                  <p className="text-xs text-gray-500 mt-2">
                    File type: {uploadForm.file.type}, Size: {(uploadForm.file.size / 1024 / 1024).toFixed(2)}MB
                    {uploadForm.file.type === 'youtube' && extractYoutubeIdFromFilename(uploadForm.file.name) && (
                      <span className="block text-green-600">
                        YouTube ID detected: {extractYoutubeIdFromFilename(uploadForm.file.name)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    {getResourceTypeIcon(uploadForm.resourceType)}
                    {RESOURCE_TYPE_OPTIONS.find(t => t.value === uploadForm.resourceType)?.label} *
                  </span>
                </label>
                <input
                  type="url"
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({...uploadForm, url: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                  placeholder={getResourceTypePlaceholder(uploadForm.resourceType)}
                  required={uploadForm.resourceType !== 'file'}
                />
                {uploadForm.resourceType === 'youtube' && (
                  <p className="text-xs text-gray-500 mt-2">
                    You can also upload a file with YouTube ID in the filename as fallback
                  </p>
                )}
              </div>
            )}

            {isUploading && uploadForm.resourceType === 'file' && uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#f23b36] h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

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
                rows={4}
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
                placeholder="e.g., calculus, exam-prep, chapter-3 (defaults to 'educational' if empty)"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isUploading}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || 
                  (uploadForm.resourceType === 'file' ? !uploadForm.file : !uploadForm.url) || 
                  !uploadForm.subject}
                className="flex-1 px-6 py-3 bg-[#f23b36] text-white rounded-xl disabled:opacity-50 hover:shadow-lg transition-all duration-300"
              >
                {isUploading ? (
                  uploadForm.resourceType === 'file' ? 'Uploading...' : 'Processing...'
                ) : 'Upload Resource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
