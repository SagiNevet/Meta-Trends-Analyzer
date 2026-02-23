// lib/alphaVantage.ts - Alpha Vantage API integration

import {
  AlphaFixedWindowRequest,
  AlphaSlidingWindowRequest,
  AlphaFixedWindowResponse,
  AlphaSlidingWindowResponse,
  AlphaVantageInterval,
  AlphaVantageOHLC
} from './types';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Resolve product name to stock symbol
 * This is a simple mapping - can be extended with a more sophisticated lookup
 */
export function resolveSymbol(productName: string): string | null {
  const mapping: Record<string, string> = {
    'iphone': 'AAPL',
    'iphone 13': 'AAPL',
    'iphone 13 pro': 'AAPL',
    'iphone 14': 'AAPL',
    'iphone 15': 'AAPL',
    'iphone 16': 'AAPL',
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'windows': 'MSFT',
    'xbox': 'MSFT',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'nvidia': 'NVDA',
    'tesla': 'TSLA',
    'amazon': 'AMZN',
    'meta': 'META',
    'facebook': 'META',
    'netflix': 'NFLX',
    'amd': 'AMD',
    'intel': 'INTC',
    'ibm': 'IBM',
    'oracle': 'ORCL',
    'salesforce': 'CRM',
    'adobe': 'ADBE',
    'paypal': 'PYPL',
    'visa': 'V',
    'mastercard': 'MA',
    'jpmorgan': 'JPM',
    'bank of america': 'BAC',
    'walmart': 'WMT',
    'target': 'TGT',
    'coca cola': 'KO',
    'pepsi': 'PEP',
    'disney': 'DIS',
    'starbucks': 'SBUX',
    'mcdonalds': 'MCD',
    'nike': 'NKE',
    'boeing': 'BA',
    'general electric': 'GE',
    'ford': 'F',
    'general motors': 'GM',
    'exxon': 'XOM',
    'chevron': 'CVX',
    'pfizer': 'PFE',
    'johnson & johnson': 'JNJ',
    'merck': 'MRK',
    'unitedhealth': 'UNH',
    'home depot': 'HD',
    'lowes': 'LOW',
    'costco': 'COST',
    'verizon': 'VZ',
    'at&t': 'T',
    't-mobile': 'TMUS',
    'comcast': 'CMCSA',
    'spotify': 'SPOT',
    'uber': 'UBER',
    'lyft': 'LYFT',
    'airbnb': 'ABNB',
    'zoom': 'ZM',
    'twitter': 'TWTR',
    'x': 'TWTR',
    'snapchat': 'SNAP',
    'pinterest': 'PINS',
    'shopify': 'SHOP',
    'coinbase': 'COIN',
    'robinhood': 'HOOD'
  };

  const normalized = productName.toLowerCase().trim();
  
  // Direct match
  if (mapping[normalized]) {
    return mapping[normalized];
  }
  
  // Partial match - find first key that contains the product name or vice versa
  for (const [key, symbol] of Object.entries(mapping)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return symbol;
    }
  }

  // If product name looks like a symbol already (uppercase, 1-5 chars), return it
  if (/^[A-Z]{1,5}$/.test(productName.trim().toUpperCase())) {
    return productName.trim().toUpperCase();
  }

  return null;
}

/**
 * Convert range selection to date range
 */
