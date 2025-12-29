import type { Listing } from './listingTypes';

/**
 * Autocomplete function with ranking
 * This is a pure function that doesn't require papaparse, so it can be used client-side
 */
export function autocomplete(
  listings: Listing[],
  query: string,
  limit: number = 12
): Listing[] {
  if (!query || query.trim().length === 0) {
    return listings.slice(0, limit);
  }

  const normalizedQuery = query.trim().toUpperCase();
  const results: Array<{ listing: Listing; score: number }> = [];

  for (const listing of listings) {
    const symbolUpper = listing.symbol.toUpperCase();
    const nameUpper = listing.name.toUpperCase();

    let score = 0;

    // Exact symbol match (highest priority)
    if (symbolUpper === normalizedQuery) {
      score = 1000;
    }
    // Symbol starts with query
    else if (symbolUpper.startsWith(normalizedQuery)) {
      score = 500;
    }
    // Name starts with query
    else if (nameUpper.startsWith(normalizedQuery)) {
      score = 300;
    }
    // Symbol includes query
    else if (symbolUpper.includes(normalizedQuery)) {
      score = 200;
    }
    // Name includes query
    else if (nameUpper.includes(normalizedQuery)) {
      score = 100;
    }

    if (score > 0) {
      results.push({ listing, score });
    }
  }

  // Sort by score (descending), then by symbol
  results.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return a.listing.symbol.localeCompare(b.listing.symbol);
  });

  return results.slice(0, limit).map((r) => r.listing);
}

