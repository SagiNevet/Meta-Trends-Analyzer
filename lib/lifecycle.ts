// lib/lifecycle.ts - Lifecycle analysis for trend series

import { TrendSeries, LifecycleLabel } from './types';

/**
 * Calculate simple statistics for a time series
 */
function getStats(series: TrendSeries): {
  median: number;
  mean: number;
  max: number;
  min: number;
  lastValue: number;
  recentSlope: number;
} {
  if (series.points.length === 0) {
    return { median: 0, mean: 0, max: 0, min: 0, lastValue: 0, recentSlope: 0 };
  }

  const values = series.points.map(p => p.value);
  const sortedValues = [...values].sort((a, b) => a - b);
  
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const lastValue = values[values.length - 1];
  
  // Calculate slope over last 20% of points (or at least 2 points)
  const recentCount = Math.max(2, Math.floor(series.points.length * 0.2));
  const recentPoints = series.points.slice(-recentCount);
  
  let slope = 0;
  if (recentPoints.length >= 2) {
    const firstRecent = recentPoints[0];
    const lastRecent = recentPoints[recentPoints.length - 1];
    const timeDiff = lastRecent.timestamp - firstRecent.timestamp;
    const valueDiff = lastRecent.value - firstRecent.value;
    slope = timeDiff > 0 ? valueDiff / timeDiff : 0;
  }
  
  return { median, mean, max, min, lastValue, recentSlope: slope };
}

/**
 * Determine lifecycle label based on trend patterns
 */
export function getLifecycleLabel(series: TrendSeries): LifecycleLabel {
  if (series.points.length === 0) {
    return 'Stable';
  }

  const stats = getStats(series);
  const { median, max, lastValue, recentSlope } = stats;
  
  // Find when max occurred (as fraction of total timeline)
  const maxIndex = series.points.findIndex(p => p.value === max);
  const maxPosition = maxIndex / series.points.length;
  
  // Rising: last value significantly above median AND positive slope
  if (lastValue > median * 1.2 && recentSlope > 0) {
    return 'Rising';
  }
  
  // Declining: last value significantly below median AND negative slope
  if (lastValue < median * 0.8 && recentSlope < 0) {
    return 'Declining';
  }
  
  // Peaking: at or near max, occurring in recent portion (last 30%)
  if (lastValue >= max * 0.9 && maxPosition > 0.7) {
    return 'Peak';
  }
  
  // If max occurred recently but value has dropped
  if (maxPosition > 0.7 && lastValue < max * 0.85) {
    return 'Declining';
  }
  
  return 'Stable';
}

/**
 * Get a short description of the lifecycle
 */
export function getLifecycleDescription(label: LifecycleLabel): string {
  switch (label) {
    case 'Rising':
      return 'Interest is growing steadily';
    case 'Peak':
      return 'Interest is at its highest point';
    case 'Declining':
      return 'Interest is decreasing';
    case 'Stable':
      return 'Interest is relatively steady';
    default:
      return 'Trend pattern unclear';
  }
}

/**
 * Get color for lifecycle badge
 */
export function getLifecycleColor(label: LifecycleLabel): string {
  switch (label) {
    case 'Rising':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'Peak':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'Declining':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'Stable':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
}

/**
 * Analyze all series and return insights
 */
export function analyzeAllSeries(series: TrendSeries[]): {
  strongestRising?: TrendSeries;
  strongestDeclining?: TrendSeries;
  overallTrend: string;
} {
  if (series.length === 0) {
    return { overallTrend: 'No data available' };
  }

  let maxRisingSlope = -Infinity;
  let maxDecliningSlope = Infinity;
  let strongestRising: TrendSeries | undefined;
  let strongestDeclining: TrendSeries | undefined;

  series.forEach((s) => {
    if (s.points.length === 0) return;
    
    const stats = getStats(s);
    
    if (stats.recentSlope > maxRisingSlope) {
      maxRisingSlope = stats.recentSlope;
      strongestRising = s;
    }
    
    if (stats.recentSlope < maxDecliningSlope) {
      maxDecliningSlope = stats.recentSlope;
      strongestDeclining = s;
    }
  });

  let overallTrend = 'Mixed signals across platforms';
  
  if (maxRisingSlope > 0 && Math.abs(maxRisingSlope) > Math.abs(maxDecliningSlope)) {
    overallTrend = `Strongest growth on ${strongestRising?.label || 'unknown platform'}`;
  } else if (maxDecliningSlope < 0 && Math.abs(maxDecliningSlope) > Math.abs(maxRisingSlope)) {
    overallTrend = `Strongest decline on ${strongestDeclining?.label || 'unknown platform'}`;
  }

  return {
    strongestRising,
    strongestDeclining,
    overallTrend
  };
}

