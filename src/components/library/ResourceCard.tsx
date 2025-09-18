import React, { useState, useRef, useEffect } from 'react';
import { FileText, Trash2, Download, Play, Youtube, Share2, Copy, Check, ExternalLink, Eye, Calendar } from 'lucide-react';
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
  showOwner: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ file, user, onDeleteSuccess, showOwner }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  
  const checkmarkImg = <img src="/check.png" alt="Verified" className="inline mb-1 w-3 h-3 ml-0.5" />;

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

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
    if (!user || isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
    
    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (file: LibraryFile) => {
    try {
      if (file.resource_type === 'youtube' && file.youtube_url) {
        window.open(file.youtube_url, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // For other URL types
      if (file.url && file.resource_type !== 'file') {
        window.open(file.url, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // For file downloads
      const fileUrl = 'https://media.stridecampus.com/' + file.filename;
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = fileUrl;
      a.download = file.original_name;
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        if (fileUrl.startsWith('blob:')) {
          window.URL.revokeObjectURL(fileUrl);
        }
      }, 100);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Action failed',
        description: 'An error occurred while opening the resource',
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
          text: file.description || 'Check out this educational resource',
          url: shareUrl
        });
        setShowShareMenu(false);
      } else {
        // Fallback to clipboard
        await copyLink();
      }
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast({
          title: 'Share failed',
          description: 'Could not share resource',
          variant: 'destructive'
        });
      }
    }
  };

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
        description: 'Could not copy link to clipboard',
        variant: 'destructive'
      });
    }
  };

  const getResourceTypeIcon = () => {
    switch (file.resource_type) {
      case 'youtube':
        return <Youtube size={36} className="text-red-500" />;
      case 'website':
        return <ExternalLink size={36} className="text-blue-500" />;
      case 'article':
        return <FileText size={36} className="text-green-600" />;
      case 'document_link':
        return <FileText size={36} className="text-purple-600" />;
      default:
        return <FileText size={36} className="text-gray-600" />;
    }
  };

  const getActionButtonText = () => {
    switch (file.resource_type) {
      case 'youtube':
        return { icon: Play, text: 'Watch on YouTube' };
      case 'website':
        return { icon: ExternalLink, text: 'Visit Website' };
      case 'article':
        return { icon: ExternalLink, text: 'Read Article' };
      case 'document_link':
        return { icon: ExternalLink, text: 'Open Document' };
      default:
        return { icon: Download, text: 'Download' };
    }
  };

  const actionButton = getActionButtonText();

  // Format relative time for recent uploads
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`; // 7 days
    return formatDate(dateString);
  };

  const isRecent = () => {
    const date = new Date(file.created_at);
    const now = new Date();
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays < 7;
  };

  return (
    <div className={`bg-white border-2 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 ${
      isRecent() ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getResourceTypeIcon()}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {file.subject}
            </span>
            {isRecent() && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                New
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Share resource"
              title="Share resource"
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
          </div>
          
          {/* Delete Button */}
          {user?.id === file.user_id && (
            <button
              onClick={() => handleDelete(file.id)}
              disabled={isDeleting}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete resource"
              title="Delete resource"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
        {file.resource_type === 'youtube' ? (
          file.description || 'YouTube Video'
        ) : file.resource_type === 'file' ? (
          file.original_name
        ) : (
          file.description || file.url || 'Linked Resource'
        )}
      </h3>
      
      {/* Description (only show if different from title) */}
      {file.description && file.resource_type !== 'youtube' && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{file.description}</p>
      )}
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {file.tags.slice(0, 4).map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {tag}
          </span>
        ))}
        {file.tags.length > 4 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            +{file.tags.length - 4} more
          </span>
        )}
      </div>
      
      {/* YouTube Embed Toggle */}
      {file.resource_type === 'youtube' && file.youtube_url && (
        <div className="mb-4">
          {showYouTubeEmbed ? (
            <div className="space-y-2">
              <YouTubeEmbed 
                url={file.youtube_url} 
                title={`YouTube video: ${file.description || 'Educational content'}`}
              />
              <button
                onClick={() => setShowYouTubeEmbed(false)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hide preview
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowYouTubeEmbed(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Eye size={14} />
              Show preview
            </button>
          )}
        </div>
      )}
      
      {/* Metadata */}
      <div className="text-xs text-gray-500 mb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={12} />
            <span>{getRelativeTime(file.created_at)}</span>
          </div>
          {file.resource_type === 'file' && (
            <span className="font-medium">{formatFileSize(file.file_size)}</span>
          )}
        </div>
        
        {/* Owner Info */}
        {showOwner && file.users && (
          <div className="text-gray-600 pt-1 border-t border-gray-100">
            Uploaded by{' '}
            <a 
              href={`/u/${file.users.username || 'unknown'}`} 
              className="hover:underline font-medium text-blue-600 hover:text-blue-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {file.users.username || 'Unknown User'}
              {file.users.checkmark && checkmarkImg}
            </a>
            {file.users.school_name && (
              <span className="text-gray-500"> • {file.users.school_name}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Action Button */}
      <button
        onClick={() => handleDownload(file)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-200 font-medium"
      >
        <actionButton.icon size={16} />
        {actionButton.text}
      </button>
    </div>
  );
};