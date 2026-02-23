// lib/lifecycle.ts - Lifecycle analysis for trend series

import { TrendSeries, LifecycleLabel, TimeSeriesPoint } from './types';

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
 * Find significant decline periods in a series
 */
function findDeclinePeriods(series: TrendSeries): Array<{ startDate: string; endDate: string; declinePercent: number }> {
  if (series.points.length < 2) return [];
  
  const declinePeriods: Array<{ startDate: string; endDate: string; declinePercent: number }> = [];
  let declineStart: TimeSeriesPoint | null = null;
  let declineStartIndex = -1;
  
  for (let i = 1; i < series.points.length; i++) {
    const prev = series.points[i - 1];
    const curr = series.points[i];
    const decline = ((prev.value - curr.value) / prev.value) * 100;
    
    // Start tracking decline if it's significant (>10%)
    if (decline > 10 && declineStart === null) {
      declineStart = prev;
      declineStartIndex = i - 1;
    }
    
    // End decline period if:
    // 1. Decline stops (value increases or decline < 5%)
    // 2. Or we've tracked a significant decline (>15%)
    if (declineStart !== null) {
      const totalDecline = ((declineStart.value - curr.value) / declineStart.value) * 100;
      
      if (decline < 5 || curr.value > prev.value || totalDecline > 15) {
        if (totalDecline > 15) {
          const startDate = new Date(declineStart.timestamp * 1000).toLocaleDateString('he-IL');
          const endDate = new Date(curr.timestamp * 1000).toLocaleDateString('he-IL');
          declinePeriods.push({
            startDate,
            endDate,
            declinePercent: Math.round(totalDecline)
          });
        }
        declineStart = null;
        declineStartIndex = -1;
      }
    }
  }
  
  // Check if there's an ongoing decline at the end
  if (declineStart !== null && series.points.length > 0) {
    const lastPoint = series.points[series.points.length - 1];
    const totalDecline = ((declineStart.value - lastPoint.value) / declineStart.value) * 100;
    if (totalDecline > 15) {
      const startDate = new Date(declineStart.timestamp * 1000).toLocaleDateString('he-IL');
      const endDate = new Date(lastPoint.timestamp * 1000).toLocaleDateString('he-IL');
      declinePeriods.push({
        startDate,
        endDate,
        declinePercent: Math.round(totalDecline)
      });
    }
  }
  
  return declinePeriods;
}

/**
 * Find recovery periods (when decline stops and starts rising)
 */
function findRecoveryPeriods(series: TrendSeries): Array<{ startDate: string; recoveryPercent: number }> {
  if (series.points.length < 3) return [];
  
  const recoveryPeriods: Array<{ startDate: string; recoveryPercent: number }> = [];
  
  for (let i = 2; i < series.points.length; i++) {
    const prev2 = series.points[i - 2];
    const prev1 = series.points[i - 1];
    const curr = series.points[i];
    
    // Check if there was a decline followed by recovery
    const decline = ((prev2.value - prev1.value) / prev2.value) * 100;
    const recovery = ((curr.value - prev1.value) / prev1.value) * 100;
    
    // Recovery: decline > 10% followed by increase > 5%
    if (decline > 10 && recovery > 5) {
      const startDate = new Date(curr.timestamp * 1000).toLocaleDateString('he-IL');
      recoveryPeriods.push({
        startDate,
        recoveryPercent: Math.round(recovery)
      });
    }
  }
  
  return recoveryPeriods;
}

/**
 * Analyze all series and return product launch recommendations
 */
export function analyzeAllSeries(series: TrendSeries[]): {
  strongestRising?: TrendSeries;
  strongestDeclining?: TrendSeries;
  overallTrend: string;
  declinePeriods: Array<{ platform: string; startDate: string; endDate: string; declinePercent: number }>;
  recoveryPeriods: Array<{ platform: string; startDate: string; recoveryPercent: number }>;
  recommendations: string[];
} {
  if (series.length === 0) {
    return { 
      overallTrend: 'אין נתונים זמינים',
      declinePeriods: [],
      recoveryPeriods: [],
      recommendations: []
    };
  }

  // Find all decline and recovery periods across all platforms
  const allDeclinePeriods: Array<{ platform: string; startDate: string; endDate: string; declinePercent: number }> = [];
  const allRecoveryPeriods: Array<{ platform: string; startDate: string; recoveryPercent: number }> = [];
  
  series.forEach((s) => {
    if (s.points.length === 0) return;
    
    const declines = findDeclinePeriods(s);
    declines.forEach(decline => {
      allDeclinePeriods.push({
        platform: s.label,
        ...decline
      });
    });
    
    const recoveries = findRecoveryPeriods(s);
    recoveries.forEach(recovery => {
      allRecoveryPeriods.push({
        platform: s.label,
        ...recovery
      });
    });
  });

  // Sort by decline percentage (most severe first)
  allDeclinePeriods.sort((a, b) => b.declinePercent - a.declinePercent);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  // Check for significant ongoing declines
  const recentDeclines = allDeclinePeriods.filter(d => {
    // Check if decline is recent (within last 30% of timeline)
    const seriesWithDecline = series.find(s => s.label === d.platform);
    if (!seriesWithDecline || seriesWithDecline.points.length === 0) return false;
    const lastPoint = seriesWithDecline.points[seriesWithDecline.points.length - 1];
    const declineEndDate = new Date(d.endDate);
    const lastDate = new Date(lastPoint.timestamp * 1000);
    const daysDiff = (lastDate.getTime() - declineEndDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 30; // Recent decline (within 30 days)
  });
  
  if (recentDeclines.length > 0) {
    const mostSevere = recentDeclines[0];
    recommendations.push(
      `⚠️ ירידה משמעותית זוהתה: בין ${mostSevere.startDate} ל-${mostSevere.endDate} נרשמה ירידה של ${mostSevere.declinePercent}% ב-${mostSevere.platform}. זה הזמן לשקול להביא מוצר חדש לשוק כדי לעצור את הירידה.`
    );
  }
  
  // Check for recovery periods (good time to launch new product)
  if (allRecoveryPeriods.length > 0) {
    const latestRecovery = allRecoveryPeriods[allRecoveryPeriods.length - 1];
    recommendations.push(
      `📈 התאוששות זוהתה: החל מ-${latestRecovery.startDate} נרשמה עלייה של ${latestRecovery.recoveryPercent}% ב-${latestRecovery.platform}. זה יכול להיות זמן טוב להביא מוצר חדש כדי לחזק את המגמה החיובית.`
    );
  }
  
  // Overall trend analysis
  let overallTrend = '';
  if (recentDeclines.length > 0) {
    overallTrend = `ירידה משמעותית זוהתה - מומלץ לשקול מוצר חדש`;
  } else if (allRecoveryPeriods.length > 0) {
    overallTrend = `מגמה חיובית - זמן טוב לחדשנות`;
  } else {
    overallTrend = `מגמות יציבות - המשך מעקב`;
  }

  return {
    strongestRising: undefined,
    strongestDeclining: undefined,
    overallTrend,
    declinePeriods: allDeclinePeriods.slice(0, 3), // Top 3 declines
    recoveryPeriods: allRecoveryPeriods.slice(-3), // Last 3 recoveries
    recommendations
  };
}

