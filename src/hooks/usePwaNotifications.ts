// src/hooks/usePwaNotifications.ts
import { useState, useEffect } from 'react';

export function usePwaNotifications(userId: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    
    new Notification(title, options);
  };

  return {
    permission,
    requestPermission,
    showNotification,
    canNotify: permission === 'granted'
  };
}