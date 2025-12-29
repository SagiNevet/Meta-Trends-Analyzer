# Alpha Vantage Symbol Autocomplete - Setup Guide

## Overview

The Alpha Vantage symbol autocomplete feature replaces the static dropdown with a dynamic search that:
- Searches through thousands of stock symbols from Alpha Vantage
- Provides autocomplete suggestions as you type
- Falls back to remote API search if local results are insufficient
- Supports keyboard navigation (Arrow keys, Enter, Escape)

## Setup Instructions

### 1. Download Listings Data

First, download the stock listings CSV files from Alpha Vantage:

```bash
npm run alpha:download
```

This will:
- Download active listings from Alpha Vantage
- Download delisted listings
- Merge and deduplicate them
- Save to `data/alpha_listings_all.csv`

**Note:** Make sure your `.env.local` file contains:
```
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

Or:
```
ALPHA_VANTAGE_KEY=your_api_key_here
```

### 2. Verify Files Created

After running the download script, you should see:
- `data/alpha_listings_active.csv`
- `data/alpha_listings_delisted.csv`
- `data/alpha_listings_all.csv`

### 3. Start the Development Server

```bash
npm run dev
```

The autocomplete will automatically load listings from the CSV file when you use the Alpha Vantage section.

## How It Works

### Local Search (Primary)
- Loads all listings from `data/alpha_listings_all.csv` on component mount
- Searches locally with ranking:
  1. Exact symbol match (highest priority)
  2. Symbol starts with query
  3. Name starts with query
  4. Symbol includes query
  5. Name includes query

### Remote Search (Fallback)
- If local results < 3, automatically calls Alpha Vantage SYMBOL_SEARCH API
- Results are cached for 10 minutes
- Merged with local results (deduplicated)

### UI Features
- **Debounced input** (250ms delay)
- **Keyboard navigation**: Arrow Up/Down, Enter to select, Escape to close
- **Loading indicator** while searching
- **Dropdown with details**: Shows symbol, company name, exchange, asset type

## API Routes

### `/api/listings`
- Returns all listings from CSV file
- Cached in memory for 1 hour
- GET request, returns JSON array of Listing objects

### `/api/symbol-search?q=QUERY`
- Searches Alpha Vantage SYMBOL_SEARCH API
- Cached per query for 10 minutes
- GET request with query parameter `q`
- Returns JSON array of Listing objects

## TypeScript Types

```typescript
type Listing = {
  symbol: string;
  name: string;
  exchange: string;
  assetType?: string;
  status?: string;
}
```

## Updating Listings

To refresh the listings data (recommended daily):

```bash
npm run alpha:download:daily
```

You can schedule this as a cron job or scheduled task.

## Troubleshooting

### No suggestions appearing
1. Check that `data/alpha_listings_all.csv` exists
2. Verify the CSV file is not empty
3. Check browser console for errors
4. Try running `npm run alpha:download` again

### API rate limit errors
- The remote search is rate-limited by Alpha Vantage
- Local search should work even if API is rate-limited
- Wait 10 minutes and try again

### TypeScript errors
- Make sure `papaparse` and `@types/papaparse` are installed
- Run `npm install` to ensure all dependencies are up to date

## Files Created

- `scripts/downloadListings.ts` - Download script
- `lib/alphaListings.ts` - Parsing and autocomplete logic
- `app/api/listings/route.ts` - API route for local listings
- `app/api/symbol-search/route.ts` - API route for remote search
- `components/SymbolAutocomplete.tsx` - UI component
- Updated `app/page.tsx` - Replaced dropdown with autocomplete


