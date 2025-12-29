import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import type { Listing } from '@/lib/listingTypes';

// Dynamic import for papaparse to avoid webpack issues
let Papa: any = null;
const getPapa = () => {
  if (!Papa) {
    // @ts-ignore - webpack will ignore this
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Papa = eval('require')('papaparse');
  }
  return Papa;
};

/**
 * Parse CSV text into Listing array
 * This function is only used server-side in API routes
 */
function loadListingsFromCsvText(csvText: string): Listing[] {
  const PapaInstance = getPapa();
  const result = PapaInstance.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return result.data
    .map((row) => {
      const symbol = (row.symbol || '').trim().toUpperCase();
      const name = (row.name || '').trim();
      const exchange = (row.exchange || '').trim().toUpperCase();
      const assetType = (row.assetType || row['asset type'] || '').trim();
      const status = (row.status || '').trim();

      if (!symbol || !name) {
        return null;
      }

      return {
        symbol,
        name,
        exchange,
        assetType: assetType || undefined,
        status: status || undefined,
      };
    })
    .filter((listing): listing is Listing => listing !== null);
}

// In-memory cache
let cachedListings: Listing[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function loadListings(): Promise<Listing[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedListings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedListings;
  }

  // Load from CSV
  const csvPath = path.join(process.cwd(), 'data', 'alpha_listings_all.csv');
  
  if (!fs.existsSync(csvPath)) {
    // Return empty array if file doesn't exist yet
    return [];
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const listings = loadListingsFromCsvText(csvText);
  
  // Update cache
  cachedListings = listings;
  cacheTimestamp = now;
  
  return listings;
}

export async function GET() {
  try {
    const listings = await loadListings();
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error loading listings:', error);
    return NextResponse.json(
      { error: 'Failed to load listings' },
      { status: 500 }
    );
  }
}

