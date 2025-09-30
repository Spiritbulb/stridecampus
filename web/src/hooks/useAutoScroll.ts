import { useRef, useEffect, useState, useCallback } from 'react';

interface UseAutoScrollOptions {
  threshold?: number; // Distance from bottom to consider "at bottom"
  smooth?: boolean;
}

export const useAutoScroll = (options: UseAutoScrollOptions = {}) => {
  const { threshold = 100, smooth = true } = options;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user is at bottom of scroll
  const checkIfAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom <= threshold;
  }, [threshold]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    
    // Show scroll button if user scrolled up
    if (!atBottom) {
      setShowScrollButton(true);
      setIsUserScrolling(true);
    } else {
      setShowScrollButton(false);
      setIsUserScrolling(false);
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set timeout to detect when user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [checkIfAtBottom]);

  // Scroll to bottom function
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current || (!isAtBottom && !force)) return;
    
    messagesEndRef.current.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant',
      block: 'end'
    });
    
    setShowScrollButton(false);
    setIsAtBottom(true);
  }, [isAtBottom, smooth]);

  // Auto-scroll when new messages arrive (only if user was at bottom)
  const autoScrollToBottom = useCallback(() => {
    if (isAtBottom && !isUserScrolling) {
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [isAtBottom, isUserScrolling, scrollToBottom]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    setIsAtBottom(checkIfAtBottom());

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, checkIfAtBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    scrollContainerRef,
    messagesEndRef,
    isAtBottom,
    showScrollButton,
    scrollToBottom,
    autoScrollToBottom,
  };
};
