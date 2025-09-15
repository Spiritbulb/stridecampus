import React from 'react';
import { LucideIcon, Lock } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'accent' | 'warning' | 'destructive' | 'primary';
  comingSoon?: boolean;
  url: any;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const colorMap = {
    accent: 'bg-[#f23b36]',     // Using the red from your auth screen
    warning: 'bg-amber-500',    // Standard warning color
    destructive: 'bg-red-500',  // Standard destructive color
    primary: 'bg-blue-500'      // Standard primary color
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`relative ${colorMap[action.color]} p-6 rounded-2xl text-left text-white hover:scale-105 transition-transform duration-300 ${action.comingSoon ? 'opacity-80' : 'hover:shadow-lg'}`}
            disabled={action.comingSoon}
            onClick={() => { if (!action.comingSoon && action.url) window.location.href = action.url; }}
          >
            {action.comingSoon && (
              <div className="absolute top-3 right-3">
                <Lock size={16} />
              </div>
            )}
            
            <action.icon className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-1">{action.title}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
            
            {action.comingSoon && (
              <div className="mt-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};