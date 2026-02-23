// app/api/analyze/route.ts - Main API endpoint for trend analysis

import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequest, AnalyzeResponse, TrendSeries } from '@/lib/types';
import { parseUserQuery } from '@/lib/inputParsing';
import {
  fetchGoogleWebTrends,
  fetchGoogleYouTubeTrends,
  fetchGoogleImagesTrends,
  fetchGoogleNewsTrends,
  fetchGoogleShoppingTrends,
  fetchGoogleFroogleTrends
} from '@/lib/googleTrends';
import {
  fetchAlphaFixedWindow,
  fetchAlphaSlidingWindow
} from '@/lib/alphaVantage';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    
    // Check if at least one data source is enabled
    const enableGoogleTrends = body.enableGoogleTrends !== false;
    const enableAlphaVantage = body.enableAlphaVantage === true;
    
    if (!enableGoogleTrends && !enableAlphaVantage) {
      return NextResponse.json(
        { error: 'At least one data source must be enabled (Google Trends or Alpha Vantage)' },
        { status: 400 }
      );
    }

    // Validate Google Trends requirements (only if enabled)
    let cleanedQueries: string[] = [];
    let timeConfig: any = {};
    let region: string | undefined = undefined;
    let category: string | undefined = undefined;
    
    if (enableGoogleTrends) {
      if (!body.queries || body.queries.length === 0 || body.queries.every(q => !q.trim())) {
        return NextResponse.json(
          { error: 'At least one query is required for Google Trends' },
          { status: 400 }
        );
      }

      // Parse user input for Google Trends
    const parsed = parseUserQuery(body);
      cleanedQueries = parsed.cleanedQueries;
      timeConfig = parsed.timeConfig;
      region = parsed.region;
      category = parsed.category;
    
    if (cleanedQueries.length === 0) {
      return NextResponse.json(
        { error: 'No valid queries after cleaning' },
        { status: 400 }
      );
      }
    }

    // Validate Alpha Vantage requirements (only if enabled)
    if (enableAlphaVantage) {
      if (!body.alphaFixedWindow && !body.alphaSlidingWindow) {
        return NextResponse.json(
          { error: 'Alpha Vantage request parameters are required' },
          { status: 400 }
        );
      }
      
      // Validate required fields for Alpha Vantage
      if (body.alphaFixedWindow) {
        if (!body.alphaFixedWindow.symbols || body.alphaFixedWindow.symbols.length === 0) {
          return NextResponse.json(
            { error: 'Alpha Vantage: symbols are required' },
            { status: 400 }
          );
        }
        if (!body.alphaFixedWindow.range) {
          return NextResponse.json(
            { error: 'Alpha Vantage: range is required' },
            { status: 400 }
          );
        }
        if (!body.alphaFixedWindow.interval) {
          return NextResponse.json(
            { error: 'Alpha Vantage: interval is required' },
            { status: 400 }
          );
        }
        if (!body.alphaFixedWindow.calculations || body.alphaFixedWindow.calculations.length === 0) {
          return NextResponse.json(
            { error: 'Alpha Vantage: at least one calculation is required' },
            { status: 400 }
          );
        }
      }
      
      if (body.alphaSlidingWindow) {
        if (!body.alphaSlidingWindow.symbols || body.alphaSlidingWindow.symbols.length === 0) {
          return NextResponse.json(
            { error: 'Alpha Vantage: symbols are required for sliding window' },
            { status: 400 }
          );
        }
        if (!body.alphaSlidingWindow.windowSize || body.alphaSlidingWindow.windowSize < 10) {
          return NextResponse.json(
            { error: 'Alpha Vantage: windowSize must be at least 10' },
            { status: 400 }
          );
        }
        if (!body.alphaSlidingWindow.calculations || body.alphaSlidingWindow.calculations.length === 0) {
          return NextResponse.json(
            { error: 'Alpha Vantage: at least one calculation is required for sliding window' },
            { status: 400 }
          );
        }
      }
    }
    
    const warnings: string[] = [];
    const alphaWarnings: string[] = [];
    const promises: Promise<TrendSeries | null>[] = [];
    
    // Google Trends processing (only if enabled)
    if (enableGoogleTrends) {
      // Check API key once
      if (!process.env.SEARCHAPI_API_KEY) {
        warnings.push('All Google Trends features disabled: missing SEARCHAPI_API_KEY');
      } else {
        // Execute Google Trends API calls sequentially with delays to avoid rate limiting
        // SearchAPI.io free tier has rate limits, so we execute calls one by one
        
        // Google Web Search
        if (body.enableGoogleWeb) {
          try {
            const result = await fetchGoogleWebTrends(cleanedQueries, timeConfig.googleTime, region, category);
            promises.push(Promise.resolve(result));
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            warnings.push(`Google Web Search error: ${errorMessage}`);
            promises.push(Promise.resolve(null));
          }
          await new Promise(resolve => setTimeout(resolve, 1500)); // Delay before next call
        }

        // Google YouTube Search
        if (body.enableGoogleYoutube) {
          try {
            const result = await fetchGoogleYouTubeTrends(cleanedQueries, timeConfig.googleTime, region, category);
            promises.push(Promise.resolve(result));
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            warnings.push(`YouTube Search error: ${errorMessage}`);
            promises.push(Promise.resolve(null));
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Google Images
        if (body.enableGoogleImages) {
          try {
            const result = await fetchGoogleImagesTrends(cleanedQueries, timeConfig.googleTime, region, category);
            promises.push(Promise.resolve(result));
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            warnings.push(`Google Images error: ${errorMessage}`);
            promises.push(Promise.resolve(null));
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Google News
        if (body.enableGoogleNews) {
          try {
            const result = await fetchGoogleNewsTrends(cleanedQueries, timeConfig.googleTime, region, category);
            promises.push(Promise.resolve(result));
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            warnings.push(`Google News error: ${errorMessage}`);
            promises.push(Promise.resolve(null));
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Google Shopping
        if (body.enableGoogleShopping) {
          try {
            const result = await fetchGoogleShoppingTrends(cleanedQueries, timeConfig.googleTime, region, category);
            promises.push(Promise.resolve(result));
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            warnings.push(`Google Shopping error: ${errorMessage}`);
            promises.push(Promise.resolve(null));
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Google Froogle
        if (body.enableGoogleFroogle) {
          try {
            const result = await fetchGoogleFroogleTrends(cleanedQueries, timeConfig.googleTime, region, category);
            promises.push(Promise.resolve(result));
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            warnings.push(`Google Froogle error: ${errorMessage}`);
            promises.push(Promise.resolve(null));
          }
          // No delay after last call
        }
      }
    }

    // Alpha Vantage processing (only if enabled)
    let alphaFixedWindow = undefined;
    let alphaSlidingWindow = undefined;
    
    if (body.enableAlphaVantage) {
      // Fixed Window Analytics
      if (body.alphaFixedWindow) {
        try {
          alphaFixedWindow = await fetchAlphaFixedWindow(body.alphaFixedWindow);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          alphaWarnings.push(`Alpha Vantage Fixed Window error: ${errorMessage}`);
        }
      }

      // Sliding Window Analytics
      if (body.alphaSlidingWindow) {
        try {
          alphaSlidingWindow = await fetchAlphaSlidingWindow(body.alphaSlidingWindow);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          alphaWarnings.push(`Alpha Vantage Sliding Window error: ${errorMessage}`);
        }
      }
    }

    // Wait for all promises (they're already resolved from sequential execution above)
    const results = await Promise.all(promises);
    
    // Filter out null results
    const series: TrendSeries[] = results.filter((s): s is TrendSeries => s !== null);
    
    if (series.length === 0 && warnings.length === 0 && !alphaFixedWindow && !alphaSlidingWindow) {
      warnings.push('No data found for the given queries and time range');
    }

    const response: AnalyzeResponse = {
      series,
      warnings,
      alphaFixedWindow,
      alphaSlidingWindow,
      alphaWarnings: alphaWarnings.length > 0 ? alphaWarnings : undefined
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
