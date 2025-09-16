'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Youtube, Download, Play, Share2, Calendar, User, School, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { getFileById } from '@/utils/r2';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { YouTubeEmbed } from '@/components/library/YoutubeEmbed';
import { LibraryFile } from '@/components/library/types';
import { formatFileSize, formatDate } from '@/components/library/utils';

export default function ResourcePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [resource, setResource] = useState<LibraryFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resourceId = searchParams.get('id');
  const slug = params.slug as string;

  const checkmarkImg = <img src="/check.png" alt="Verified" className="inline mb-1 w-3 h-3 ml-0.5" />;

  useEffect(() => {
    if (!resourceId) {
      setError('Resource ID not found');
      setLoading(false);
      return;
    }

    fetchResource(resourceId);
  }, [resourceId]);

  const fetchResource = async (id: string) => {
    try {
      setLoading(true);
      const result = await getFileById(id); // You'll need to implement this
      
      if (result) {
        setResource(result);
      } else {
        setError('Resource not found');
      }
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      setError(error.message || 'Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resource) return;

    try {
      if (resource.resource_type === 'youtube' && resource.youtube_url) {
        window.open(resource.youtube_url, '_blank');
        return;
      }
      
      const fileUrl = 'https://media.stridecampus.com/' + resource.filename;
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = fileUrl;
      a.download = resource.original_name;
      document.body.appendChild(a);
      a.click();
      
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

  const handleShare = async () => {
    if (!resource) return;
    
    const currentUrl = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: resource.resource_type === 'youtube' ? 'YouTube Video' : resource.original_name,
          text: resource.description || 'Check out this resource',
          url: currentUrl
        });
      } else {
        await navigator.clipboard.writeText(currentUrl);
        toast({
          title: 'Link copied!',
          description: 'Resource link has been copied to clipboard'
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share failed',
        description: 'Could not share resource',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <FileText size={64} className="mx-auto text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resource Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The resource you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/library')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#f23b36] text-white rounded-xl hover:bg-[#e12a24] transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Share2 size={16} />
                Share
              </button>
              
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[#f23b36] text-white rounded-lg hover:bg-[#e12a24] transition-colors"
              >
                {resource.resource_type === 'youtube' ? (
                  <>
                    <Play size={16} />
                    Watch on YouTube
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Resource Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start gap-4 mb-6">
              {resource.resource_type === 'youtube' ? (
                <Youtube size={48} className="text-red-500 flex-shrink-0" />
              ) : (
                <FileText size={48} className="text-red-500 flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {resource.resource_type === 'youtube' ? 'YouTube Video' : resource.original_name}
                </h1>
                
                {resource.description && (
                  <p className="text-xl text-gray-600 mb-4">{resource.description}</p>
                )}
                
                <div className="flex flex-wrap gap-3 items-center text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    {formatDate(resource.created_at)}
                  </div>
                  
                  {resource.resource_type === 'file' && (
                    <div className="flex items-center gap-1">
                      <FileText size={16} />
                      {formatFileSize(resource.file_size)}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span>
                      By{' '}
                      <a 
                        href={`/u/${resource.users?.username || 'Unknown'}`} 
                        className="hover:underline font-medium text-gray-700"
                      >
                        {resource.users?.full_name || 'Unknown'}
                        {resource.users?.checkmark && checkmarkImg}
                      </a>
                    </span>
                  </div>
                  
                  {resource.users?.school_name && (
                    <div className="flex items-center gap-1">
                      <School size={16} />
                      {resource.users.school_name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags and Subject */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {resource.subject}
              </span>
              
              {resource.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-1">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* YouTube Embed or File Preview */}
          {resource.resource_type === 'youtube' && resource.youtube_url && (
            <div className="p-8">
              <div className="aspect-video">
                <YouTubeEmbed 
                  url={resource.youtube_url} 
                  title={`YouTube video: ${resource.description || 'Educational content'}`}
                />
              </div>
            </div>
          )}

          {/* File Information */}
          {resource.resource_type === 'file' && (
            <div className="p-8 bg-gray-50">
              <div className="text-center">
                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Download</h3>
                <p className="text-gray-600 mb-4">
                  This file ({formatFileSize(resource.file_size)}) is ready for download.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#f23b36] text-white rounded-xl hover:bg-[#e12a24] transition-colors text-lg font-medium"
                >
                  <Download size={20} />
                  Download {resource.original_name}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Resources or Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Looking for more resources? Browse our complete library.
          </p>
          <button
            onClick={() => router.push('/library')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Browse All Resources
          </button>
        </div>
      </div>
    </div>
  );
}