import React, { useState } from 'react';
import { FileText, Trash2, Download, Play, Youtube, Share2, Copy, Check } from 'lucide-react';
import { LibraryFile } from './types';
import { User } from '@/utils/supabaseClient';
import { formatFileSize, formatDate, extractYoutubeVideoId } from './utils';
import { YouTubeEmbed } from './YoutubeEmbed';
import { deleteFile } from '@/utils/r2';
import { toast } from '@/hooks/use-toast';

interface ResourceCardProps {
  file: LibraryFile;
  user: User | null;
  onDeleteSuccess: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ file, user, onDeleteSuccess }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const checkmarkImg = <img src="/check.png" alt="Verified" className="inline mb-1 w-3 h-3 ml-0.5" />;

  // Generate a URL-friendly slug from the file name or description
  const generateSlug = (file: LibraryFile): string => {
    const text = file.resource_type === 'youtube' 
      ? file.description || 'youtube-video'
      : file.original_name;
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50) // Limit length
      || 'resource'; // Fallback
  };

  const handleDelete = async (fileId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const result = await deleteFile(fileId, user.id);
      
      toast({
        title: 'Success',
        description: 'Resource deleted successfully'
      });
      onDeleteSuccess();
      
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
      if (file.resource_type === 'youtube' && file.youtube_url) {
        window.open(file.youtube_url, '_blank');
        return;
      }
      
      const fileUrl = 'https://media.stridecampus.com/' + file.filename;
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = fileUrl;
      a.download = file.original_name;
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
    const slug = generateSlug(file);
    const shareUrl = `${window.location.origin}/library/${slug}?id=${file.id}`;
    
    try {
      if (navigator.share) {
        // Use native share if available (mobile)
        await navigator.share({
          title: file.resource_type === 'youtube' ? 'YouTube Video' : file.original_name,
          text: file.description || 'Check out this resource',
          url: shareUrl
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        
        toast({
          title: 'Link copied!',
          description: 'Resource link has been copied to clipboard'
        });
        
        setTimeout(() => {
          setCopied(false);
          setShowShareMenu(false);
        }, 2000);
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

  const slug = generateSlug(file);

  const copyLink = async () => {
    const slug = generateSlug(file);
    const shareUrl = `${window.location.origin}/library/${slug}?id=${file.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      toast({
        title: 'Link copied!',
        description: 'Resource link has been copied to clipboard'
      });
      
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Copy failed',
        description: 'Could not copy link',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
        
      <div className="flex items-start justify-between mb-4">
        
            <div className="flex items-center gap-3">
            {file.resource_type === 'youtube' ? (
                <Youtube size={36} className="text-red-500" />
            ) : (
                <FileText size={36} className="text-red-500" />
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {file.subject}
            </span>
            </div>
        
        
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Share resource"
            >
              <Share2 size={16} />
            </button>
            
            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-[160px] z-10">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={14} />
                  {typeof navigator.share !== 'undefined' ? 'Share' : 'Copy Link'}
                </button>
                
                {typeof navigator.share !== 'undefined' && (
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Link
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {/* Backdrop to close menu */}
            {showShareMenu && (
              <div 
                className="fixed inset-0 z-0" 
                onClick={() => setShowShareMenu(false)}
              />
            )}
          </div>
          
          {/* Delete Button */}
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
      </div>
      
      
      <h3 className="font-semibold text-gray-900 mb-2 truncate">
        {file.resource_type === 'youtube' ? 'YouTube Video' : file.original_name}
      </h3>
      
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
      
      {file.resource_type === 'youtube' && file.youtube_url && (
        <div className="mb-4">
          <YouTubeEmbed 
            url={file.youtube_url} 
            title={`YouTube video: ${file.description || 'Educational content'}`}
          />
        </div>
      )}
      
      <div className="text-xs text-gray-500 mb-3">
        <div className="flex justify-between">
          {file.resource_type === 'file' && (
            <span>{formatFileSize(file.file_size)}</span>
          )}
          <span>{formatDate(file.created_at)}</span>
        </div>
        <div className="mt-2 text-gray-600">
          Uploaded by <a href={`/u/${file.users?.username || 'Unknown'}`} className='hover:underline font-medium'>{file.users?.username || 'Unknown'}{file.users?.checkmark && checkmarkImg}</a>
          {file.users?.school_name && ` • ${file.users.school_name}`}
        </div>
      </div>
      
      <button
        onClick={() => handleDownload(file)}
        className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
      >
        {file.resource_type === 'youtube' ? (
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
  );
};