function getDateRange(range: AlphaFixedWindowRequest['range'], rangeStart?: string, rangeEnd?: string): { start: Date; end: Date } {
  let end = new Date();
  let start = new Date();

  if (range === 'custom' && rangeStart && rangeEnd) {
    start = new Date(rangeStart);
    end = new Date(rangeEnd);
  } else {
    switch (range) {
      case '1year':
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '3year':
        start = new Date(end.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
        break;
      case '5year':
        start = new Date(end.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      case '10year':
        start = new Date(end.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
        break;
      case 'full':
        start = new Date('2000-01-01'); // Alpha Vantage typically has data from early 2000s
        break;
      case 'alltime':
        start = new Date('1990-01-01'); // Maximum historical data
        break;
      default:
        start = new Date(end.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
    }
  }

  return { start, end };
}

/**
 * Get Alpha Vantage function name based on interval
 */
function getTimeSeriesFunction(interval: AlphaVantageInterval): string {
  switch (interval) {
    case 'DAILY':
      return 'TIME_SERIES_DAILY';
    case 'WEEKLY':
      return 'TIME_SERIES_WEEKLY';
    case 'MONTHLY':
      return 'TIME_SERIES_MONTHLY';
    default:
      return 'TIME_SERIES_DAILY';
  }
}

/**
 * Get the data key from Alpha Vantage response based on function
 */
function getDataKey(functionName: string): string {
  switch (functionName) {
    case 'TIME_SERIES_DAILY':
      return 'Time Series (Daily)';
    case 'TIME_SERIES_WEEKLY':
      return 'Weekly Time Series';
    case 'TIME_SERIES_MONTHLY':
      return 'Monthly Time Series';
    default:
      return 'Time Series (Daily)';
  }
}

/**
 * Fetch time series data from Alpha Vantage with retry logic and rate limiting
 */
async function fetchTimeSeries(
  symbol: string,
  interval: AlphaVantageInterval,
  apiKey: string,
  ohlc: AlphaVantageOHLC = 'close',
  retryCount: number = 0,
  maxRetries: number = 2,
  useCompact: boolean = false // Use 'compact' instead of 'full' for free tier DAILY endpoint
): Promise<Array<{ date: string; price: number }>> {
  const functionName = getTimeSeriesFunction(interval);
  const dataKey = getDataKey(functionName);

  // For DAILY endpoint, 'full' is premium. Use 'compact' (last 100 data points) for free tier
  // For WEEKLY and MONTHLY, 'full' is available in free tier
  const outputSize = (interval === 'DAILY' && useCompact) ? 'compact' : 'full';

  const params = new URLSearchParams({
    function: functionName,
    symbol,
    apikey: apiKey,
    outputsize: outputSize
  });

  try {
    const response = await fetch(`${ALPHA_VANTAGE_BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for rate limiting
    if (data['Note']) {
      const noteMessage = data['Note'];
      if (noteMessage.includes('rate limit') || noteMessage.includes('Thank you for using Alpha Vantage')) {
        // If we have retries left, wait and retry
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s
          console.log(`Rate limit hit for ${symbol}, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return fetchTimeSeries(symbol, interval, apiKey, ohlc, retryCount + 1, maxRetries);
        }
        throw new Error('Alpha Vantage API rate limit exceeded. Please wait a moment and try again, or consider upgrading to a premium plan.');
      }
      throw new Error(noteMessage);
    }

    if (data['Error Message']) {
      const errorMsg = data['Error Message'];
      // Check if it's an interval availability issue
      if (errorMsg.includes('not be available') && interval === 'WEEKLY' && retryCount === 0) {
        // Wait before trying fallback to avoid rate limiting
        console.log(`WEEKLY interval not available for ${symbol}, waiting 2.5s before trying MONTHLY instead (MONTHLY supports full history in free tier)`);
        await new Promise(resolve => setTimeout(resolve, 2500));
        // Try MONTHLY instead - it supports 'full' in free tier and gives more data points for long ranges
        return fetchTimeSeries(symbol, 'MONTHLY', apiKey, ohlc, 0, maxRetries, false);
      }
      
      // If MONTHLY also fails, try DAILY as last resort (but with compact)
      if (errorMsg.includes('not be available') && interval === 'MONTHLY' && retryCount === 0) {
        console.log(`MONTHLY interval not available for ${symbol}, waiting 2.5s before trying DAILY with compact mode`);
        await new Promise(resolve => setTimeout(resolve, 2500));
        return fetchTimeSeries(symbol, 'DAILY', apiKey, ohlc, 0, maxRetries, true);
      }
      
      // Check if it's a premium feature error (outputsize=full for DAILY)
      if (errorMsg.includes('premium feature') && errorMsg.includes('outputsize=full') && interval === 'DAILY' && !useCompact) {
        console.log(`DAILY endpoint with outputsize=full is premium. Retrying with compact mode (last 100 data points)`);
        // Retry with compact mode
        return fetchTimeSeries(symbol, 'DAILY', apiKey, ohlc, retryCount, maxRetries, true);
      }
      throw new Error(errorMsg);
    }

    // Try to find the time series data - Alpha Vantage sometimes uses different key names
    let timeSeries = data[dataKey];
    
    // If not found, try alternative key names
    if (!timeSeries) {
      // Try common variations
      const alternativeKeys = [
        'Time Series (Daily)',
        'Time Series Daily',
        'Daily Time Series',
        'Weekly Time Series',
        'Weekly Adjusted Time Series',
        'Monthly Time Series',
        'Monthly Adjusted Time Series'
      ];
      
      for (const key of alternativeKeys) {
        if (data[key]) {
          timeSeries = data[key];
          break;
        }
      }
    }
    
    // If still not found, check all keys in response
    if (!timeSeries) {
      const allKeys = Object.keys(data);
      console.log('Available keys in Alpha Vantage response:', allKeys);
      
      // Check for Information key (usually means symbol not found or no data)
      if (data['Information']) {
        const infoMessage = typeof data['Information'] === 'string' 
          ? data['Information'] 
          : 'Symbol not found or no historical data available';
        throw new Error(`${symbol}: ${infoMessage}. This symbol may not be available in Alpha Vantage for ${interval} interval. Please try a different symbol like AAPL, MSFT, GOOGL, or NVDA.`);
      }
      
      // Check if symbol might not be supported
      if (data['Meta Data'] && data['Meta Data']['2. Symbol'] !== symbol) {
        throw new Error(`Symbol ${symbol} not found or not supported by Alpha Vantage. Please try a different symbol.`);
      }
      
      // If only Information key exists, it means no data
      if (allKeys.length === 1 && allKeys[0] === 'Information') {
        throw new Error(`Symbol ${symbol} is not available in Alpha Vantage or has no historical data for ${interval} interval. Please try a different symbol.`);
      }
      
      throw new Error(`No time series data found for ${symbol} with interval ${interval}. Available keys: ${allKeys.join(', ')}. This symbol may not be available in Alpha Vantage or may not have historical data. Please try a different symbol like AAPL, MSFT, or GOOGL.`);
    }

    // Map OHLC to Alpha Vantage field names
    const ohlcMap: Record<AlphaVantageOHLC, string> = {
      'open': '1. open',
      'high': '2. high',
      'low': '3. low',
      'close': '4. close'
    };

    const priceField = ohlcMap[ohlc];

    // Convert to array of { date, price }
    const points: Array<{ date: string; price: number }> = [];
    for (const [date, values] of Object.entries(timeSeries)) {
      const priceData = values as Record<string, string>;
      const price = parseFloat(priceData[priceField]);
      if (!isNaN(price)) {
        points.push({ date, price });
      }
    }

    // Sort by date ascending (numeric to avoid locale/format issues)
    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return points;
  } catch (error) {
    // Re-throw if it's already a formatted error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch time series for ${symbol}: ${error}`);
  }
}

/**
 * Calculate returns from price series
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

/**
 * Calculate cumulative return
 */
function calculateCumulativeReturn(prices: number[]): number {
  if (prices.length < 2) return 0;
  return ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
}

/**
 * Calculate mean
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate median
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate variance (annualized if requested)
 */
function calculateVariance(values: number[], annualized: boolean = false): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return annualized ? variance * 252 : variance; // 252 trading days per year
}

/**
 * Calculate standard deviation (annualized if requested)
 */
function calculateStdDev(values: number[], annualized: boolean = false): number {
  return Math.sqrt(calculateVariance(values, annualized));
}

/**
 * Calculate max drawdown as drop from first point to last point in the period.
 * Not cumulative peak-to-trough: just (first - last) / first * 100 when last < first, else 0.
 */
function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length < 2) return 0;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (last >= first) return 0;
  return ((first - last) / first) * 100;
}

