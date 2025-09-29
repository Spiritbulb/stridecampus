import React, { useState, useRef, useEffect } from 'react';
import { FileText, Trash2, Download, Play, Youtube, Share2, Copy, Check, ExternalLink, Eye, Calendar, Sparkles, ShoppingCart, Coins } from 'lucide-react';
import { LibraryFile } from './types';
import { User } from '@/utils/supabaseClient';
import { formatFileSize, formatDate, extractYoutubeVideoId } from './utils';
import { YouTubeEmbed } from './YoutubeEmbed';
import { deleteFile } from '@/utils/r2';
import { toast } from '@/hooks/use-toast';
import { CostBubbleWrapper } from '@/components/ui/CostBubble';
import { calculateResourcePurchaseCost, processResourcePurchase, hasUserPurchasedResource } from '@/utils/creditEconomy';

interface ResourceCardProps {
  file: LibraryFile;
  user: User | null;
  onDeleteSuccess: () => void;
  showOwner: boolean;
  showPurchaseButton?: boolean;
}

// Enhanced color mappings for resource types
const RESOURCE_TYPE_STYLES = {
  youtube: {
    gradient: 'from-red-50 via-white to-pink-50',
    iconGradient: 'from-red-500 to-pink-500',
    decoration: 'from-red-100 to-pink-100',
    accent: 'from-red-500 to-pink-500'
  },
  website: {
    gradient: 'from-blue-50 via-white to-indigo-50',
    iconGradient: 'from-blue-500 to-indigo-500',
    decoration: 'from-blue-100 to-indigo-100',
    accent: 'from-blue-500 to-indigo-500'
  },
  article: {
    gradient: 'from-green-50 via-white to-emerald-50',
    iconGradient: 'from-green-500 to-emerald-500',
    decoration: 'from-green-100 to-emerald-100',
    accent: 'from-green-500 to-emerald-500'
  },
  document_link: {
    gradient: 'from-purple-50 via-white to-violet-50',
    iconGradient: 'from-purple-500 to-violet-500',
    decoration: 'from-purple-100 to-violet-100',
    accent: 'from-purple-500 to-violet-500'
  },
  file: {
    gradient: 'from-gray-50 via-white to-slate-50',
    iconGradient: 'from-gray-500 to-slate-500',
    decoration: 'from-gray-100 to-slate-100',
    accent: 'from-gray-500 to-slate-500'
  }
} as const;

