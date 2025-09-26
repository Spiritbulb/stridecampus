import React, { useState, useEffect } from 'react';
import { X, Upload, Link, FileText, Youtube, Globe } from 'lucide-react';
import { User, SUBJECT_OPTIONS } from './types';
import { uploadFile, uploadResourceLink, RESOURCE_TYPE_OPTIONS, SUPPORTED_FILE_TYPES } from '@/utils/r2';
import { toast } from '@/hooks/use-toast';
import { validateYouTubeUrl, extractYoutubeVideoId, validateUrl } from './utils';

interface UploadModalProps {
  user: User | null;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ user, onClose, onUploadSuccess }) => {
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

  // Extract YouTube video ID from filename as fallback
  const extractYoutubeIdFromFilename = (filename: string): string | null => {
    // Common YouTube ID patterns in filenames
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
    if (!user) return;
    
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
          user.id,
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
          user.id,
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
      
      onClose();
      setUploadForm({ 
        resourceType: 'file', 
        file: null, 
        url: '', 
        description: '', 
        tags: '', 
        subject: '' 
      });
      setUploadProgress(0);
      onUploadSuccess();
      
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

  return (
    <div className={`fixed inset-0 flex backdrop-blur items-center justify-center p-4 z-50 ${isMobile ? 'items-end md:items-center' : ''}`}>
      <div className={`bg-white rounded-2xl p-6 w-full max-w-md overflow-y-auto ${
        isMobile 
          ? 'max-h-[95vh] rounded-b-none shadow-2xl mb-0' 
          : 'max-h-[90vh]'
      }`}>
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 pt-2">
          <h2 className="text-2xl font-bold text-gray-900">Upload Resource</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4 pb-1">
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
              <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                <Upload size={24} className="text-gray-400 mb-2" />
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
              placeholder="e.g., calculus, exam-prep, chapter-3 (defaults to 'educational' if empty)"
            />
          </div>

          <div className={`flex gap-3 pt-4 ${isMobile ? 'pb-4' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || 
                (uploadForm.resourceType === 'file' ? !uploadForm.file : !uploadForm.url) || 
                !uploadForm.subject}
              className="flex-1 px-4 py-3 bg-[#f23b36] text-white rounded-xl disabled:opacity-50 hover:shadow-lg transition-all duration-300"
            >
              {isUploading ? (
                uploadForm.resourceType === 'file' ? 'Uploading...' : 'Processing...'
              ) : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};