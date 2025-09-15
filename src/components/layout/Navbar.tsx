'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, User, LogOut, X, MessageSquare, Home, BookOpen, Users, Settings, MessageCirclePlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import Notifications from './Notifications';
import Link from 'next/link';

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
  <button 
    className="relative p-2 text-muted-foreground hover:text-[#f23b36] transition-colors" 
    onClick={onToggle} 
    title="Notifications"
    aria-label={isOpen ? "Close notifications" : "Open notifications"}
  >
    {isOpen ? <X size={16}/> : <Bell size={16}/>}
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    )}
  </button>
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
      onClick={onSignOut}
      className="p-2 text-muted-foreground hover:text-[#f23b36] transition-colors cursor-pointer"
      title="Sign Out"
      aria-label="Sign out"
    >
      <LogOut size={16} />
    </button>
  </div>
));

UserProfile.displayName = 'UserProfile';

// Loading skeleton component
const LoadingSkeleton = React.memo(() => (
  <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Desktop navigation component
const DesktopNav = React.memo(({ pathname }: { pathname: string }) => {
  const navItems = [
    { name: 'Arena', href: '/arena', icon: Home },
    { name: 'Library', href: '/library', icon: BookOpen },
    { name: 'Spaces', href: '/spaces', icon: Users },
    { name: 'Chats', href: '/chats', icon: MessageCirclePlus },
  ];

  return (
    <div className="hidden md:flex items-center gap-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || 
                        (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            <span>{item.name}</span>
          </a>
        );
      })}
    </div>
  );
});

DesktopNav.displayName = 'DesktopNav';

// Mobile navigation component (simplified)
const MobileNav = React.memo(() => {
  return (
    <div className="flex md:hidden items-center gap-4">
      <a
        href="/chats"
        className="p-2 text-muted-foreground hover:text-[#f23b36] transition-colors"
        title="Messages"
        aria-label="Messages"
      >
        <MessageCirclePlus size={16} />
      </a>
    </div>
  );
});

MobileNav.displayName = 'MobileNav';

export const Navbar: React.FC = React.memo(() => {
  const { user, loading: authLoading, signOut } = useAuth();
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
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [signOut]);

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
  
  return (
    <nav className=" bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          {isMobile ? (
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
          ) : (
            <a href="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo-rectangle.png" 
                  alt="Stride Campus" 
                  className="h-8 w-auto object-contain" 
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className='bg-yellow-500 text-white rounded-full px-2 py-1 text-[10px]'>
                <span>Beta</span>
              </div>
            </a>
          )}

          {/* Desktop Navigation for authenticated users */}
          {user && <DesktopNav pathname={pathname} />}

          {/* Conditional rendering based on auth state */}
          {!user && !authLoading && (
            <a href="/arena">
              <button className="px-4 py-2 bg-[#f23b36] text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2">
                Get Started
              </button>
            </a>
          )}

          {authLoading && <LoadingSkeleton />}
          
          {/* User Actions */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Mobile Navigation (simplified) */}
              <MobileNav />
              
              {/* Arena Page button 
              {!isArenaPage && (
                <a
                  href="/arena"
                  className="px-3 py-1.5 bg-[#f23b36] text-white rounded-md text-sm font-medium hover:bg-[#d63430] transition-colors"
                >
                  Arena
                </a>
              )}*/}
              
              {/* Notifications */}
              <NotificationButton
                isOpen={isNotificationsOpen}
                unreadCount={unreadCount}
                onToggle={handleNotificationsToggle}
              />

              {/* Profile Menu */}
              <UserProfile user={user} onSignOut={handleSignOut} username={username}/>
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
  );
});

Navbar.displayName = 'Navbar';