import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

async function downloadCSV(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

async function downloadListings() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_KEY;
  
  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY or ALPHA_VANTAGE_KEY environment variable is required');
  }

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log('📥 Downloading active listings...');
  const activeUrl = `${ALPHA_VANTAGE_BASE_URL}?function=LISTING_STATUS&apikey=${apiKey}`;
  const activeCsv = await downloadCSV(activeUrl);
  const activePath = path.join(dataDir, 'alpha_listings_active.csv');
  fs.writeFileSync(activePath, activeCsv);
  console.log(`✅ Saved active listings to ${activePath}`);

  console.log('📥 Downloading delisted listings...');
  const delistedUrl = `${ALPHA_VANTAGE_BASE_URL}?function=LISTING_STATUS&state=delisted&apikey=${apiKey}`;
  const delistedCsv = await downloadCSV(delistedUrl);
  const delistedPath = path.join(dataDir, 'alpha_listings_delisted.csv');
  fs.writeFileSync(delistedPath, delistedCsv);
  console.log(`✅ Saved delisted listings to ${delistedPath}`);

  // Parse and merge CSVs
  console.log('🔄 Merging listings...');
  
  const parseCSV = (csvText: string) => {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    return result.data;
  };

  const activeListings = parseCSV(activeCsv);
  const delistedListings = parseCSV(delistedCsv);

  // Create a Set to deduplicate by symbol+exchange+assetType
  const seen = new Set<string>();
  const merged: any[] = [];

  const getKey = (listing: any) => {
    const symbol = (listing.symbol || '').trim().toUpperCase();
    const exchange = (listing.exchange || '').trim().toUpperCase();
    const assetType = (listing.assetType || '').trim().toUpperCase();
    return `${symbol}|${exchange}|${assetType}`;
  };

  // Add active listings first
  for (const listing of activeListings) {
    const key = getKey(listing);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...(listing as Record<string, any>), status: 'active' });
    }
  }

  // Add delisted listings (may overwrite active if same key, but that's ok)
  for (const listing of delistedListings) {
    const key = getKey(listing);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...(listing as Record<string, any>), status: 'delisted' });
    }
  }

  // Convert back to CSV
  const mergedCsv = Papa.unparse(merged, {
    header: true,
  });

  const mergedPath = path.join(dataDir, 'alpha_listings_all.csv');
  fs.writeFileSync(mergedPath, mergedCsv);
  console.log(`✅ Saved merged listings (${merged.length} total) to ${mergedPath}`);

  console.log('✨ Done!');
}

// Run if called directly
downloadListings().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

export { downloadListings };

