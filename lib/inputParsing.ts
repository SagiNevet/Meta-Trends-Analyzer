// lib/inputParsing.ts - Parse user input into normalized parameters

import { AnalyzeRequest, TimeRange } from './types';

export type TimeConfig = {
  googleTime: string;
};

export type ParsedQuery = {
  cleanedQueries: string[];
  timeConfig: TimeConfig;
  region?: string;
  category?: string;
};

/**
 * Clean and normalize the user's raw query text
 */
export function cleanQueryText(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    // Remove emojis and special characters
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map time range to Google Trends format
 */
function getGoogleTimeParam(range: TimeRange, customStart?: string, customEnd?: string): string {
  switch (range) {
    case '7d':
      return 'now 7-d';
    case '30d':
      return 'today 1-m';
    case '12m':
      return 'today 12-m';
    case '5y':
      return 'today 5-y';
    case 'all':
      return 'all';
    case 'custom':
      if (customStart && customEnd) {
        return `${customStart} ${customEnd}`;
      }
      return 'today 12-m'; // fallback
    default:
      return 'today 12-m';
  }
}

/**
 * Main parser function
 */
export function parseUserQuery(request: AnalyzeRequest): ParsedQuery {
  // Clean all queries (filter out empty ones)
  const cleanedQueries = request.queries
    .map(q => cleanQueryText(q))
    .filter(q => q.length > 0)
    .slice(0, 5); // Limit to 5 queries
  
  const timeConfig: TimeConfig = {
    googleTime: getGoogleTimeParam(request.timeRange || '30d', request.customStart, request.customEnd)
  };
  
  // Handle WORLDWIDE region
  let region = request.region;
  if (region === 'WORLDWIDE' || region === '') {
    region = undefined; // Google Trends uses empty/undefined for worldwide
  }
  
  return {
    cleanedQueries,
    timeConfig,
    region,
    category: request.category
  };
}

