import React from 'react';
import { Lock } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  color: 'accent' | 'warning' | 'destructive' | 'primary';
  comingSoon?: boolean;
  url: any;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

// Enhanced color mappings for the new gradient design
const GRADIENT_BG_MAP = {
  accent: 'from-red-50 via-white to-pink-50',
  warning: 'from-amber-50 via-white to-orange-50',
  destructive: 'from-rose-50 via-white to-red-50',
  primary: 'from-blue-50 via-white to-indigo-50'
} as const;

const ICON_GRADIENT_MAP = {
  accent: 'from-[#f23b36] to-[#e12a24]',
  warning: 'from-amber-500 to-orange-500',
  destructive: 'from-red-500 to-rose-500',
  primary: 'from-blue-500 to-indigo-500'
} as const;

const DECORATION_COLOR_MAP = {
  accent: 'from-red-100 to-pink-100',
  warning: 'from-amber-100 to-orange-100',
  destructive: 'from-rose-100 to-red-100',
  primary: 'from-blue-100 to-indigo-100'
} as const;

const ACCENT_COLOR_MAP = {
  accent: 'from-[#f23b36] to-pink-500',
  warning: 'from-amber-500 to-orange-500',
  destructive: 'from-red-500 to-rose-500',
  primary: 'from-blue-500 to-indigo-500'
} as const;

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
          Quick Actions
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-[#f23b36] to-pink-500 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`
              group relative overflow-hidden bg-gradient-to-br ${GRADIENT_BG_MAP[action.color]} 
              rounded-3xl p-6 text-left shadow-sm border border-gray-100 
              transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
              ${action.comingSoon 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
              }
            `}
            disabled={action.comingSoon}
            onClick={() => { 
              if (!action.comingSoon && action.url) {
                window.location.href = action.url;
              }
            }}
          >
            {/* Background decorations */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${DECORATION_COLOR_MAP[action.color]} rounded-full opacity-30 transform translate-x-12 -translate-y-12`}></div>
            <div className={`absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr ${DECORATION_COLOR_MAP[action.color]} rounded-full opacity-20 transform -translate-x-8 translate-y-8`}></div>
            
            {/* Coming Soon Lock Icon */}
            {action.comingSoon && (
              <div className="absolute top-4 right-4 z-20">
                <div className="w-8 h-8 bg-gray-400/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lock size={16} className="text-gray-600" />
                </div>
              </div>
            )}
            
            {/* Content Container */}
            <div className="relative z-10 space-y-4">
              {/* Icon Section */}
              <div className="flex justify-start items-center">
                <div className="relative group/icon">
                  <div className={`absolute inset-0 opacity-10 group-hover/icon:opacity-20 transition-opacity duration-500`}></div>
                  <div className={`
                    w-14 h-14 bg-gradient-to-br ${ICON_GRADIENT_MAP[action.color]} rounded-2xl 
                    flex items-center justify-center transform 
                    ${!action.comingSoon ? 'group-hover:scale-105' : ''} 
                    transition-transform duration-500 relative z-10 shadow-lg
                  `}>
                    <HugeiconsIcon icon={action.icon} className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed">
                  {action.description}
                </p>
                
                {/* Accent line */}
                <div className={`w-8 h-0.5 bg-gradient-to-r ${ACCENT_COLOR_MAP[action.color]} rounded-full`}></div>
              </div>
              
              {/* Coming Soon Badge */}
              {action.comingSoon && (
                <div className="flex justify-start">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
                    Coming Soon
                  </span>
                </div>
              )}
            </div>

            {/* Hover shine effect */}
            {!action.comingSoon && (
              <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 pointer-events-none"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};