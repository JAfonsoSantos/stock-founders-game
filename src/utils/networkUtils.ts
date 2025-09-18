// Network utilities for handling retries, debouncing, and circuit breakers

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

// Circuit breaker for edge functions
const circuitBreakers = new Map<string, CircuitBreakerState>();

// Debounce map to prevent duplicate calls
const activeRequests = new Map<string, Promise<any>>();

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export function withCircuitBreaker<T>(
  key: string,
  operation: () => Promise<T>,
  options: { failureThreshold?: number; timeout?: number } = {}
): Promise<T> {
  const { failureThreshold = 5, timeout = 60000 } = options;
  
  const breaker = circuitBreakers.get(key) || {
    failures: 0,
    lastFailure: 0,
    state: 'closed'
  };
  
  const now = Date.now();
  
  // Check if circuit should be reset
  if (breaker.state === 'open' && now - breaker.lastFailure > timeout) {
    breaker.state = 'half-open';
    breaker.failures = 0;
  }
  
  // If circuit is open, reject immediately
  if (breaker.state === 'open') {
    return Promise.reject(new Error(`Circuit breaker is open for ${key}`));
  }
  
  return operation()
    .then(result => {
      // Success - reset circuit breaker
      breaker.failures = 0;
      breaker.state = 'closed';
      circuitBreakers.set(key, breaker);
      return result;
    })
    .catch(error => {
      // Failure - update circuit breaker
      breaker.failures++;
      breaker.lastFailure = now;
      
      if (breaker.failures >= failureThreshold) {
        breaker.state = 'open';
      }
      
      circuitBreakers.set(key, breaker);
      throw error;
    });
}

export function withDeduplication<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  // If there's already an active request for this key, return it
  const activeRequest = activeRequests.get(key);
  if (activeRequest) {
    return activeRequest;
  }
  
  // Create new request and store it
  const request = operation()
    .finally(() => {
      // Remove from active requests when done
      activeRequests.delete(key);
    });
  
  activeRequests.set(key, request);
  return request;
}

function isNonRetryableError(error: any): boolean {
  // Don't retry on authentication errors or client errors
  if (error?.status >= 400 && error?.status < 500) {
    return true;
  }
  
  // Don't retry on specific error messages
  const nonRetryableMessages = [
    'Circuit breaker is open',
    'Invalid date',
    'Unauthorized'
  ];
  
  return nonRetryableMessages.some(msg => 
    error?.message?.includes(msg)
  );
}

export function createDebouncer(delay: number = 300) {
  let timeoutId: NodeJS.Timeout;
  
  return function<T extends (...args: any[]) => any>(
    func: T,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}