export const ResourceCard: React.FC<ResourceCardProps> = ({ file, user, onDeleteSuccess, showOwner, showPurchaseButton = true }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseCost, setPurchaseCost] = useState(0);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  
  const checkmarkImg = <img src="/check.png" alt="Verified" className="inline mb-1 w-3 h-3 ml-0.5" />;
  const resourceStyle = RESOURCE_TYPE_STYLES[file.resource_type as keyof typeof RESOURCE_TYPE_STYLES] || RESOURCE_TYPE_STYLES.file;

  // Calculate purchase cost
  useEffect(() => {
    if (showPurchaseButton && user) {
      const cost = calculateResourcePurchaseCost(file.file_size, {
        resource_type: file.resource_type,
        filename: file.filename,
        url: file.url
      });
      setPurchaseCost(cost);
    }
  }, [file.file_size, file.resource_type, file.filename, file.url, showPurchaseButton, user]);

  // Check if user has already purchased this resource
  useEffect(() => {
    if (user) {
      hasUserPurchasedResource(user.id, file.id).then(setIsPurchased);
    }
  }, [user, file.id]);

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

  const handlePurchase = async () => {
    if (!user || isPurchasing || isPurchased) return;
    
    setIsPurchasing(true);
    try {
      const result = await processResourcePurchase(user.id, file.id, purchaseCost);
      
      if (result.success) {
        setIsPurchased(true);
        if (purchaseCost > 0) {
          toast({
            title: 'Purchase Successful!',
            description: `Resource added to your archive. Cost: ${result.cost} credits`
          });
        } else {
          toast({
            title: 'Added to Archive!',
            description: 'Free resource added to your archive'
          });
        }
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Insufficient credits',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message || 'An error occurred during purchase',
        variant: 'destructive'
      });
    } finally {
      setIsPurchasing(false);
    }
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
        return <Youtube size={20} className="text-white" />;
      case 'website':
        return <ExternalLink size={20} className="text-white" />;
      case 'article':
        return <FileText size={20} className="text-white" />;
      case 'document_link':
        return <FileText size={20} className="text-white" />;
      default:
        return <FileText size={20} className="text-white" />;
    }
  };

  const getActionButtonText = () => {
    switch (file.resource_type) {
      case 'youtube':
        return { icon: Play, text: 'Watch Video' };
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
    <div className={`
      group relative overflow-hidden bg-gradient-to-br ${resourceStyle.gradient} 
      rounded-3xl p-6 shadow-sm border border-gray-100 
      transition-all duration-300 hover:shadow-lg hover:-translate-y-1
    `}>
      {/* Background decorations */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${resourceStyle.decoration} rounded-full opacity-20 transform translate-x-16 -translate-y-16`}></div>
      <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${resourceStyle.decoration} rounded-full opacity-15 transform -translate-x-12 translate-y-12`}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Resource Type Icon */}
            <div className={`
              w-10 h-10 bg-gradient-to-br ${resourceStyle.iconGradient} rounded-xl 
              flex items-center justify-center shadow-lg transform group-hover:scale-105 
              transition-transform duration-300
            `}>
              {getResourceTypeIcon()}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1.5 bg-gradient-to-r ${resourceStyle.accent} text-white text-xs font-semibold rounded-full shadow-sm`}>
                {file.subject}
              </span>
              {isRecent() && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-sm">
                  <Sparkles size={12} />
                  New
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Share Button */}
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all duration-200 backdrop-blur-sm"
                aria-label="Share resource"
                title="Share resource"
              >
                <Share2 size={16} />
              </button>
              
              {/* Enhanced Share Menu */}
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl py-2 min-w-[160px] z-20">
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors"
                  >
                    <Share2 size={14} />
                    {typeof navigator.share !== 'undefined' ? 'Share' : 'Copy Link'}
                  </button>
                  
                  {typeof navigator.share !== 'undefined' && (
                    <button
                      onClick={copyLink}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors"
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
                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                aria-label="Delete resource"
                title="Delete resource"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* Title */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {file.resource_type === 'youtube' ? (
              file.description || 'YouTube Video'
            ) : file.resource_type === 'file' ? (
              file.original_name
            ) : (
              file.description || file.url || 'Linked Resource'
            )}
          </h3>
          
          {/* Accent line */}
          <div className={`w-12 h-0.5 bg-gradient-to-r ${resourceStyle.accent} rounded-full`}></div>
        </div>
        
        {/* Description (only show if different from title) */}
        {file.description && file.resource_type !== 'youtube' && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{file.description}</p>
        )}
        
        {/* Tags */}
        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {file.tags.slice(0, 4).map((tag, index) => (
              <span key={index} className="px-2.5 py-1 bg-gray-100/80 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
                {tag}
              </span>
            ))}
            {file.tags.length > 4 && (
              <span className="px-2.5 py-1 bg-gray-100/80 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
                +{file.tags.length - 4} more
              </span>
            )}
          </div>
        )}
        
        {/* YouTube Embed Toggle */}
        {file.resource_type === 'youtube' && file.youtube_url && (
          <div className="mb-4">
            {showYouTubeEmbed ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <YouTubeEmbed 
                    url={file.youtube_url} 
                    title={`YouTube video: ${file.description || 'Educational content'}`}
                  />
                </div>
                <button
                  onClick={() => setShowYouTubeEmbed(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  Hide preview
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowYouTubeEmbed(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                <Eye size={14} />
                Show preview
              </button>
            )}
          </div>
        )}
        
        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-4 space-y-2">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              <span className="font-medium">{getRelativeTime(file.created_at)}</span>
            </div>
            {file.resource_type === 'file' && (
              <span className="font-semibold text-gray-600">{formatFileSize(file.file_size)}</span>
            )}
          </div>
          
          {/* Owner Info */}
          {showOwner && file.users && (
            <div className="text-gray-600 pt-2 border-t border-gray-200/50">
              Uploaded by{' '}
              <a 
                href={`/u/${file.users.username || 'unknown'}`} 
                className="hover:underline font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {file.users.username || 'Unknown User'}
                {file.users.checkmark && checkmarkImg}
              </a>
              {file.users.school_name && (
                <span className="text-gray-500 font-medium"> • {file.users.school_name}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        {showPurchaseButton && user ? (
          <div className="space-y-3">
            {/* Archive Button - Show for all users (including owner) */}
            {purchaseCost > 0 ? (
              <CostBubbleWrapper cost={purchaseCost} position="top-right" size="sm">
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing || isPurchased}
                  className={`
                    group/btn relative overflow-hidden w-full flex items-center justify-center gap-3 px-4
                    py-3.5 bg-gradient-to-r ${isPurchased ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-indigo-500'} text-white rounded-2xl 
                    font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                    transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  `}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500"></div>
                  
                  {/* Button content */}
                  <div className="relative flex items-center gap-3">
                    {isPurchased ? (
                      <>
                        <Check size={18} className="transform group-hover/btn:scale-110 transition-transform duration-300" />
                        <span className="group-hover/btn:tracking-wide transition-all duration-300">
                          Purchased
                        </span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} className="transform group-hover/btn:scale-110 transition-transform duration-300" />
                        <span className="group-hover/btn:tracking-wide transition-all duration-300">
                          {isPurchasing ? 'Purchasing...' : `Add to Archive`}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </CostBubbleWrapper>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || isPurchased}
                className={`
                  group/btn relative overflow-hidden w-full flex items-center justify-center gap-3 
                  py-3.5 bg-gradient-to-r ${isPurchased ? 'from-green-500 to-emerald-500' : 'from-green-500 to-emerald-500'} text-white rounded-2xl 
                  font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                  transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500"></div>
                
                {/* Button content */}
                <div className="relative flex items-center gap-3">
                  {isPurchased ? (
                    <>
                      <Check size={18} className="transform group-hover/btn:scale-110 transition-transform duration-300" />
                      <span className="group-hover/btn:tracking-wide transition-all duration-300">
                        Added to Archive
                      </span>
                    </>
                  ) : (
                    <>
                      <Check size={18} className="transform group-hover/btn:scale-110 transition-transform duration-300" />
                      <span className="group-hover/btn:tracking-wide transition-all duration-300">
                        {isPurchasing ? 'Adding...' : 'Add to Archive (Free)'}
                      </span>
                    </>
                  )}
                </div>
              </button>
            )}
            
            {/* Access Button - Always show for links, only show for files if purchased */}
            {(purchaseCost === 0 || isPurchased) && (
              <button
                onClick={() => handleDownload(file)}
                className={`
                  group/btn relative overflow-hidden w-full flex items-center justify-center gap-3 
                  py-3 bg-gradient-to-r ${resourceStyle.iconGradient} text-white rounded-2xl 
                  font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                  transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
                `}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500"></div>
                
                {/* Button content */}
                <div className="relative flex items-center gap-3">
                  <actionButton.icon size={18} className="transform group-hover/btn:scale-110 transition-transform duration-300" />
                  <span className="group-hover/btn:tracking-wide transition-all duration-300">
                    {actionButton.text}
                  </span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => handleDownload(file)}
            className={`
              group/btn relative overflow-hidden w-full flex items-center justify-center gap-3 
              py-3.5 bg-gradient-to-r ${resourceStyle.iconGradient} text-white rounded-2xl 
              font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
              transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
            `}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500"></div>
            
            {/* Button content */}
            <div className="relative flex items-center gap-3">
              <actionButton.icon size={18} className="transform group-hover/btn:scale-110 transition-transform duration-300" />
              <span className="group-hover/btn:tracking-wide transition-all duration-300">
                {actionButton.text}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Hover shine effect for entire card */}
      <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 pointer-events-none"></div>
    </div>
  );
};