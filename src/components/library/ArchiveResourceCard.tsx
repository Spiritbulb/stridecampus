import React, { useState } from 'react';
import { ArchiveResource } from './types';
import { FileText, Youtube, ExternalLink, Download, Play, Calendar, Coins, User } from 'lucide-react';
import { formatDate } from './utils';

interface ArchiveResourceCardProps {
  resource: ArchiveResource;
}

export const ArchiveResourceCard: React.FC<ArchiveResourceCardProps> = ({ resource }) => {
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  
  const resourceData = resource.resource_data;
  const resourceStyle = getResourceStyle(resourceData.resource_type);

  const getResourceTypeIcon = () => {
    switch (resourceData.resource_type) {
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
    switch (resourceData.resource_type) {
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

  const handleAction = () => {
    if (resourceData.resource_type === 'youtube' && resourceData.youtube_url) {
      window.open(resourceData.youtube_url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (resourceData.url && resourceData.resource_type !== 'file') {
      window.open(resourceData.url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For file downloads
    if (resourceData.resource_type === 'file') {
      const fileUrl = 'https://media.stridecampus.com/' + resourceData.filename;
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = fileUrl;
      a.download = resourceData.original_name;
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    }
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
            
            {/* Purchase Badge */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-sm">
              <Coins size={12} />
              Purchased
            </div>
          </div>
        </div>
        
        {/* Title */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {resourceData.resource_type === 'youtube' ? (
              resourceData.description || 'YouTube Video'
            ) : resourceData.resource_type === 'file' ? (
              resourceData.original_name
            ) : (
              resourceData.description || resourceData.url || 'Linked Resource'
            )}
          </h3>
          
          {/* Accent line */}
          <div className={`w-12 h-0.5 bg-gradient-to-r ${resourceStyle.accent} rounded-full`}></div>
        </div>
        
        {/* Description (only show if different from title) */}
        {resourceData.description && resourceData.resource_type !== 'youtube' && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {resourceData.description}
          </p>
        )}
        
        
        {/* Purchase Info */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-200/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} />
              <span className="font-medium">
                Purchased {formatDate(resource.purchased_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 font-semibold">
              <Coins size={14} />
              <span>{resource.cost_paid > 0 ? `${resource.cost_paid} credits` : 'Free'}</span>
            </div>
          </div>
        </div>
        
        {/* Owner Info */}
        {resourceData.users && (
          <div className="text-gray-600 text-xs mb-4 pt-2 border-t border-gray-200/50">
            <div className="flex items-center gap-2">
              <User size={12} />
              <span>Created by </span>
              <span className="font-semibold text-blue-600">
                {resourceData.users.username || 'Unknown User'}
              </span>
              {resourceData.users.school_name && (
                <span className="text-gray-500">• {resourceData.users.school_name}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <button
          onClick={handleAction}
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
      </div>

      {/* Hover shine effect for entire card */}
      <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 pointer-events-none"></div>
    </div>
  );
};

// Helper function to get resource styling
function getResourceStyle(resourceType: string) {
  const styles = {
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
  };

  return styles[resourceType as keyof typeof styles] || styles.file;
}
