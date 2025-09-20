'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookOpenIcon,
  UserIcon,
  UsersIcon,
  CogIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  UserIcon as UserIconSolid,
  UsersIcon as UsersIconSolid,
  CogIcon as CogIconSolid,
  ChatBubbleBottomCenterIcon
} from '@heroicons/react/24/solid';
import { MessageCirclePlus, BotMessageSquareIcon, BotIcon, PlusSquare, PlusCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Navigation items with icons
  const navItems = [
    {
      name: 'Arena',
      href: '/arena',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      isActive: pathname === '/arena'
    },
    {
      name: 'Spaces',
      href: '/spaces',
      icon: UsersIcon,
      activeIcon: UsersIconSolid,
      isActive: pathname === '/spaces' || pathname.startsWith('/spaces/')
    },
    {
      name: 'Create',
      href: '/create?type=post',
      icon: PlusSquare,
      activeIcon: PlusSquare,
      isActive: pathname === '/create' || pathname.startsWith('/create/')
    },
    {
      name: 'Nia',
      href: '/nia',
      icon: BotMessageSquareIcon,
      activeIcon: BotIcon,
      isActive: pathname === '/nia' || pathname.startsWith('/u/')
    },
    {
      name: 'Library',
      href: '/library',
      icon: BookOpenIcon,
      activeIcon: BookOpenIconSolid,
      isActive: pathname === '/library' || pathname.startsWith('/library/')
    }
  ];

  return (
    <>
      {/* Mobile Footer Navigation */}
      {user && (
        <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50 pt-20">
        <div className="bg-white">
          <div className="grid grid-cols-5 py-4">
            {navItems.map((item) => {
              const IconComponent = item.isActive ? item.activeIcon : item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-1 text-xs ${
                    item.isActive
                      ? 'text-[#f23b36]'
                      : 'text-gray-600 hover:text-[#f23b36]'
                  }`}
                >
                  <IconComponent className="h-6 w-6" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
      )}
      

      
    </>
  );
};