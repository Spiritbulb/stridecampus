// hooks/usePullToRefresh.ts
'use client';

import { useRef, useState, useCallback, RefObject } from 'react';

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  resistance?: number;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  containerRef: any;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  resistance = 2.5
}: UsePullToRefreshOptions = {}): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const canPull = useCallback(() => {
    if (!containerRef.current) return false;
    
    // Only allow pull-to-refresh when scrolled to the top
    const scrollTop = containerRef.current.scrollTop || window.scrollY || document.documentElement.scrollTop;
    return scrollTop === 0;
  }, []);

  const handleStart = useCallback((clientY: number) => {
    if (!canPull() || isRefreshing) return;
    
    setStartY(clientY);
    setIsPulling(true);
  }, [canPull, isRefreshing]);

  const handleMove = useCallback((clientY: number) => {
    if (!isPulling || isRefreshing) return;

    const deltaY = clientY - startY;
    
    if (deltaY > 0) {
      // Apply resistance to make pulling feel more natural
      const distance = Math.min(deltaY / resistance, maxPullDistance);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, startY, resistance, maxPullDistance]);

  const handleEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);
    setIsMouseDown(false);

    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse handlers for desktop testing
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsMouseDown(true);
    handleStart(e.clientY);
  }, [handleStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDown) return;
    handleMove(e.clientY);
  }, [isMouseDown, handleMove]);

  const onMouseUp = useCallback(() => {
    if (!isMouseDown) return;
    handleEnd();
  }, [isMouseDown, handleEnd]);

  const onMouseLeave = useCallback(() => {
    if (!isMouseDown) return;
    setIsPulling(false);
    setIsMouseDown(false);
    setPullDistance(0);
  }, [isMouseDown]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    containerRef,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave
    }
  };
}