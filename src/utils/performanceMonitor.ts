// Performance monitoring utilities

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private entries: Map<string, PerformanceEntry> = new Map();
  private completedEntries: PerformanceEntry[] = [];
  private maxEntries = 100; // Prevent memory leaks

  startTiming(name: string, metadata?: Record<string, any>) {
    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.entries.set(name, entry);
    console.log(`[Performance] Started: ${name}`, metadata);
  }

  endTiming(name: string, additionalMetadata?: Record<string, any>) {
    const entry = this.entries.get(name);
    if (!entry) {
      console.warn(`[Performance] No start entry found for: ${name}`);
      return;
    }

    const duration = performance.now() - entry.startTime;
    const completedEntry: PerformanceEntry = {
      ...entry,
      duration,
      metadata: { ...entry.metadata, ...additionalMetadata }
    };

    this.completedEntries.push(completedEntry);
    this.entries.delete(name);

    // Limit memory usage
    if (this.completedEntries.length > this.maxEntries) {
      this.completedEntries.shift();
    }

    console.log(`[Performance] Completed: ${name} (${duration.toFixed(2)}ms)`, completedEntry.metadata);

    // Warn about slow operations
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
  }

  getCompletedEntries(): PerformanceEntry[] {
    return [...this.completedEntries];
  }

  getSlowOperations(threshold = 500): PerformanceEntry[] {
    return this.completedEntries.filter(entry => 
      entry.duration && entry.duration > threshold
    );
  }

  clear() {
    this.entries.clear();
    this.completedEntries.length = 0;
  }

  // Monitor specific types of operations
  monitorNetworkRequest<T>(
    name: string, 
    requestFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTiming(`network:${name}`, metadata);
    
    return requestFn()
      .then(result => {
        this.endTiming(`network:${name}`, { success: true });
        return result;
      })
      .catch(error => {
        this.endTiming(`network:${name}`, { 
          success: false, 
          error: error.message 
        });
        throw error;
      });
  }

  monitorComponentRender(componentName: string, renderFn: () => void) {
    this.startTiming(`render:${componentName}`);
    try {
      renderFn();
    } finally {
      this.endTiming(`render:${componentName}`);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for common monitoring scenarios
export function monitorAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.monitorNetworkRequest(name, operation, metadata);
}

export function measureTime<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
  performanceMonitor.startTiming(name, metadata);
  try {
    const result = fn();
    performanceMonitor.endTiming(name);
    return result;
  } catch (error) {
    performanceMonitor.endTiming(name, { error: (error as Error).message });
    throw error;
  }
}

// Timer leak detection without overriding window functions
let timerCount = 0;
const maxTimers = 20;

export function createSafeInterval(callback: () => void, ms: number): NodeJS.Timeout {
  timerCount++;
  if (timerCount > maxTimers) {
    console.warn(`[Timer] Too many active timers (${timerCount}). Possible memory leak.`);
  }
  
  const timer = setInterval(() => {
    try {
      callback();
    } catch (error) {
      console.error('[Timer] Error in interval callback:', error);
    }
  }, ms);
  
  return timer;
}

export function clearSafeInterval(timer: NodeJS.Timeout): void {
  timerCount = Math.max(0, timerCount - 1);
  clearInterval(timer);
}