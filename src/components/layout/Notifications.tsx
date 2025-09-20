import React, { useRef, useEffect } from 'react';
import { Notification } from '@/utils/supabaseClient';
import { X, Bell } from 'lucide-react';

interface NotificationsProps {
  notifications: Notification[];
  onClose: () => void;
  unreadCount: number;
}

// Notifications Modal
export const Notifications: React.FC<NotificationsProps> = ({ 
  notifications, 
  onClose,
  unreadCount 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Prevent body scrolling when notifications are open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Format timestamp to relative time
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 ml-20 flex justify-start">
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-md h-full shadow-xl animate-in slide-in-from-right duration-300"
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close notifications"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="h-full overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Bell size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet.</p>
              <p className="text-sm text-muted-foreground mt-1">We'll notify you when something arrives.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map(notification => (
                <li 
                  key={notification.id} 
                  className={`p-4 hover:bg-muted/50 transition-colors ${notification.is_read ? 'bg-white' : 'bg-accent/30'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className='text-sm font-medium'>{notification.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;