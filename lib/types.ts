// lib/types.ts - Type definitions for the application

// Alpha Vantage Types
export type AlphaVantageRange = '1year' | '3year' | '5year' | '10year' | 'full' | 'custom';
export type AlphaVantageInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type AlphaVantageOHLC = 'open' | 'high' | 'low' | 'close';
export type AlphaVantageCalculation = 
  | 'CUMULATIVE_RETURN'
  | 'MEAN'
  | 'MEDIAN'
  | 'VARIANCE'
  | 'STDDEV'
  | 'MAX_DRAWDOWN'
  | 'COVARIANCE'
  | 'CORRELATION';

export interface AlphaFixedWindowRequest {
  symbols: string[];
  range: AlphaVantageRange;
  rangeStart?: string;
  rangeEnd?: string;
  interval: AlphaVantageInterval;
  ohlc?: AlphaVantageOHLC;
  calculations: AlphaVantageCalculation[];
}

export interface AlphaSlidingWindowRequest {
  symbols: string[];
  range: AlphaVantageRange;
  rangeStart?: string;
  rangeEnd?: string;
  interval: AlphaVantageInterval;
  ohlc?: AlphaVantageOHLC;
  windowSize: number;
  calculations: AlphaVantageCalculation[];
}

export interface AlphaFixedWindowResponse {
  symbols: string[];
  range: {
    start: string;
    end: string;
  };
  interval: AlphaVantageInterval;
  ohlc: AlphaVantageOHLC;
  metrics: Record<string, Record<string, number>>;
  correlation: Record<string, number>;
  covariance: Record<string, number>;
}

export interface AlphaSlidingWindowResponse {
  symbols: string[];
  range: {
    start: string;
    end: string;
  };
  interval: AlphaVantageInterval;
  ohlc: AlphaVantageOHLC;
  windowSize: number;
  windows: Array<{
    start: string;
    end: string;
    midpoint: string;
    metrics: Record<string, Record<string, number>>;
    correlation: Record<string, number>;
    covariance: Record<string, number>;
  }>;
}

// Google Trends Types
export type TimeRange = '1h' | '4h' | '1d' | '7d' | '30d' | '90d' | '12m' | '1y' | '5y' | 'all' | 'custom';
export type GoogleTrendsProperty = '' | 'youtube' | 'images' | 'news' | 'shopping' | 'froogle';

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface TrendSeries {
  query: string;
  label: string;
  source: string;
  region?: string;
  rawMetricName?: string;
  points: TimeSeriesPoint[];
  extra?: {
    description?: string;
    rawMetricName?: string;
    queryDataMap?: Record<string, TimeSeriesPoint[]>;
    queries?: string[];
    related_queries?: {
      rising?: Array<{ query: string; value: string }>;
      top?: Array<{ query: string; value: string }>;
    };
    related_topics?: {
      rising?: Array<{ topic: { title: string }; value: string }>;
      top?: Array<{ topic: { title: string }; value: string }>;
    };
    geo_map?: Array<{
      geo: string;
      geoName: string;
      value: number;
    }>;
    category?: string;
  };
}

// API Request/Response Types
export interface AnalyzeRequest {
  queries: string[];
  region?: string;
  timeRange?: TimeRange;
  customStart?: string;
  customEnd?: string;
  category?: string;
  enableGoogleTrends?: boolean;
  enableAlphaVantage?: boolean;
  enableGoogleWeb?: boolean;
  enableGoogleYoutube?: boolean;
  enableGoogleImages?: boolean;
  enableGoogleNews?: boolean;
  enableGoogleShopping?: boolean;
  enableGoogleFroogle?: boolean;
  alphaFixedWindow?: AlphaFixedWindowRequest;
  alphaSlidingWindow?: AlphaSlidingWindowRequest;
}

export interface AnalyzeResponse {
  series: TrendSeries[];
  warnings?: string[];
  alphaFixedWindow?: AlphaFixedWindowResponse | null;
  alphaSlidingWindow?: AlphaSlidingWindowResponse | null;
  alphaWarnings?: string[];
}


