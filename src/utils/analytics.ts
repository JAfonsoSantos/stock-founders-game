// Simple analytics utility for tracking user interactions
// Can be extended with real analytics services like Google Analytics, Mixpanel, etc.

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private enabled: boolean = true;
  private events: AnalyticsEvent[] = [];

  // Track an event
  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now()
    };

    this.events.push(analyticsEvent);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics:', analyticsEvent);
    }

    // Here you would send to your analytics service
    // Example: Google Analytics, Mixpanel, etc.
  }

  // Track page views
  page(pageName: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page: pageName,
      ...properties
    });
  }

  // Track user actions
  action(action: string, target: string, properties?: Record<string, any>) {
    this.track('user_action', {
      action,
      target,
      ...properties
    });
  }

  // Track game events
  gameEvent(gameId: string, event: string, properties?: Record<string, any>) {
    this.track('game_event', {
      gameId,
      event,
      ...properties
    });
  }

  // Track business metrics
  business(metric: string, value: number, properties?: Record<string, any>) {
    this.track('business_metric', {
      metric,
      value,
      ...properties
    });
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Get recent events (for debugging)
  getRecentEvents(limit: number = 10): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  // Clear events
  clear() {
    this.events = [];
  }
}

export const analytics = new Analytics();

// Common tracking helpers
export const trackGameCreate = (gameId: string, gameName: string) => {
  analytics.gameEvent(gameId, 'game_created', { gameName });
};

export const trackInvestment = (gameId: string, startupId: string, amount: number) => {
  analytics.gameEvent(gameId, 'investment_made', { startupId, amount });
};

export const trackTrade = (gameId: string, startupId: string, type: 'primary' | 'secondary', amount: number) => {
  analytics.gameEvent(gameId, 'trade_executed', { startupId, type, amount });
};

export const trackGameStatusChange = (gameId: string, newStatus: string) => {
  analytics.gameEvent(gameId, 'status_change', { newStatus });
};