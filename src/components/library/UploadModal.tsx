import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { User, SUBJECT_OPTIONS, RESOURCE_TYPE_OPTIONS } from './types';
import { uploadFile, uploadYoutubeLink } from '@/utils/r2';
import { toast } from '@/hooks/use-toast';
import { validateYouTubeUrl, extractYoutubeVideoId } from './utils';

interface UploadModalProps {
  user: User | null;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ user, onClose, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    resourceType: 'file',
    file: null as File | null,
    youtubeUrl: '',
    description: '',
    tags: '',
    subject: ''
  });

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
    
    try {
      if (uploadForm.resourceType === 'file') {
        if (!uploadForm.file) {
          toast({
            title: 'File required',
            description: 'Please select a file to upload',
            variant: 'destructive'
          });
          return;
        }
        
        if (uploadForm.file.type !== 'application/pdf') {
          toast({
            title: 'Invalid file type',
            description: 'Only PDF files are allowed',
            variant: 'destructive'
          });
          return;
        }
        
        await uploadFile(
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
      } else {
        if (!uploadForm.youtubeUrl) {
          toast({
            title: 'YouTube URL required',
            description: 'Please enter a YouTube URL',
            variant: 'destructive'
          });
          return;
        }
        
        if (!validateYouTubeUrl(uploadForm.youtubeUrl)) {
          return;
        }
        
        await uploadYoutubeLink(
          uploadForm.youtubeUrl,
          user.id,
          uploadForm.description,
          uploadForm.tags,
          uploadForm.subject
        );
        
        toast({
          title: 'Success',
          description: 'YouTube video added successfully'
        });
      }
      
      onClose();
      setUploadForm({ 
        resourceType: 'file', 
        file: null, 
        youtubeUrl: '', 
        description: '', 
        tags: '', 
        subject: '' 
      });
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
    }
  };

  return (
    <div className="fixed inset-0 flex backdrop-blur items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Resource</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Type *
            </label>
            <select
              value={uploadForm.resourceType}
              onChange={(e) => setUploadForm({...uploadForm, resourceType: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
              required
            >
              {RESOURCE_TYPE_OPTIONS.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {uploadForm.resourceType === 'youtube' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL *
              </label>
              <input
                type="url"
                value={uploadForm.youtubeUrl}
                onChange={(e) => setUploadForm({...uploadForm, youtubeUrl: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                placeholder="https://www.youtube.com/watch?v=..."
                required={uploadForm.resourceType === 'youtube'}
              />
            </div>
          ) : (
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
                  required={uploadForm.resourceType === 'file'}
                />
              </label>
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
              placeholder="e.g., calculus, exam-prep, chapter-3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (uploadForm.resourceType === 'file' ? !uploadForm.file : !uploadForm.youtubeUrl) || !uploadForm.subject}
              className="flex-1 px-4 py-3 bg-[#f23b36] text-white rounded-xl disabled:opacity-50 hover:shadow-lg transition-all duration-300"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};