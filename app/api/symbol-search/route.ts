import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// In-memory cache for API responses
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  const normalizedQuery = query.trim().toUpperCase();

  // Check cache
  const cached = searchCache.get(normalizedQuery);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  // Fetch from Alpha Vantage
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Alpha Vantage API key not configured' },
      { status: 500 }
    );
  }

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle API errors
    if (data['Error Message']) {
      return NextResponse.json(
        { error: data['Error Message'] },
        { status: 400 }
      );
    }

    if (data['Note']) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Transform Alpha Vantage response to Listing format
    const bestMatches = data.bestMatches || [];
    const listings = bestMatches.map((match: any) => ({
      symbol: (match['1. symbol'] || '').trim().toUpperCase(),
      name: (match['2. name'] || '').trim(),
      exchange: (match['4. region'] || match['3. type'] || '').trim().toUpperCase(),
      assetType: (match['3. type'] || '').trim(),
    })).filter((listing: any) => listing.symbol && listing.name);

    // Cache the result
    searchCache.set(normalizedQuery, {
      data: listings,
      timestamp: Date.now(),
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching symbol search:', error);
    return NextResponse.json(
      { error: 'Failed to search symbols' },
      { status: 500 }
    );
  }
}


