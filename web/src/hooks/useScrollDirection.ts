'use client';
import { useState, useEffect, useCallback } from 'react';

interface UseScrollDirectionProps {
  threshold?: number;
  hideOnPages?: string[];
}

export const useScrollDirection = ({ 
  threshold = 10, 
  hideOnPages = [] 
}: UseScrollDirectionProps = {}) => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY;
    const direction = scrollY > lastScrollY ? 'down' : 'up';
    
    // Only update if scroll distance is greater than threshold
    if (Math.abs(scrollY - lastScrollY) < threshold) {
      return;
    }

    setScrollDirection(direction);
    setLastScrollY(scrollY);
    
    // Show button when scrolling up or at the top, hide when scrolling down
    if (direction === 'up' || scrollY < 50) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [lastScrollY, threshold]);

  useEffect(() => {
    const handleScroll = () => updateScrollDirection();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollDirection]);

  return {
    scrollDirection,
    isVisible,
    lastScrollY
  };
};
