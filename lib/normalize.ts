// lib/normalize.ts - Normalization utilities for time series data

import { TimeSeriesPoint } from './types';

/**
 * Normalize time series to 0-100 scale
 */
export function normalizeTo0_100(series: TimeSeriesPoint[]): TimeSeriesPoint[] {
  if (series.length === 0) {
    return [];
  }

  const values = series.map(p => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);

  // If all values are the same, return as-is
  if (max === min) {
    return series.map(p => ({ ...p, value: 50 }));
  }

  // Scale to 0-100
  return series.map(point => ({
    timestamp: point.timestamp,
    value: ((point.value - min) / (max - min)) * 100
  }));
}

/**
 * Get normalized copy of a time series while preserving original
 */
export function getNormalizedCopy(series: TimeSeriesPoint[]): {
  original: TimeSeriesPoint[];
  normalized: TimeSeriesPoint[];
} {
  return {
    original: [...series],
    normalized: normalizeTo0_100(series)
  };
}

/**
 * Fill gaps in time series with zero values
 */
export function fillTimeGaps(
  series: TimeSeriesPoint[],
  intervalSeconds: number = 86400 // default 1 day
): TimeSeriesPoint[] {
  if (series.length === 0) {
    return [];
  }

  const sorted = [...series].sort((a, b) => a.timestamp - b.timestamp);
  const filled: TimeSeriesPoint[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    filled.push(sorted[i]);
    
    if (i < sorted.length - 1) {
      const current = sorted[i].timestamp;
      const next = sorted[i + 1].timestamp;
      const gap = next - current;
      
      // Fill gaps with zeros
      if (gap > intervalSeconds * 1.5) {
        const steps = Math.floor(gap / intervalSeconds);
        for (let j = 1; j < steps; j++) {
          filled.push({
            timestamp: current + (j * intervalSeconds),
            value: 0
          });
        }
      }
    }
  }
  
  return filled;
}

/**
 * Smooth time series using simple moving average
 */
export function smoothTimeSeries(
  series: TimeSeriesPoint[],
  windowSize: number = 3
): TimeSeriesPoint[] {
  if (series.length < windowSize) {
    return series;
  }

  const smoothed: TimeSeriesPoint[] = [];
  
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(series.length, i + Math.ceil(windowSize / 2));
    const window = series.slice(start, end);
    const avgValue = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    
    smoothed.push({
      timestamp: series[i].timestamp,
      value: avgValue
    });
  }
  
  return smoothed;
}

