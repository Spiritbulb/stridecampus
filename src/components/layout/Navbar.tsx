'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, User, LogOut, X, MessageSquare, Home, BookOpen, Users, Settings, MessageCirclePlus, Menu, PlusSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useApp } from '@/contexts/AppContext';
import Notifications from './Notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

// Constants
const NOTIFICATIONS_STORAGE_KEY = 'notificationsOpen';
const UNREAD_BATCH_SIZE = 50; // Process notifications in batches
const MARK_READ_DEBOUNCE = 300; // Debounce mark as read operations

// Optimized storage manager
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

// Custom hook for pathname to prevent unnecessary renders
function usePathname() {
  const [pathname, setPathname] = useState(() => 
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleLocationChange = () => {
      const newPathname = window.location.pathname;
      setPathname(current => current !== newPathname ? newPathname : current);
    };
    
    // Listen for navigation changes
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  return pathname;
}

// Optimized notification button component
const NotificationButton = React.memo(({ 
  isOpen, 
  unreadCount, 
  onToggle 
}: {
  isOpen: boolean;
  unreadCount: number;
  onToggle: () => void;
}) => (
  <div className="relative group">
    <button 
      className="relative p-3 rounded-full hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center" 
      onClick={onToggle} 
      title="Notifications"
      aria-label={isOpen ? "Close notifications" : "Open notifications"}
    >
      {isOpen ? <X size={24}/> : <Bell size={24}/>}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
    {/* Tooltip */}
    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
      Notifications
      <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
    </div>
  </div>
));

NotificationButton.displayName = 'NotificationButton';

// Optimized user profile section
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
    {/* Profile Link */}
    <div className="relative group">
      <Link 
        href={`/u/${username}`} 
        className="flex items-center justify-center p-3 rounded-full hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <User size={20} className="text-accent-foreground" />
        </div>
      </Link>
      {/* Tooltip */}
      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
        {user?.full_name || 'Profile'}
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
      </div>
    </div>

    {/* Sign Out Button */}
    <div className="relative group">
      <button 
        onClick={onSignOut}
        className="p-3 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors duration-200 flex items-center justify-center"
        title="Sign Out"
        aria-label="Sign out"
      >
        <LogOut size={20} />
      </button>
      {/* Tooltip */}
      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
        Sign out
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
      </div>
    </div>
  </div>
));

UserProfile.displayName = 'UserProfile';

