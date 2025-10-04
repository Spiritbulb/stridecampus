'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, User, LogOut, X, MessageSquare, Home, BookOpen, Users, Settings, MessageCirclePlus, Menu, PlusSquare, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useApp } from '@/contexts/AppContext';
import Notifications from './Notifications';
import Link from 'next/link';
import { useRouter, usePathname as useNextPathname } from 'next/navigation';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useCreateModal } from '@/hooks/useCreateModal';
import CreateModal from '@/components/create/CreateModal';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon, Book01Icon, PeerToPeer01FreeIcons, PlusSignIcon, RankingIcon, Message01Icon, Setting06FreeIcons, Settings01FreeIcons } from '@hugeicons/core-free-icons';
import DonationSection from '@/components/common/DonationSection';
import { AIModal } from '@/components/layout/ai';
import { useAuth0 } from '@auth0/auth0-react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

// Constants
const NOTIFICATIONS_STORAGE_KEY = 'notificationsOpen';
const UNREAD_BATCH_SIZE = 50;
const MARK_READ_DEBOUNCE = 300;

// Storage Manager
class NavbarStorageManager {
  private static cache = new Map<string, any>();
  
  static get(key: string, defaultValue: any = null): any {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const value = localStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : defaultValue;
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      return defaultValue;
    }
  }
  
  static set(key: string, value: any): void {
    this.cache.set(key, value);
    
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to persist ${key}:`, error);
    }
  }
  
  static clear(): void {
    this.cache.clear();
  }
}

// Use Next.js usePathname for real-time pathname updates
const usePathname = useNextPathname;

// Notification Button Component
const NotificationButton = React.memo(({ 
  isOpen, 
  unreadCount, 
  onToggle,
  notificationPermission,
  onRequestPermission
}: {
  isOpen: boolean;
  unreadCount: number;
  onToggle: () => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
}) => {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const handleClick = () => {
    if (notificationPermission === 'default') {
      setShowPermissionPrompt(true);
    } else {
      onToggle();
    }
  };

  const handleEnableNotifications = async () => {
    await onRequestPermission();
    setShowPermissionPrompt(false);
    if (notificationPermission === 'granted') {
      onToggle();
    }
  };

  return (
    <div className="relative group">
      <button 
        className="relative p-3 rounded-full hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center" 
        onClick={handleClick} 
        title="Notifications"
        aria-label={isOpen ? "Close notifications" : "Open notifications"}
      >
        {isOpen ? <X size={24}/> : <Bell size={24}/>}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {notificationPermission === 'default' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></span>
        )}
      </button>
      
      {showPermissionPrompt && (
        <div className="absolute left-full ml-4 w-64 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="text-sm font-medium text-gray-900 mb-2">
            Enable Notifications?
          </div>
          <div className="text-xs text-gray-600 mb-3">
            Get notified about new messages, updates, and activities.
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleEnableNotifications}
              className="flex-1 px-3 py-1.5 bg-[#f23b36] text-white text-xs rounded-md hover:bg-[#e03530]"
            >
              Enable
            </button>
            <button 
              onClick={() => setShowPermissionPrompt(false)}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300"
            >
              Later
            </button>
          </div>
        </div>
      )}

      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-40 top-1/2 transform -translate-y-1/2">
        Notifications
        {notificationPermission === 'default' && ' (Click to enable)'}
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
      </div>
    </div>
  );
});

NotificationButton.displayName = 'NotificationButton';

// User Profile Component
const UserProfile = React.memo(({
  user, 
  username, 
  onSignOut 
}: {
  user: any;
  username: any;
  onSignOut: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <div className="relative group">
      <Link 
        href={`/u/${username}`} 
        className="flex items-center justify-center p-3 rounded-full hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f23b36] to-[#e03530] flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
      </Link>
      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
        {user?.full_name || 'Profile'}
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
      </div>
    </div>

    <div className="relative group">
      <button 
        onClick={onSignOut}
        className="p-3 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors duration-200 flex items-center justify-center"
        title="Sign Out"
        aria-label="Sign out"
      >
        <LogOut size={20} />
      </button>
      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
        Sign out
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
      </div>
    </div>
  </div>
));

UserProfile.displayName = 'UserProfile';

// Loading Skeleton
const LoadingSkeleton = React.memo(() => (
  <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Enhanced Mobile Navigation Component
const MobileNavigation = React.memo(({ 
  pathname,
  user,
  username,
  onSignOut,
  isNotificationsOpen,
  onNotificationsToggle,
  notificationPermission,
  onRequestPermission,
  onCreateClick,
  onAIModalToggle
}: {
  pathname: string;
  user: any;
  username: any;
  onSignOut: () => void;
  isNotificationsOpen: boolean;
  onNotificationsToggle: () => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
  onCreateClick: () => void;
  onAIModalToggle: () => void;
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Spaces', href: '/spaces', icon: Home01Icon },
    { name: 'Arena', href: '/arena', icon: RankingIcon },
    { name: 'Library', href: '/library', icon: Book01Icon },
    { name: 'Chats', href: '/chats', icon: Message01Icon },
    { name: 'Settings', href: '/settings', icon: Setting06FreeIcons },
  ];

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const handleItemClick = (item: any) => {
    if (item.isAction) {
      if (item.name === 'Create') {
        onCreateClick();
      } else if (item.actionType === 'ai') {
        onAIModalToggle();
      }
    }
    setMenuOpen(false);
  };

  // Close menu when pathname changes (navigation occurs)
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-menu-container')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const router = useRouter();

  return (
    <div className="mobile-menu-container">
      <button
        onClick={toggleMenu}
        className="p-2 hover:text-[#f23b36] transition-colors duration-200"
        aria-label="Open menu"
        aria-expanded={isMenuOpen}
      >
        <Menu size={24} className="text-gray-700" />
      </button>

      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          
          <div className="fixed top-0 left-0 h-full w-80 max-w-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <a href={`/u/${user?.username}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f23b36] to-[#e03530] flex items-center justify-center">
                  <img src={user?.avatar_url || '/default-avatar.png'} className='w-9 h-auto object-contain rounded-full'/>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-gray-500 text-xs">@{username}</p>
                </div>
              </div>
              </a>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-4">
              <div className="space-y-1 px-2">
                {navItems.map((item) => {
                  const isActive = (
                    pathname === item.href || 
                    pathname.startsWith(item.href?.split('?')[0] || '')
                  );
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                       
                          setMenuOpen(false);
                          router.push(`${item.href}`);
                        
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left ${
                        isActive
                          ? 'bg-[#f23b36] text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                        <HugeiconsIcon 
                          icon={item.icon as any} 
                          size={20} 
                          color="currentColor" 
                          strokeWidth={1.5}
                          className={isActive ? 'text-white' : 'text-current'}
                        />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="p-4 border-t border-gray-200">
              <DonationSection variant="compact" />
            </div>

            <div className="p-4 border-t border-gray-200 space-y-3">
              <button
                onClick={() => {
                  onSignOut();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>

            <div className="p-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Stride Campus • Beta
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

MobileNavigation.displayName = 'MobileNavigation';

// Mobile Nav Component
const MobileNav = React.memo(({ 
  user, 
  username, 
  onSignOut, 
  isNotificationsOpen, 
  onNotificationsToggle,
  notificationPermission,
  onRequestPermission,
  pathname,
  onCreateClick,
  onAIModalToggle
}: { 
  user: any; 
  username: any; 
  onSignOut: () => void; 
  isNotificationsOpen: boolean; 
  onNotificationsToggle: () => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
  pathname: string;
  onCreateClick: () => void;
  onAIModalToggle: () => void;
}) => {
  return (
    <div className="flex md:hidden items-center gap-3">
      {user && (
        <MobileNavigation
          pathname={pathname}
          user={user}
          username={username}
          onSignOut={onSignOut}
          isNotificationsOpen={isNotificationsOpen}
          onNotificationsToggle={onNotificationsToggle}
          notificationPermission={notificationPermission}
          onRequestPermission={onRequestPermission}
          onCreateClick={onCreateClick}
          onAIModalToggle={onAIModalToggle}
        />
      )}
    </div>
  );
});

MobileNav.displayName = 'MobileNav';

// Desktop Sidebar Component
const DesktopSidebar = React.memo(({ 
  pathname,
  user,
  username,
  onSignOut,
  isNotificationsOpen,
  unreadCount,
  onNotificationsToggle,
  notificationPermission,
  onRequestPermission,
  onCreateClick,
  
}: { 
  pathname: string;
  user: any;
  username: any;
  onSignOut: () => void;
  isNotificationsOpen: boolean;
  unreadCount: number;
  onNotificationsToggle: () => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
  onCreateClick: () => void;  
}) => {
  const navItems = [
    { name: 'Spaces', href: '/spaces', icon: Home01Icon },
    { name: 'Arena', href: '/arena', icon: RankingIcon },
    { name: 'Library', href: '/library', icon: Book01Icon },
    { name: 'Chats', href: '/chats', icon: Message01Icon },
    { name: 'Settings', href: '/settings', icon: Settings01FreeIcons },
  ];

  return (
    <div className="hidden md:flex fixed top-0 left-0 h-full w-20 bg-white border-r border-gray-200 flex-col items-center py-6 z-40">
      <div className="mb-6">
        <Link href="/arena" className="block p-3 transition-colors duration-200">
          <div className='items-center'>
            <img 
              src="/logo.png" 
              alt="Stride Campus" 
              className="h-10 w-auto"
              loading="lazy"
              decoding="async" 
            />
            <span className="ml-1 text-xs font-medium bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">Beta</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = (
            pathname === item.href || 
            pathname.startsWith(item.href?.split('?')[0] || '')
          );
          
          return (
            <div key={item.name} className="relative group">
             
                <button
                  onClick={onCreateClick}
                  className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-[#f23b36]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                 
                    <HugeiconsIcon icon={item.icon as any} size={20} color="currentColor" strokeWidth={1.5} />
                 
                </button>
             
                <Link
                //@ts-ignore
                  href={item.href}
                  className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-[#f23b36]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                 
                    <HugeiconsIcon icon={item.icon as any} size={20} color="currentColor" strokeWidth={1.5} />
                 
                </Link>
             
              <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
                {item.name}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          );
        })}
      </nav>

      {user && (
        <div className="flex flex-col items-center gap-4 mt-auto">
          
          <UserProfile user={user} onSignOut={onSignOut} username={username}/>
        </div>
      )}
    </div>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';

// Main Navbar Component
export const Navbar: React.FC = React.memo(() => {
  const router = useRouter();
  const { user: appUser, isLoading} = useApp();
  const { logout } = useAuth0();
  const { handleNavigateToAuth } = useApp();
  const { user, loading: authLoading } = useSupabaseUser(appUser?.email || null);
  const pathname = usePathname();
  const { 
    notifications, 
    unreadCount, 
    markAsRead,
    notificationPermission,
    requestNotificationPermission,
    triggerTestNotification 
  } = useNotifications(user?.id);
  const username = user?.username;
  
  const createModal = useCreateModal();
  
  const [isNotificationsOpen, setNotificationsOpen] = useState(() =>
    NavbarStorageManager.get(NOTIFICATIONS_STORAGE_KEY, false)
  );
  
  const [isAIModalOpen, setAIModalOpen] = useState(false);
  
  const markReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMarkReadRef = useRef<Set<string>>(new Set());
  
  const isArenaPage = useMemo(() => pathname === '/arena', [pathname]);
  
  const unreadNotifications = useMemo(() => 
    notifications.filter((n: any) => !n.read),
    [notifications]
  );
  
  const handleMarkAsRead = useCallback((notificationIds: string[]) => {
    if (notificationIds.length === 0) return;
    
    notificationIds.forEach(id => pendingMarkReadRef.current.add(id));
    
    if (markReadTimeoutRef.current) {
      clearTimeout(markReadTimeoutRef.current);
    }
    
    //@ts-ignore
    markReadTimeoutRef.current = setTimeout(() => {
      const idsToMark = Array.from(pendingMarkReadRef.current);
      pendingMarkReadRef.current.clear();
      
      for (let i = 0; i < idsToMark.length; i += UNREAD_BATCH_SIZE) {
        const batch = idsToMark.slice(i, i + UNREAD_BATCH_SIZE);
        batch.forEach(id => markAsRead(id));
      }
    }, MARK_READ_DEBOUNCE);
  }, [markAsRead]);
  
  const handleNotificationsToggle = useCallback(() => {
    const newState = !isNotificationsOpen;
    setNotificationsOpen(newState);
    NavbarStorageManager.set(NOTIFICATIONS_STORAGE_KEY, newState);
    
    if (newState && unreadCount > 0 && unreadNotifications.length > 0) {
      const unreadIds = unreadNotifications.map((n: any) => n.id);
      handleMarkAsRead(unreadIds);
    }
  }, [isNotificationsOpen, unreadCount, unreadNotifications, handleMarkAsRead]);
  
  const handleClose = useCallback(() => {
    setNotificationsOpen(false);
    NavbarStorageManager.set(NOTIFICATIONS_STORAGE_KEY, false);
  }, []);
  
  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      NavbarStorageManager.clear();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [logout, router]);

  const handleCreateClick = useCallback(() => {
    createModal.openPostModal();
  }, [createModal]);

  const handleAIModalToggle = useCallback(() => {
    setAIModalOpen(prev => !prev);
  }, []);

  const handleAIModalClose = useCallback(() => {
    setAIModalOpen(false);
  }, []);

  const handlePostCreated = useCallback(() => {
    console.log('Post created successfully!');
  }, []);

  const handleSpaceCreated = useCallback((space: any) => {
    console.log('Space created:', space);
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
    };
  }, []);
  
  const notificationData = useMemo(() => notifications, [notifications]);

  const handleGetStarted = useCallback(() => {
    handleNavigateToAuth();
  }, [handleNavigateToAuth]);
  
  return (
    <>
      {user && (
        <DesktopSidebar 
          pathname={pathname} 
          user={user}
          username={username}
          onSignOut={handleSignOut}
          isNotificationsOpen={isNotificationsOpen}
          unreadCount={unreadCount}
          onNotificationsToggle={handleNotificationsToggle}
          notificationPermission={notificationPermission}
          onRequestPermission={requestNotificationPermission}
          onCreateClick={handleCreateClick}
          
        />
      )}
      
      <nav className="md:hidden bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/arena" className="flex items-center gap-2 hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Stride Campus" 
                  className="h-12 w-auto object-contain" 
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className='bg-yellow-500 text-white rounded-full px-2 py-1 text-[10px]'>
                <span>Beta</span>
              </div>
            </a>

            {!user && !authLoading && (
              <button 
                onClick={handleGetStarted}
                className="px-4 py-2 bg-[#f23b36] text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                Get Started
              </button>
            )}

            {authLoading && <LoadingSkeleton />}
            
            {user && (
              <div className="flex items-center gap-3">
                <MobileNav 
                  user={user}
                  username={username}
                  onSignOut={handleSignOut}
                  isNotificationsOpen={isNotificationsOpen}
                  onNotificationsToggle={handleNotificationsToggle}
                  notificationPermission={notificationPermission}
                  onRequestPermission={requestNotificationPermission}
                  pathname={pathname}
                  onCreateClick={handleCreateClick}
                  onAIModalToggle={handleAIModalToggle}
                />
                
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium z-10">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {isNotificationsOpen && (
            <Notifications 
              notifications={notificationData} 
              onClose={handleClose}
              unreadCount={unreadCount}
            />
          )}
        </div>
      </nav>

      {user && isNotificationsOpen && (
        <div className="hidden md:block fixed top-4 left-24 w-80 z-50">
          <Notifications 
            notifications={notificationData} 
            onClose={handleClose}
            unreadCount={unreadCount}
          />
        </div>
      )}

      {/* Create Modal */}
      <CreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        initialType={createModal.type}
        initialSpaceId={createModal.initialSpaceId}
        onPostCreated={handlePostCreated}
        onSpaceCreated={handleSpaceCreated}
      />

      {/* AI Modal */}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={handleAIModalClose}
      />
    </>
  );
});

Navbar.displayName = 'Navbar';