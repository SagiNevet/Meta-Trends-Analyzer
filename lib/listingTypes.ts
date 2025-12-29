// Shared types for Alpha Vantage listings
// This file doesn't import papaparse, so it's safe for client-side use

export type Listing = {
  symbol: string;
  name: string;
  exchange: string;
  assetType?: string;
  status?: string;
};


