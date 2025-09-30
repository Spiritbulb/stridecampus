import React, { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  messageCount: number;
  sessionCount: number;
  cacheHitRate: number;
  averageQueryTime: number;
  memoryUsage: number;
}

interface PerformanceConfig {
  enableMetrics: boolean;
  logToConsole: boolean;
  sendToAnalytics: boolean;
  sampleRate: number; // 0-1, percentage of events to track
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableMetrics: true,
  logToConsole: process.env.NODE_ENV === 'development',
  sendToAnalytics: false,
  sampleRate: 0.1, // Track 10% of events in production
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    messageCount: 0,
    sessionCount: 0,
    cacheHitRate: 0,
    averageQueryTime: 0,
    memoryUsage: 0,
  };

  private queryTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private config: PerformanceConfig;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Track render performance
  trackRender(componentName: string, renderTime: number) {
    if (!this.shouldTrack()) return;

    this.metrics.renderTime = renderTime;
    
    if (this.config.logToConsole) {
      console.log(`[Performance] ${componentName} render: ${renderTime.toFixed(2)}ms`);
    }
  }

  // Track database query performance
  trackQuery(queryName: string, queryTime: number, fromCache: boolean = false) {
    if (!this.shouldTrack()) return;

    this.queryTimes.push(queryTime);
    this.metrics.averageQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;

    if (fromCache) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    this.metrics.cacheHitRate = this.cacheHits / (this.cacheHits + this.cacheMisses) || 0;

    if (this.config.logToConsole) {
      console.log(`[Performance] ${queryName}: ${queryTime.toFixed(2)}ms ${fromCache ? '(cached)' : ''}`);
    }
  }

  // Track data metrics
  trackDataMetrics(messageCount: number, sessionCount: number) {
    this.metrics.messageCount = messageCount;
    this.metrics.sessionCount = sessionCount;
  }

  // Track memory usage
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      renderTime: 0,
      messageCount: 0,
      sessionCount: 0,
      cacheHitRate: 0,
      averageQueryTime: 0,
      memoryUsage: 0,
    };
    this.queryTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // Check if we should track this event based on sample rate
  private shouldTrack(): boolean {
    return this.config.enableMetrics && Math.random() < this.config.sampleRate;
  }

  // Send metrics to analytics (placeholder)
  sendToAnalytics() {
    if (!this.config.sendToAnalytics) return;

    // This would integrate with your analytics service
    console.log('[Analytics] Performance metrics:', this.getMetrics());
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Hook for tracking component performance
export const usePerformanceTracking = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  // Track render start
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  // Track render end
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current++;
    
    // Only track every 10th render to avoid spam
    if (renderCount.current % 10 === 0) {
      performanceMonitor.trackRender(componentName, renderTime);
    }
  });

  // Track memory usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      performanceMonitor.trackMemoryUsage();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    trackQuery: useCallback((queryName: string, queryTime: number, fromCache: boolean = false) => {
      performanceMonitor.trackQuery(queryName, queryTime, fromCache);
    }, []),
    
    trackDataMetrics: useCallback((messageCount: number, sessionCount: number) => {
      performanceMonitor.trackDataMetrics(messageCount, sessionCount);
    }, []),
    
    getMetrics: useCallback(() => {
      return performanceMonitor.getMetrics();
    }, []),
    
    resetMetrics: useCallback(() => {
      performanceMonitor.reset();
    }, []),
  };
};

// Hook for measuring async operations
export const useAsyncPerformance = () => {
  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    fromCache: boolean = false
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      
      performanceMonitor.trackQuery(operationName, endTime - startTime, fromCache);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      performanceMonitor.trackQuery(`${operationName}_error`, endTime - startTime, fromCache);
      throw error;
    }
  }, []);

  return { measureAsync };
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  const trackInteraction = useCallback((action: string, metadata?: Record<string, any>) => {
    if (performanceMonitor['shouldTrack']()) {
      const timestamp = Date.now();
      console.log(`[Interaction] ${action} at ${timestamp}`, metadata);
    }
  }, []);

  return { trackInteraction };
};

// Performance dashboard component (for development)
export const PerformanceDashboard = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const { getMetrics } = usePerformanceTracking('PerformanceDashboard');

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [getMetrics]);

  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null;
  }

  return React.createElement('div', {
    className: "fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-xs"
  }, [
    React.createElement('h3', { className: "font-bold mb-2" }, "Performance Metrics"),
    React.createElement('div', { className: "space-y-1" }, [
      React.createElement('div', null, `Render Time: ${metrics.renderTime.toFixed(2)}ms`),
      React.createElement('div', null, `Messages: ${metrics.messageCount}`),
      React.createElement('div', null, `Sessions: ${metrics.sessionCount}`),
      React.createElement('div', null, `Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`),
      React.createElement('div', null, `Avg Query Time: ${metrics.averageQueryTime.toFixed(2)}ms`),
      React.createElement('div', null, `Memory Usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`)
    ])
  ]);
};

export default performanceMonitor;