// Loading skeleton component
const LoadingSkeleton = React.memo(() => (
  <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Desktop Sidebar component - Twitter style
const DesktopSidebar = React.memo(({ 
  pathname,
  user,
  username,
  onSignOut,
  isNotificationsOpen,
  unreadCount,
  onNotificationsToggle
}: { 
  pathname: string;
  user: any;
  username: any;
  onSignOut: () => void;
  isNotificationsOpen: boolean;
  unreadCount: number;
  onNotificationsToggle: () => void;
}) => {
  const navItems = [
    { name: 'Arena', href: '/arena', icon: Home },
    { name: 'Library', href: '/library', icon: BookOpen },
    { name: 'Spaces', href: '/spaces', icon: Users },
    { name: 'Create', href: '/create?type=post', icon: PlusSquare},
    { name: 'Chats', href: '/chats', icon: MessageSquare },
  ];

  return (
    <div className="hidden md:flex fixed top-0 left-0 h-full w-20 bg-white border-r border-gray-200 flex-col items-center py-6 z-40">
      {/* Logo */}
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

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
                          pathname.startsWith(item.href)
          
          return (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-[#f23b36]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
              </Link>
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
                {item.name}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="flex flex-col items-center gap-4 mt-auto">
          {/* Notifications */}
          <NotificationButton
            isOpen={isNotificationsOpen}
            unreadCount={unreadCount}
            onToggle={onNotificationsToggle}
          />
          
          {/* Profile and Sign Out */}
          <UserProfile user={user} onSignOut={onSignOut} username={username}/>
        </div>
      )}
    </div>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';

// Mobile navigation component
const MobileNav = React.memo(() => {
  return (
    <div className="flex md:hidden items-center gap-4">
      <a
        href="/chats"
        className="p-2 text-muted-foreground hover:text-[#f23b36] transition-colors"
        title="Messages"
        aria-label="Messages"
      >
        <EnvelopeIcon className='w-5' />
      </a>
    </div>
  );
});

MobileNav.displayName = 'MobileNav';

export const Navbar: React.FC = React.memo(() => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { handleNavigateToAuth } = useApp();
  const pathname = usePathname();
  const { notifications, unreadCount, markAsRead } = useNotifications(user?.id);
  const username = user?.username;
  
  // State with lazy initialization
  const [isNotificationsOpen, setNotificationsOpen] = useState(() =>
    NavbarStorageManager.get(NOTIFICATIONS_STORAGE_KEY, false)
  );
  
  // Refs for performance optimization
  const markReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMarkReadRef = useRef<Set<string>>(new Set());
  
  // Memoized computed values
  const isArenaPage = useMemo(() => pathname === '/arena', [pathname]);
  
  const unreadNotifications = useMemo(() => 
    notifications.filter((n: any) => !n.read),
    [notifications]
  );
  
  // Optimized mark as read handler with batching and debouncing
  const handleMarkAsRead = useCallback((notificationIds: string[]) => {
    if (notificationIds.length === 0) return;
    
    // Add to pending set
    notificationIds.forEach(id => pendingMarkReadRef.current.add(id));
    
    // Clear existing timeout
    if (markReadTimeoutRef.current) {
      clearTimeout(markReadTimeoutRef.current);
    }
    
    // Debounce the actual marking
    markReadTimeoutRef.current = setTimeout(() => {
      const idsToMark = Array.from(pendingMarkReadRef.current);
      pendingMarkReadRef.current.clear();
      
      // Process in batches
      for (let i = 0; i < idsToMark.length; i += UNREAD_BATCH_SIZE) {
        const batch = idsToMark.slice(i, i + UNREAD_BATCH_SIZE);
        batch.forEach(id => markAsRead(id));
      }
    }, MARK_READ_DEBOUNCE);
  }, [markAsRead]);
  
  // Optimized notifications toggle handler
  const handleNotificationsToggle = useCallback(() => {
    const newState = !isNotificationsOpen;
    setNotificationsOpen(newState);
    NavbarStorageManager.set(NOTIFICATIONS_STORAGE_KEY, newState);
    
    // Mark unread notifications as read when opening
    if (newState && unreadCount > 0 && unreadNotifications.length > 0) {
      const unreadIds = unreadNotifications.map((n: any) => n.id);
      handleMarkAsRead(unreadIds);
    }
  }, [isNotificationsOpen, unreadCount, unreadNotifications, handleMarkAsRead]);
  
  const handleClose = useCallback(() => {
    setNotificationsOpen(false);
    NavbarStorageManager.set(NOTIFICATIONS_STORAGE_KEY, false);
  }, []);
  
  // Memoized sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Clear storage on sign out
      NavbarStorageManager.clear();
      // Redirect to home page after sign out
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [signOut, router]);

  const [isMobile, setIsMobile] = useState(false);
  
  // Cleanup on unmount
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint
    }
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
    };
  }, []);
  
  // Memoized notification data to prevent unnecessary re-renders
  const notificationData = useMemo(() => notifications, [notifications]);

  // Handle get started click - use context navigation
  const handleGetStarted = useCallback(() => {
    handleNavigateToAuth();
  }, [handleNavigateToAuth]);
  
  return (
    <>
      {/* Desktop Sidebar - Always visible when user is logged in */}
      {user && (
        <DesktopSidebar 
          pathname={pathname} 
          user={user}
          username={username}
          onSignOut={handleSignOut}
          isNotificationsOpen={isNotificationsOpen}
          unreadCount={unreadCount}
          onNotificationsToggle={handleNotificationsToggle}
        />
      )}
      
      {/* Mobile Navbar */}
      <nav className="md:hidden bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo-rectangle.png" 
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

            {/* Conditional rendering based on auth state */}
            {!user && !authLoading && (
              <button 
                onClick={handleGetStarted}
                className="px-4 py-2 bg-[#f23b36] text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                Get Started
              </button>
            )}

            {authLoading && <LoadingSkeleton />}
            
            {/* User Actions */}
            {user && (
              <div className="flex items-center gap-4">
                {/* Mobile Navigation */}
                <MobileNav />
                
                {/* Notifications */}
                <button 
                  className="relative p-2 text-muted-foreground hover:text-[#f23b36] transition-colors" 
                  onClick={handleNotificationsToggle} 
                  title="Notifications"
                  aria-label={isNotificationsOpen ? "Close notifications" : "Open notifications"}
                >
                  {isNotificationsOpen ? <X size={16}/> : <Bell size={16}/>}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile Menu */}
                <div className="flex items-center gap-3">
                  <Link href={`/u/${username}`} className="flex items-center gap-2 hover:underline">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <User size={16} className="text-accent-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground hidden sm:block">
                      {user?.full_name}
                    </span>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="p-2 text-muted-foreground hover:text-[#f23b36] transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Notifications Panel */}
          {isNotificationsOpen && (
            <Notifications 
              notifications={notificationData} 
              onClose={handleClose}
              unreadCount={unreadCount}
            />
          )}
        </div>
      </nav>

      {/* Desktop Notifications Panel - positioned relative to sidebar */}
      {user && isNotificationsOpen && (
        <div className="hidden md:block fixed top-4 left-24 w-80 z-50">
          <Notifications 
            notifications={notificationData} 
            onClose={handleClose}
            unreadCount={unreadCount}
          />
        </div>
      )}
    </>
  );
});

Navbar.displayName = 'Navbar';