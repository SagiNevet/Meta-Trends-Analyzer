// lib/mockData.ts - Mock data generator for demo purposes when API keys are unavailable

import { TrendSeries, TimeSeriesPoint } from './types';

/**
 * Generate mock time series data
 */
function generateMockTimeSeries(
  startTimestamp: number,
  endTimestamp: number,
  pattern: 'rising' | 'declining' | 'stable' | 'peak'
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const dayInSeconds = 86400;
  const totalDays = Math.floor((endTimestamp - startTimestamp) / dayInSeconds);
  
  for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 30))) {
    const timestamp = startTimestamp + (i * dayInSeconds);
    const progress = i / totalDays; // 0 to 1
    
    let value = 50;
    const noise = (Math.random() - 0.5) * 15;
    
    switch (pattern) {
      case 'rising':
        value = 20 + (progress * 70) + noise;
        break;
      case 'declining':
        value = 90 - (progress * 60) + noise;
        break;
      case 'peak':
        // Bell curve - peak in middle
        const peakProgress = Math.sin(progress * Math.PI);
        value = 30 + (peakProgress * 65) + noise;
        break;
      case 'stable':
        value = 50 + noise;
        break;
    }
    
    points.push({
      timestamp,
      value: Math.max(0, Math.min(100, value))
    });
  }
  
  return points;
}

/**
 * Generate mock Google Web Trends
 */
export function generateMockGoogleWebTrends(
  keyword: string,
  startTimestamp: number,
  endTimestamp: number,
  region?: string
): TrendSeries {
  return {
    source: 'google_web',
    label: 'Google Web Search',
    query: keyword,
    region,
    rawMetricName: 'interest_index',
    points: generateMockTimeSeries(startTimestamp, endTimestamp, 'rising'),
    extra: {
      description: 'Web search interest on Google over time (0-100 scale)',
      mock: true
    }
  };
}

/**
 * Generate mock YouTube Trends
 */
export function generateMockYouTubeTrends(
  keyword: string,
  startTimestamp: number,
  endTimestamp: number,
  region?: string
): TrendSeries {
  return {
    source: 'google_youtube',
    label: 'YouTube Search',
    query: keyword,
    region,
    rawMetricName: 'interest_index',
    points: generateMockTimeSeries(startTimestamp, endTimestamp, 'peak'),
    extra: {
      description: 'Search interest on YouTube over time (0-100 scale)',
      mock: true
    }
  };
}

/**
 * Generate mock TikTok data
 */
export function generateMockTikTokTrends(
  keyword: string,
  startTimestamp: number,
  endTimestamp: number,
  region?: string
): TrendSeries {
  const points = generateMockTimeSeries(startTimestamp, endTimestamp, 'rising');
  
  // Convert to raw view counts
  const scaledPoints = points.map(p => ({
    timestamp: p.timestamp,
    value: Math.floor(p.value * 1000) // Scale to thousands of views
  }));
  
  return {
    source: 'tiktok',
    label: 'TikTok Mentions',
    query: keyword,
    region,
    rawMetricName: 'views_sum',
    points: scaledPoints,
    extra: {
      description: 'Daily aggregated views from videos matching your keyword',
      totalVideos: Math.floor(Math.random() * 50) + 10,
      mock: true
    }
  };
}

/**
 * Generate mock Pinterest data
 */
export function generateMockPinterestTrends(
  keyword: string,
  startTimestamp: number,
  endTimestamp: number,
  region?: string
): TrendSeries {
  return {
    source: 'pinterest',
    label: 'Pinterest Trends',
    query: keyword,
    region,
    rawMetricName: 'search_interest_index',
    points: generateMockTimeSeries(startTimestamp, endTimestamp, 'stable'),
    extra: {
      description: 'Pinterest search interest trend (0-100 scale)',
      mock: true
    }
  };
}

/**
 * Generate mock Reddit data
 */
export function generateMockRedditMentions(
  keyword: string,
  startTimestamp: number,
  endTimestamp: number
): TrendSeries {
  const points = generateMockTimeSeries(startTimestamp, endTimestamp, 'declining');
  
  // Convert to raw mention counts
  const scaledPoints = points.map(p => ({
    timestamp: p.timestamp,
    value: Math.floor(p.value * 5) // Scale to mention counts
  }));
  
  return {
    source: 'reddit',
    label: 'Reddit Mentions',
    query: keyword,
    rawMetricName: 'mentions_count',
    points: scaledPoints,
    extra: {
      description: 'Daily count of Reddit comments mentioning your keyword',
      mock: true
    }
  };
}

/**
 * Check if mock data should be used based on environment
 */
export function shouldUseMockData(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true';
}

