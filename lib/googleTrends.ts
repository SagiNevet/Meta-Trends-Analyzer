// lib/googleTrends.ts - Google Trends adapter via SearchAPI.io

import { TrendSeries, TimeSeriesPoint, GoogleTrendsProperty } from './types';

const SEARCHAPI_BASE_URL = 'https://www.searchapi.io/api/v1/search';

type GoogleTrendsResponse = {
  interest_over_time?: {
    timeline_data?: Array<{
      timestamp: string;
      date: string;
      values: Array<{
        query: string;
        value: string;
        extracted_value: number;
      }>;
    }>;
  };
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
  error?: string;
};

const GPROP_LABELS: Record<GoogleTrendsProperty, string> = {
  '': 'Web Search',
  'youtube': 'YouTube',
  'images': 'Images',
  'news': 'News',
  'shopping': 'Shopping',
  'froogle': 'Froogle'
};

const GPROP_SOURCES: Record<GoogleTrendsProperty, string> = {
  '': 'google_web',
  'youtube': 'google_youtube',
  'images': 'google_images',
  'news': 'google_news',
  'shopping': 'google_shopping',
  'froogle': 'google_froogle'
};

export async function fetchGoogleTrends(
  keywords: string[],
  timeParam: string,
  region?: string,
  gprop: GoogleTrendsProperty = '',
  category?: string
): Promise<TrendSeries | null> {
  const apiKey = process.env.SEARCHAPI_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Trends disabled: missing SEARCHAPI_API_KEY');
    return null;
  }

  if (keywords.length === 0) {
    return null;
  }

  // Join multiple queries with comma
  const queryString = keywords.join(',');

  const params = new URLSearchParams({
    api_key: apiKey,
    engine: 'google_trends',
    q: queryString,
    data_type: 'TIMESERIES',
    time: timeParam,
    ...(gprop && { gprop }),
    ...(region && { geo: region.toUpperCase() }),
    ...(category && { cat: category })
  });

  try {
    const response = await fetch(`${SEARCHAPI_BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Trends API error: ${response.status}`);
    }

    const data: GoogleTrendsResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.interest_over_time?.timeline_data) {
      return null;
    }

    // Process timeline data - handle multiple queries
    // Store individual query data for multi-line charts
    const queryDataMap: Record<string, TimeSeriesPoint[]> = {};
    keywords.forEach((keyword) => {
      queryDataMap[keyword] = [];
    });

    // Process timeline data and extract per-query values
    data.interest_over_time.timeline_data.forEach((item) => {
      const timestamp = parseInt(item.timestamp, 10);
      if (isNaN(timestamp)) return;

      const values = item.values || [];
      values.forEach((v) => {
        // Try to match query by exact match or partial match
        const matchedKeyword = keywords.find(k => 
          v.query?.toLowerCase().includes(k.toLowerCase()) || 
          k.toLowerCase().includes(v.query?.toLowerCase() || '')
        );
        
        if (matchedKeyword && queryDataMap[matchedKeyword]) {
          queryDataMap[matchedKeyword].push({
            timestamp,
            value: v.extracted_value || 0
          });
        }
      });
    });

    // For single query or average: create combined points
    const points: TimeSeriesPoint[] = data.interest_over_time.timeline_data
      .map((item) => {
        const timestamp = parseInt(item.timestamp, 10);
        const values = item.values || [];
        const totalValue = values.reduce((sum, v) => sum + (v.extracted_value || 0), 0);
        const avgValue = values.length > 0 ? totalValue / values.length : 0;
        return { timestamp, value: avgValue };
      })
      .filter((point) => !isNaN(point.timestamp));

    const source = GPROP_SOURCES[gprop] as any;
    const label = `Google ${GPROP_LABELS[gprop]}`;

    return {
      source,
      label,
      query: queryString,
      region: region || 'WORLDWIDE',
      rawMetricName: 'interest_index',
      points,
      extra: {
        description: `Search interest on Google ${GPROP_LABELS[gprop]} over time (0-100 scale)`,
        related_queries: data.related_queries,
        related_topics: data.related_topics,
        geo_map: data.geo_map,
        queries: keywords,
        queryDataMap: queryDataMap, // Individual query data for multi-line charts
        category: category || 'All categories'
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Some gprop values might not be supported - log but don't fail completely
    if (errorMessage.includes('400') && (gprop === 'shopping' || gprop === 'froogle')) {
      console.warn(`Google Trends ${gprop} may not be supported by SearchAPI. Skipping.`);
    } else {
      console.error(`Error fetching Google Trends (${gprop || 'web'}):`, error);
    }
    return null;
  }
}

// Convenience functions for each property type
export async function fetchGoogleWebTrends(
  keywords: string[],
  timeParam: string,
  region?: string,
  category?: string
): Promise<TrendSeries | null> {
  return fetchGoogleTrends(keywords, timeParam, region, '', category);
}

export async function fetchGoogleYouTubeTrends(
  keywords: string[],
  timeParam: string,
  region?: string,
  category?: string
): Promise<TrendSeries | null> {
  return fetchGoogleTrends(keywords, timeParam, region, 'youtube', category);
}

export async function fetchGoogleImagesTrends(
  keywords: string[],
  timeParam: string,
  region?: string,
  category?: string
): Promise<TrendSeries | null> {
  return fetchGoogleTrends(keywords, timeParam, region, 'images', category);
}

export async function fetchGoogleNewsTrends(
  keywords: string[],
  timeParam: string,
  region?: string,
  category?: string
): Promise<TrendSeries | null> {
  return fetchGoogleTrends(keywords, timeParam, region, 'news', category);
}

export async function fetchGoogleShoppingTrends(
  keywords: string[],
  timeParam: string,
  region?: string,
  category?: string
): Promise<TrendSeries | null> {
  return fetchGoogleTrends(keywords, timeParam, region, 'shopping', category);
}

export async function fetchGoogleFroogleTrends(
  keywords: string[],
  timeParam: string,
  region?: string,
  category?: string
): Promise<TrendSeries | null> {
  return fetchGoogleTrends(keywords, timeParam, region, 'froogle', category);
}

