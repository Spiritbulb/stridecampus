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
import { MessageCirclePlus } from 'lucide-react';

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
      name: 'Library',
      href: '/library',
      icon: BookOpenIcon,
      activeIcon: BookOpenIconSolid,
      isActive: pathname === '/library' || pathname.startsWith('/library/')
    },
    {
      name: 'Spaces',
      href: '/spaces',
      icon: UsersIcon,
      activeIcon: UsersIconSolid,
      isActive: pathname === '/spaces' || pathname.startsWith('/spaces/')
    },
    {
      name: 'Profile',
      href: `/u/${user?.username || 'profile'}`,
      icon: UserIcon,
      activeIcon: UserIconSolid,
      isActive: pathname === `/u/${user?.username}` || pathname.startsWith('/u/')
    }
  ];

  return (
    <>
      {/* Mobile Footer Navigation */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white">
          <div className="grid grid-cols-4 py-2">
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
                  <span className="mt-1">{item.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Footer (unchanged) */}
      <footer className="hidden md:block bg-card/30 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img 
                src="/logo-rectangle.png" 
                alt="Stride Campus" 
                className="h-6 w-auto" 
                loading="lazy" 
                decoding="async" 
              />
              <span>© {new Date().getFullYear()} Stride Campus</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
              <a 
                href="/library" 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Library
              </a>
              <a 
                href={`/u/${user?.username}`} 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Profile
              </a>
              <a 
                href="/referrals" 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Tell a friend
              </a>
              <a 
                href="/about" 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                About
              </a>
              <a 
                href="/privacy" 
                className="text-black/80 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Privacy
              </a>
              <a 
                href="/support" 
                className="text-black/80 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};