/**
 * Calculate correlation
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate covariance (annualized if requested)
 */
function calculateCovariance(x: number[], y: number[], annualized: boolean = false): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  
  let covariance = 0;
  for (let i = 0; i < x.length; i++) {
    covariance += (x[i] - meanX) * (y[i] - meanY);
  }
  covariance /= x.length;
  
  return annualized ? covariance * 252 : covariance;
}

/**
 * Fetch ANALYTICS_FIXED_WINDOW data from Alpha Vantage
 */
export async function fetchAlphaFixedWindow(
  request: AlphaFixedWindowRequest
): Promise<AlphaFixedWindowResponse | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    console.warn('Alpha Vantage disabled: missing ALPHA_VANTAGE_API_KEY');
    return null;
  }

  if (request.symbols.length === 0) {
    return null;
  }

  try {
    const dateRange = getDateRange(request.range, request.rangeStart, request.rangeEnd);
    const ohlcParam = request.ohlc || 'close';

    // Fetch time series for all symbols
    const symbolData: Record<string, Array<{ date: string; price: number }>> = {};
    
    for (const symbol of request.symbols) {
      try {
        const timeSeries = await fetchTimeSeries(symbol, request.interval, apiKey, ohlcParam);
        
        // Filter by date range, then sort ascending so prices[0]=period start, prices[last]=period end
        const filtered = timeSeries
          .filter(point => {
            const pointDate = new Date(point.date);
            return pointDate >= dateRange.start && pointDate <= dateRange.end;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        symbolData[symbol] = filtered;
      } catch (error) {
        // If WEEKLY failed, try MONTHLY as fallback (supports full history in free tier)
        if (request.interval === 'WEEKLY' && error instanceof Error && (error.message.includes('not be available') || error.message.includes('rate limit'))) {
          console.log(`WEEKLY failed for ${symbol}, waiting 2.5s before trying MONTHLY fallback (MONTHLY supports full history)`);
          // Wait before fallback to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2500));
          try {
            // Try MONTHLY - supports 'full' in free tier and gives more data for long ranges
            const timeSeries = await fetchTimeSeries(symbol, 'MONTHLY', apiKey, ohlcParam, 0, 2, false);
            const filtered = timeSeries
              .filter(point => {
                const pointDate = new Date(point.date);
                return pointDate >= dateRange.start && pointDate <= dateRange.end;
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            symbolData[symbol] = filtered;
          } catch (fallbackError) {
            // If MONTHLY also failed, try DAILY as last resort
            if (fallbackError instanceof Error && (fallbackError.message.includes('not be available') || fallbackError.message.includes('rate limit'))) {
              console.log(`MONTHLY also failed for ${symbol}, trying DAILY with compact mode as last resort`);
              await new Promise(resolve => setTimeout(resolve, 2500));
              try {
                const timeSeriesDaily = await fetchTimeSeries(symbol, 'DAILY', apiKey, ohlcParam, 0, 2, true);
                const filtered = timeSeriesDaily
                  .filter(point => {
                    const pointDate = new Date(point.date);
                    return pointDate >= dateRange.start && pointDate <= dateRange.end;
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                symbolData[symbol] = filtered;
              } catch (dailyError) {
                if (dailyError instanceof Error && dailyError.message.includes('rate limit')) {
                  throw new Error(`${symbol}: Rate limit exceeded. Please wait 60 seconds and try again. Alpha Vantage free tier allows 1 request per second and 25 requests per day.`);
                }
                throw new Error(`${symbol}: ${error.message}. Fallback to MONTHLY and DAILY also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
              }
            } else {
              if (fallbackError instanceof Error && fallbackError.message.includes('rate limit')) {
                throw new Error(`${symbol}: Rate limit exceeded. Please wait 60 seconds and try again. Alpha Vantage free tier allows 1 request per second and 25 requests per day.`);
              }
              throw new Error(`${symbol}: ${error.message}. Fallback to MONTHLY also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
            }
          }
        } else {
          throw error;
        }
      }
      
      // Rate limiting: Alpha Vantage free tier allows 1 request per second
      // Wait 2 seconds between requests to be safe (including after fallback)
      if (request.symbols.indexOf(symbol) < request.symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Calculate metrics for each symbol
    const responseData: AlphaFixedWindowResponse = {
      symbols: request.symbols,
      range: {
        start: dateRange.start.toISOString().split('T')[0],
        end: dateRange.end.toISOString().split('T')[0]
      },
      interval: request.interval,
      ohlc: ohlcParam,
      metrics: {},
      correlation: {},
      covariance: {}
    };

    // Calculate per-symbol metrics
    const returnsData: Record<string, number[]> = {};
    
    for (const symbol of request.symbols) {
      const points = symbolData[symbol];
      const prices = points.map(p => p.price);
      const returns = calculateReturns(prices);
      returnsData[symbol] = returns;

      // Explicitly get price at first and last *date* (by timestamp) so order cannot be wrong
      const byTime = points.map(p => ({ t: new Date(p.date).getTime(), price: p.price }));
      const firstPoint = byTime.reduce((a, b) => (a.t < b.t ? a : b));
      const lastPoint = byTime.reduce((a, b) => (a.t > b.t ? a : b));
      const priceFirst = firstPoint.price;
      const priceLast = lastPoint.price;

      const metrics: any = {};
      
      if (request.calculations.includes('CUMULATIVE_RETURN')) {
        metrics.cumulativeReturn = points.length < 2 ? 0 : ((priceLast - priceFirst) / priceFirst) * 100;
      }
      
      if (request.calculations.includes('MEAN')) {
        metrics.mean = calculateMean(returns);
      }
      
      if (request.calculations.includes('MEDIAN')) {
        metrics.median = calculateMedian(returns);
      }
      
      if (request.calculations.includes('VARIANCE')) {
        metrics.variance = calculateVariance(returns, true); // Annualized
      }
      
      if (request.calculations.includes('STDDEV')) {
        metrics.stddev = calculateStdDev(returns, true); // Annualized
      }
      
      if (request.calculations.includes('MAX_DRAWDOWN')) {
        const drop = priceLast < priceFirst ? ((priceFirst - priceLast) / priceFirst) * 100 : 0;
        metrics.maxDrawdown = points.length < 2 ? 0 : drop;
      }

      metrics.priceFirst = priceFirst;
      metrics.priceLast = priceLast;

      responseData.metrics[symbol] = metrics;
    }

    // Calculate correlation and covariance for multi-symbol requests
    if (request.symbols.length > 1) {
      for (let i = 0; i < request.symbols.length; i++) {
        for (let j = i + 1; j < request.symbols.length; j++) {
          const symbol1 = request.symbols[i];
          const symbol2 = request.symbols[j];
          const returns1 = returnsData[symbol1];
          const returns2 = returnsData[symbol2];

          // Align returns by date (use minimum length)
          const minLength = Math.min(returns1.length, returns2.length);
          const aligned1 = returns1.slice(-minLength);
          const aligned2 = returns2.slice(-minLength);

          if (request.calculations.includes('CORRELATION')) {
            const pair = `${symbol1}-${symbol2}`;
            responseData.correlation![pair] = calculateCorrelation(aligned1, aligned2);
          }

          if (request.calculations.includes('COVARIANCE')) {
            const pair = `${symbol1}-${symbol2}`;
            responseData.covariance![pair] = calculateCovariance(aligned1, aligned2, true); // Annualized
          }
        }
      }
    }

    return responseData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching Alpha Vantage Fixed Window:`, error);
    throw new Error(errorMessage);
  }
}

/**
 * Fetch ANALYTICS_SLIDING_WINDOW data from Alpha Vantage
 */
export async function fetchAlphaSlidingWindow(
  request: AlphaSlidingWindowRequest
): Promise<AlphaSlidingWindowResponse | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    console.warn('Alpha Vantage disabled: missing ALPHA_VANTAGE_API_KEY');
    return null;
  }

  if (request.symbols.length === 0) {
    return null;
  }

  if (request.windowSize < 10) {
    throw new Error('Window size must be at least 10');
  }

  try {
    const dateRange = getDateRange(request.range, request.rangeStart, request.rangeEnd);
    const ohlcParam = request.ohlc || 'close';

    // Fetch time series for all symbols
    const symbolData: Record<string, Array<{ date: string; price: number }>> = {};
    
    for (const symbol of request.symbols) {
      try {
        const timeSeries = await fetchTimeSeries(symbol, request.interval, apiKey, ohlcParam);
        
        // Filter by date range, then sort ascending (oldest first)
        const filtered = timeSeries
          .filter(point => {
            const pointDate = new Date(point.date);
            return pointDate >= dateRange.start && pointDate <= dateRange.end;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        symbolData[symbol] = filtered;
      } catch (error) {
        // If WEEKLY failed, try MONTHLY as fallback (supports full history in free tier)
        if (request.interval === 'WEEKLY' && error instanceof Error && (error.message.includes('not be available') || error.message.includes('rate limit'))) {
          console.log(`WEEKLY failed for ${symbol}, waiting 2.5s before trying MONTHLY fallback (MONTHLY supports full history)`);
          // Wait before fallback to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2500));
          try {
            // Try MONTHLY - supports 'full' in free tier and gives more data for long ranges
            const timeSeries = await fetchTimeSeries(symbol, 'MONTHLY', apiKey, ohlcParam, 0, 2, false);
            const filtered = timeSeries
              .filter(point => {
                const pointDate = new Date(point.date);
                return pointDate >= dateRange.start && pointDate <= dateRange.end;
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            symbolData[symbol] = filtered;
          } catch (fallbackError) {
            // If MONTHLY also failed, try DAILY as last resort
            if (fallbackError instanceof Error && (fallbackError.message.includes('not be available') || fallbackError.message.includes('rate limit'))) {
              console.log(`MONTHLY also failed for ${symbol}, trying DAILY with compact mode as last resort`);
              await new Promise(resolve => setTimeout(resolve, 2500));
              try {
                const timeSeriesDaily = await fetchTimeSeries(symbol, 'DAILY', apiKey, ohlcParam, 0, 2, true);
                const filtered = timeSeriesDaily
                  .filter(point => {
                    const pointDate = new Date(point.date);
                    return pointDate >= dateRange.start && pointDate <= dateRange.end;
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                symbolData[symbol] = filtered;
              } catch (dailyError) {
                if (dailyError instanceof Error && dailyError.message.includes('rate limit')) {
                  throw new Error(`${symbol}: Rate limit exceeded. Please wait 60 seconds and try again. Alpha Vantage free tier allows 1 request per second and 25 requests per day.`);
                }
                throw new Error(`${symbol}: ${error.message}. Fallback to MONTHLY and DAILY also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
              }
            } else {
              if (fallbackError instanceof Error && fallbackError.message.includes('rate limit')) {
                throw new Error(`${symbol}: Rate limit exceeded. Please wait 60 seconds and try again. Alpha Vantage free tier allows 1 request per second and 25 requests per day.`);
              }
              throw new Error(`${symbol}: ${error.message}. Fallback to MONTHLY also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
            }
          }
        } else {
          throw error;
        }
      }
      
      // Rate limiting: Alpha Vantage free tier allows 1 request per second
      // Wait 2 seconds between requests to be safe (including after fallback)
      if (request.symbols.indexOf(symbol) < request.symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Calculate sliding windows
    const responseData: AlphaSlidingWindowResponse = {
      symbols: request.symbols,
      range: {
        start: dateRange.start.toISOString().split('T')[0],
        end: dateRange.end.toISOString().split('T')[0]
      },
      interval: request.interval,
      ohlc: ohlcParam,
      windowSize: request.windowSize,
      windows: []
    };

    // Find the minimum length across all symbols
    const minLength = Math.min(...request.symbols.map((s: string) => symbolData[s].length));
    
    if (minLength < request.windowSize) {
      throw new Error(`Not enough data points. Need at least ${request.windowSize}, got ${minLength}`);
    }

    // Create sliding windows
    for (let i = request.windowSize - 1; i < minLength; i++) {
      const windowStartIdx = i - request.windowSize + 1;
      const windowEndIdx = i;
      
      // Get dates for this window
      const windowStartDate = symbolData[request.symbols[0]][windowStartIdx].date;
      const windowEndDate = symbolData[request.symbols[0]][windowEndIdx].date;
      const midpointDate = symbolData[request.symbols[0]][Math.floor((windowStartIdx + windowEndIdx) / 2)].date;

      const window: AlphaSlidingWindowResponse['windows'][0] = {
        start: windowStartDate,
        end: windowEndDate,
        midpoint: midpointDate,
        metrics: {},
        correlation: {},
        covariance: {}
      };

      // Calculate metrics for each symbol in this window
      const windowReturns: Record<string, number[]> = {};
      
      for (const symbol of request.symbols) {
        const windowPrices = symbolData[symbol].slice(windowStartIdx, windowEndIdx + 1).map(p => p.price);
        const returns = calculateReturns(windowPrices);
        windowReturns[symbol] = returns;

        const metrics: any = {};

        if (request.calculations.includes('MEAN')) {
          metrics.mean = calculateMean(returns);
        }

        if (request.calculations.includes('CUMULATIVE_RETURN')) {
          metrics.cumulativeReturn = calculateCumulativeReturn(windowPrices);
        }

        if (request.calculations.includes('VARIANCE')) {
          metrics.variance = calculateVariance(returns, true); // Annualized
        }

        if (request.calculations.includes('STDDEV')) {
          metrics.stddev = calculateStdDev(returns, true); // Annualized
        }

        // Return from period start (so first point can be 0% and chart is "vs start of period")
        const priceAtPeriodStart = symbolData[symbol][0].price;
        const priceAtWindowEnd = symbolData[symbol][windowEndIdx].price;
        metrics.returnFromPeriodStart = ((priceAtWindowEnd - priceAtPeriodStart) / priceAtPeriodStart) * 100;
        
        // Store the actual price for chart display
        metrics.price = priceAtWindowEnd;

        window.metrics[symbol] = metrics;
      }

      // Calculate correlation and covariance for multi-symbol requests
      if (request.symbols.length > 1) {
        for (let j = 0; j < request.symbols.length; j++) {
          for (let k = j + 1; k < request.symbols.length; k++) {
            const symbol1 = request.symbols[j];
            const symbol2 = request.symbols[k];
            const returns1 = windowReturns[symbol1];
            const returns2 = windowReturns[symbol2];

            if (request.calculations.includes('CORRELATION')) {
              const pair = `${symbol1}-${symbol2}`;
              window.correlation![pair] = calculateCorrelation(returns1, returns2);
            }

            if (request.calculations.includes('COVARIANCE')) {
              const pair = `${symbol1}-${symbol2}`;
              window.covariance![pair] = calculateCovariance(returns1, returns2, true); // Annualized
            }
          }
        }
      }

      responseData.windows.push(window);
    }

    return responseData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching Alpha Vantage Sliding Window:`, error);
    throw new Error(errorMessage);
  }
}
