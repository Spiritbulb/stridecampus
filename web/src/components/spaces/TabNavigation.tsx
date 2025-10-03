'use client';

import { memo } from 'react';
import { TrendingUp, ShoppingBag, Users, Settings } from 'lucide-react';

type TabType = 'posts' | 'marketplace' | 'members' | 'settings';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation = memo(function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { key: 'posts' as const, label: 'Posts', icon: TrendingUp },
    { key: 'marketplace' as const, label: 'Marketplace', icon: ShoppingBag },
    { key: 'members' as const, label: 'Members', icon: Users },
    { key: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex overflow-x-auto scrollbar-hide">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === key
              ? 'text-gray-900'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
          {activeTab === key && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f23b36] rounded-full"></div>
          )}
        </button>
      ))}
    </div>
  );
});

export default TabNavigation;
