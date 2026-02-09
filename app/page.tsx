'use client';

import { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  AnalyzeRequest, 
  AnalyzeResponse, 
  TrendSeries, 
  TimeRange, 
  TimeSeriesPoint,
  AlphaVantageRange,
  AlphaVantageInterval,
  AlphaVantageOHLC,
  AlphaVantageCalculation
} from '@/lib/types';
import { resolveSymbol } from '@/lib/alphaVantage';
import { getLifecycleLabel, getLifecycleDescription, getLifecycleColor, analyzeAllSeries } from '@/lib/lifecycle';
import SymbolAutocomplete from '@/components/SymbolAutocomplete';
import { Listing } from '@/lib/alphaListings';

/** Format date for display: no hyphens, professional (e.g. 09.02.2021) */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Translations
const translations = {
  he: {
    title: 'Meta Trends Analyzer',
    subtitle: 'ניתוח מגמות מתקדם',
    alphaTitle: 'ניתוח תזמון מוצר חדש - Alpha Vantage',
    alphaDesc: 'זיהוי מתי חברה צריכה להביא מוצר חדש לשוק על בסיס מגמות במחיר המניה. המחיר משקף את הביצועים - ירידות משמעותיות מצביעות על צורך במוצר חדש.',
    selectCompany: 'בחר חברה לניתוח',
    selectPeriod: 'תקופת ניתוח',
    analyze: '🚀 ניתוח מגמות',
    analyzing: 'מנתח...',
    downloadData: '📥 הורד נתונים ל-ChatGPT',
    downloadDesc: 'הקובץ כולל את כל הנתונים לניתוח ב-ChatGPT',
    language: 'English',
    dataSources: 'מקורות נתונים',
    useGoogleTrends: 'השתמש ב-Google Trends',
    useAlphaVantage: 'השתמש ב-Alpha Vantage',
    warnings: 'אזהרות',
    alphaWarnings: 'אזהרות Alpha Vantage'
  },
  en: {
    title: 'Meta Trends Analyzer',
    subtitle: 'Advanced trend analysis',
    alphaTitle: 'Product Launch Timing Analysis - Alpha Vantage',
    alphaDesc: 'Identify when a company needs to launch a new product based on stock price trends. Price reflects performance - significant declines indicate need for a new product.',
    selectCompany: 'Select Company for Analysis',
    selectPeriod: 'Analysis Period',
    analyze: '🚀 Analyze Trends',
    analyzing: 'Analyzing...',
    downloadData: '📥 Download Data for ChatGPT',
    downloadDesc: 'File includes all data for ChatGPT analysis',
    language: 'עברית',
    dataSources: 'Data Sources',
    useGoogleTrends: 'Use Google Trends',
    useAlphaVantage: 'Use Alpha Vantage',
    warnings: 'Warnings',
    alphaWarnings: 'Alpha Vantage Warnings'
  }
};

// Google Trends categories (common ones) - with unique IDs
const GOOGLE_CATEGORIES = [
  { value: '', label: 'All Categories', id: 'all' },
  { value: '0', label: 'All Categories (0)', id: 'all0' },
  { value: '71', label: 'Autos & Vehicles', id: 'autos' },
  { value: '12', label: 'Beauty & Personal Care', id: 'beauty' },
  { value: '66', label: 'Books & Literature', id: 'books' },
  { value: '45', label: 'Business & Industrial', id: 'business' },
  { value: '47', label: 'Computers & Electronics', id: 'computers' },
  { value: '7', label: 'Finance', id: 'finance' },
  { value: '174', label: 'Food & Drink', id: 'food' },
  { value: '44', label: 'Games', id: 'games' },
  { value: '45', label: 'Health', id: 'health' },
  { value: '11', label: 'Home & Garden', id: 'home' },
  { value: '13', label: 'Internet & Telecom', id: 'internet' },
  { value: '958', label: 'Jobs & Education', id: 'jobs' },
  { value: '19', label: 'Law & Government', id: 'law' },
  { value: '16', label: 'News', id: 'news' },
  { value: '20', label: 'Online Communities', id: 'communities' },
  { value: '14', label: 'People & Society', id: 'people' },
  { value: '15', label: 'Pets & Animals', id: 'pets' },
  { value: '29', label: 'Real Estate', id: 'realestate' },
  { value: '533', label: 'Reference', id: 'reference' },
  { value: '174', label: 'Science', id: 'science' },
  { value: '18', label: 'Shopping', id: 'shopping' },
  { value: '20', label: 'Sports', id: 'sports' },
  { value: '67', label: 'Travel', id: 'travel' }
];

// Extended regions list
const REGIONS = [
  { value: 'WORLDWIDE', label: '🌍 Worldwide' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'BE', label: '🇧🇪 Belgium' },
  { value: 'CH', label: '🇨🇭 Switzerland' },
  { value: 'AT', label: '🇦🇹 Austria' },
  { value: 'SE', label: '🇸🇪 Sweden' },
  { value: 'NO', label: '🇳🇴 Norway' },
  { value: 'DK', label: '🇩🇰 Denmark' },
  { value: 'FI', label: '🇫🇮 Finland' },
  { value: 'PL', label: '🇵🇱 Poland' },
  { value: 'CZ', label: '🇨🇿 Czech Republic' },
  { value: 'GR', label: '🇬🇷 Greece' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'IE', label: '🇮🇪 Ireland' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'KR', label: '🇰🇷 South Korea' },
  { value: 'CN', label: '🇨🇳 China' },
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'SG', label: '🇸🇬 Singapore' },
  { value: 'MY', label: '🇲🇾 Malaysia' },
  { value: 'TH', label: '🇹🇭 Thailand' },
  { value: 'PH', label: '🇵🇭 Philippines' },
  { value: 'ID', label: '🇮🇩 Indonesia' },
  { value: 'VN', label: '🇻🇳 Vietnam' },
  { value: 'BR', label: '🇧🇷 Brazil' },
  { value: 'MX', label: '🇲🇽 Mexico' },
  { value: 'AR', label: '🇦🇷 Argentina' },
  { value: 'CL', label: '🇨🇱 Chile' },
  { value: 'CO', label: '🇨🇴 Colombia' },
  { value: 'PE', label: '🇵🇪 Peru' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'IL', label: '🇮🇱 Israel' },
  { value: 'AE', label: '🇦🇪 UAE' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'TR', label: '🇹🇷 Turkey' },
  { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'UA', label: '🇺🇦 Ukraine' },
  { value: 'NZ', label: '🇳🇿 New Zealand' }
];

// Colors for different queries in charts
const QUERY_COLORS = [
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F59E0B'  // Amber
];

export default function Home() {
  const [queries, setQueries] = useState<string[]>(['']);
  const [region, setRegion] = useState('WORLDWIDE');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Google Trends toggles
  const [enableGoogleWeb, setEnableGoogleWeb] = useState(true);
  const [enableGoogleYoutube, setEnableGoogleYoutube] = useState(true);
  const [enableGoogleImages, setEnableGoogleImages] = useState(false);
  const [enableGoogleNews, setEnableGoogleNews] = useState(false);
  const [enableGoogleShopping, setEnableGoogleShopping] = useState(false);
  const [enableGoogleFroogle, setEnableGoogleFroogle] = useState(false);
  
  // Advanced options
  const [category, setCategory] = useState('');
  
  // Data source toggles
  const [enableGoogleTrends, setEnableGoogleTrends] = useState(true);
  const [enableAlphaVantage, setEnableAlphaVantage] = useState(false);
  
  // Alpha Vantage state - simplified for product launch timing
  const [alphaPrimarySymbol, setAlphaPrimarySymbol] = useState('AAPL');
  const [alphaRange, setAlphaRange] = useState<AlphaVantageRange>('5year');
  const [alphaInterval] = useState<AlphaVantageInterval>('WEEKLY'); // Fixed to WEEKLY - most reliable
  const [alphaOHLC] = useState<AlphaVantageOHLC>('close'); // Fixed to close - most standard
  const [alphaWindowSize] = useState(20); // Fixed window size - optimal balance
  
  // Language state
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  
  // Handle symbol selection from autocomplete
  const handleSymbolSelect = (listing: Listing) => {
    setAlphaPrimarySymbol(listing.symbol);
  };
  
  // Refs for ENTER navigation
  const queryRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleQueryChange = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    setQueries(newQueries);
  };

  const addQueryField = (index: number) => {
    if (queries.length < 5) {
      const newQueries = [...queries];
      newQueries.splice(index + 1, 0, '');
      setQueries(newQueries);
      // Focus the new field after a short delay
      setTimeout(() => {
        queryRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const removeQueryField = (index: number) => {
    if (queries.length > 1) {
      const newQueries = queries.filter((_, i) => i !== index);
      setQueries(newQueries);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = queries[index]?.trim();
      
      if (currentValue) {
        // If there's a value and we're not at max, add new field
        if (index === queries.length - 1 && queries.length < 5) {
          addQueryField(index);
        } else if (index < queries.length - 1) {
          // Move to next field
          queryRefs.current[index + 1]?.focus();
        } else {
          // Last field with value - submit
          handleAnalyze();
        }
      } else {
        // Empty field - submit if we have at least one valid query
        const validQueries = queries.filter(q => q.trim());
        if (validQueries.length > 0) {
          handleAnalyze();
        }
      }
    }
  };

  const handleAnalyze = async () => {
    // Check if we need queries (only if Google Trends is enabled)
    const validQueries = queries.filter(q => q.trim());
    if (enableGoogleTrends && validQueries.length === 0) {
      alert('אנא הזן לפחות שאילתת חיפוש אחת עבור Google Trends');
      return;
    }

    // Check if Alpha Vantage is enabled and has required data
    if (enableAlphaVantage) {
      const symbol = alphaPrimarySymbol.trim().toUpperCase();
      if (!symbol) {
        alert('אנא בחר חברה לניתוח');
        return;
      }
    }

    // If neither is enabled, show error
    if (!enableGoogleTrends && !enableAlphaVantage) {
      alert('אנא הפעל לפחות מקור נתונים אחד (Google Trends או Alpha Vantage)');
      return;
    }

    setLoading(true);
    setResults(null);

    // Build Alpha Vantage requests if enabled - simplified for product launch timing
    let alphaFixedWindow = undefined;
    let alphaSlidingWindow = undefined;
    
    if (enableAlphaVantage) {
      const symbol = alphaPrimarySymbol.trim().toUpperCase();
      const symbols = [symbol];
      
      // Fixed window - all required parameters for Alpha Vantage API
      // Focus on identifying when product interest declines (price drops)
        alphaFixedWindow = {
        symbols, // Required: array of stock symbols
        range: alphaRange, // Required: time range (1year, 3year, 5year, etc.)
        rangeStart: undefined, // Optional: only if range is 'custom'
        rangeEnd: undefined, // Optional: only if range is 'custom'
        interval: alphaInterval, // Required: DAILY, WEEKLY, or MONTHLY
        ohlc: alphaOHLC, // Required: open, high, low, or close (default: close)
        calculations: ['CUMULATIVE_RETURN', 'MAX_DRAWDOWN', 'STDDEV'] as AlphaVantageCalculation[] // Required: metrics to calculate
        };
      
      // Sliding window - to see trends over time and identify decline periods
        alphaSlidingWindow = {
        symbols, // Required: array of stock symbols
        range: alphaRange, // Required: time range
        rangeStart: undefined, // Optional
        rangeEnd: undefined, // Optional
        interval: alphaInterval, // Required: DAILY, WEEKLY, or MONTHLY
        ohlc: alphaOHLC, // Required: price field
        windowSize: alphaWindowSize, // Required: number of points per window (>= 10) - from user selection
        calculations: ['CUMULATIVE_RETURN', 'STDDEV'] as AlphaVantageCalculation[] // Required: metrics to track over time
        };
      }

    // Build request - only send what's needed for each data source
    const request: AnalyzeRequest = {
      // Google Trends parameters (only if enabled)
      queries: enableGoogleTrends ? validQueries : [], // Empty array if only Alpha Vantage
      region: enableGoogleTrends ? (region === 'WORLDWIDE' ? undefined : region) : undefined,
      timeRange: enableGoogleTrends ? timeRange : '30d', // Default value if not used
      enableGoogleWeb: enableGoogleTrends ? enableGoogleWeb : false,
      enableGoogleYoutube: enableGoogleTrends ? enableGoogleYoutube : false,
      enableGoogleImages: enableGoogleTrends ? enableGoogleImages : false,
      enableGoogleNews: enableGoogleTrends ? enableGoogleNews : false,
      enableGoogleShopping: enableGoogleTrends ? enableGoogleShopping : false,
      enableGoogleFroogle: enableGoogleTrends ? enableGoogleFroogle : false,
      category: enableGoogleTrends ? (category || undefined) : undefined,
      
      // Data source toggles
      enableGoogleTrends,
      enableAlphaVantage,
      
      // Alpha Vantage parameters (only if enabled)
      alphaFixedWindow,
      alphaSlidingWindow
    };

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: AnalyzeResponse = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch trend data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const iso = date.toISOString().split('T')[0];
    return formatDisplayDate(iso);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-4xl font-bold glow-text bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {translations?.[language]?.title || 'Meta Trends Analyzer'}
          </h1>
          <div className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-purple-900/40 border border-purple-500/50 text-purple-200 text-sm font-medium">
                {language === 'he' ? 'ניתוח מגמות מתקדם' : 'Advanced trend analysis'}
          </div>
            </div>
            <button
              onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              {translations?.[language]?.language || (language === 'he' ? 'English' : 'עברית')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <div className="mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 glow-border">
            {/* Dynamic Query Inputs - Only shown if Google Trends is enabled */}
            {enableGoogleTrends && (
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2.5 rounded-lg bg-gray-800/70 border border-purple-500/40 text-gray-200 mb-3">
                <span className="text-sm font-medium text-purple-200">Enter queries to analyze</span>
                <span className="text-gray-500 mx-2">|</span>
                <span className="text-xs text-gray-400">Press ENTER or click + to add more</span>
              </div>
              <div className="space-y-3">
                {queries.map((query, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <input
                        ref={(el) => {
                          queryRefs.current[index] = el;
                        }}
                        type="text"
                        value={query}
                        onChange={(e) => {
                          handleQueryChange(index, e.target.value);
                          // Auto-populate Alpha Vantage symbol from first query
                          if (index === 0 && enableAlphaVantage) {
                            const resolved = resolveSymbol(e.target.value);
                            if (resolved) {
                              setAlphaPrimarySymbol(resolved);
                            }
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        placeholder={index === 0 ? (enableGoogleTrends ? 'e.g., iPhone 16' : 'לא נדרש עבור Alpha Vantage') : `Query ${index + 1}`}
                        disabled={!enableGoogleTrends}
                        className={`w-full px-6 py-4 bg-gray-900/80 border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg ${!enableGoogleTrends ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {index > 0 && (
                        <button
                          onClick={() => removeQueryField(index)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors"
                          title="Remove query"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {index === queries.length - 1 && queries.length < 5 && (
                      <button
                        onClick={() => addQueryField(index)}
                        className="px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/50 flex items-center justify-center min-w-[60px]"
                        title="Add another query"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Data Source Selection */}
            <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-purple-500/30 text-purple-200 text-sm font-medium mb-3">
                {translations?.[language]?.dataSources || (language === 'he' ? 'מקורות נתונים' : 'Data Sources')}
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGoogleTrends}
                    onChange={(e) => setEnableGoogleTrends(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-300">{translations?.[language]?.useGoogleTrends || (language === 'he' ? 'השתמש ב-Google Trends' : 'Use Google Trends')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAlphaVantage}
                    onChange={(e) => setEnableAlphaVantage(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-300">{translations?.[language]?.useAlphaVantage || (language === 'he' ? 'השתמש ב-Alpha Vantage' : 'Use Alpha Vantage')}</span>
                </label>
              </div>
            </div>

            {/* Basic Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-purple-500/30 text-purple-200 text-sm font-medium mb-2">
                  Region
                </div>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={!enableGoogleTrends}
                  className={`w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${!enableGoogleTrends ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-purple-500/30 text-purple-200 text-sm font-medium mb-2">
                  Time Range
                </div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  disabled={!enableGoogleTrends}
                  className={`w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${!enableGoogleTrends ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="12m">Last 12 months</option>
                  <option value="5y">Last 5 years</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            {/* Google Trends Toggles */}
            {enableGoogleTrends && (
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-900/30 border border-purple-500/40 text-purple-200 text-sm font-medium mb-3">
                Google Trends Data Sources
              </div>
              <div className="flex flex-wrap gap-3">
                <ToggleChip
                  label="🔍 Web Search"
                  enabled={enableGoogleWeb}
                  onChange={setEnableGoogleWeb}
                />
                <ToggleChip
                  label="📺 YouTube"
                  enabled={enableGoogleYoutube}
                  onChange={setEnableGoogleYoutube}
                />
                <ToggleChip
                  label="🖼️ Images"
                  enabled={enableGoogleImages}
                  onChange={setEnableGoogleImages}
                />
                <ToggleChip
                  label="📰 News"
                  enabled={enableGoogleNews}
                  onChange={setEnableGoogleNews}
                />
                <ToggleChip
                  label="🛒 Shopping"
                  enabled={enableGoogleShopping}
                  onChange={setEnableGoogleShopping}
                />
                <ToggleChip
                  label="🛍️ Froogle"
                  enabled={enableGoogleFroogle}
                  onChange={setEnableGoogleFroogle}
                />
              </div>
            </div>
            )}

            {/* Alpha Vantage Input Section - Simplified for Product Launch Timing */}
            <div className={`mb-6 p-4 rounded-lg border ${enableAlphaVantage ? 'bg-blue-900/20 border-blue-500/30' : 'bg-gray-800/30 border-gray-700 opacity-60'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/40 border border-blue-500/50 text-blue-200 text-lg font-semibold mb-3">
                <span>📈</span> {translations?.[language]?.alphaTitle || (language === 'he' ? 'ניתוח תזמון מוצר חדש - Alpha Vantage' : 'Product Launch Timing Analysis - Alpha Vantage')}
              </div>
              <div className="rounded-lg bg-gray-800/60 border border-blue-500/30 px-4 py-3 text-gray-200 text-sm mb-4">
                {translations?.[language]?.alphaDesc || (language === 'he' ? 'זיהוי מתי חברה צריכה להביא מוצר חדש לשוק על בסיס מגמות במחיר המניה. המחיר משקף את הביצועים - ירידות משמעותיות מצביעות על צורך במוצר חדש.' : 'Identify when a company needs to launch a new product based on stock price trends. Price reflects performance - significant declines indicate need for a new product.')}
              </div>
              
              <div className="space-y-4">
                {/* Company Selection */}
                  <div>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-blue-500/40 text-blue-200 text-sm font-medium mb-2">
                    {translations?.[language]?.selectCompany || (language === 'he' ? 'בחר חברה לניתוח' : 'Select Company for Analysis')}
                    </div>
                  <SymbolAutocomplete
                    onSelect={handleSymbolSelect}
                      value={alphaPrimarySymbol}
                    disabled={!enableAlphaVantage}
                    placeholder={language === 'he' ? 'הקלד שם חברה או סמל...' : 'Type company name or symbol...'}
                    language={language}
                  />
                </div>

                {/* Time Period */}
                  <div>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-blue-500/40 text-blue-200 text-sm font-medium mb-2">
                    {translations?.[language]?.selectPeriod || (language === 'he' ? 'תקופת ניתוח' : 'Analysis Period')}
                    </div>
                    <select
                      value={alphaRange}
                      onChange={(e) => setAlphaRange(e.target.value as AlphaVantageRange)}
                    disabled={!enableAlphaVantage}
                    className={`w-full px-4 py-3 bg-gray-900/80 border border-blue-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!enableAlphaVantage ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="3year">{language === 'he' ? '3 שנים' : '3 years'}</option>
                    <option value="5year">{language === 'he' ? '5 שנים' : '5 years'}</option>
                    </select>
                  </div>
                  </div>
                </div>

            {/* Advanced Options */}
            {enableGoogleTrends && (
            <div className="mb-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800/70 border border-purple-500/40 text-purple-300 text-sm font-medium hover:bg-purple-900/30 hover:border-purple-500/60 transition-colors"
              >
                {showAdvanced ? '▼' : '▶'} Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-purple-500/30 text-purple-200 text-sm font-medium mb-2">
                      Google Trends Category
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {GOOGLE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-400 text-xs">
                      Filter trends by specific category (optional)
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {translations?.[language]?.analyzing || (language === 'he' ? 'מנתח...' : 'Analyzing...')}
                </span>
              ) : (
                translations?.[language]?.analyze || (language === 'he' ? '🚀 ניתוח מגמות' : '🚀 Analyze Trends')
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <>
            {/* Warnings */}
            {results.warnings && results.warnings.length > 0 && (
              <div className="mb-8 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-900/40 border border-yellow-600/50 text-yellow-300 font-semibold mb-3">⚠️ {translations?.[language]?.warnings || (language === 'he' ? 'אזהרות' : 'Warnings')}</div>
                <ul className="text-sm text-yellow-200 space-y-1">
                  {results.warnings?.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Global Insights */}
            {results.series.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-900/40 border border-purple-500/50 text-purple-200 text-xl font-bold mb-4">📊 Global Insights</div>
                <GlobalInsights series={results.series} />
              </div>
            )}

            {/* Trend Cards */}
            {results.series.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 mb-8">
                {results.series.map((series, index) => (
                  <TrendCard key={index} series={series} formatTimestamp={formatTimestamp} />
                ))}
              </div>
            ) : results.series.length === 0 && !results.alphaFixedWindow && !results.alphaSlidingWindow ? (
              <div className="text-center py-12 rounded-xl border border-purple-500/30 bg-gray-800/50 mb-8">
                <div className="inline-flex items-center px-6 py-4 rounded-lg bg-gray-800/80 border border-purple-500/40 text-purple-200 text-lg font-medium">
                  No trend data available for these queries.
                </div>
              </div>
            ) : null}

            {/* Alpha Vantage Warnings */}
            {results.alphaWarnings && results.alphaWarnings.length > 0 && (
              <div className="mb-8 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-900/40 border border-yellow-600/50 text-yellow-300 font-semibold mb-3">⚠️ {translations?.[language]?.alphaWarnings || (language === 'he' ? 'אזהרות Alpha Vantage' : 'Alpha Vantage Warnings')}</div>
                <ul className="text-sm text-yellow-200 space-y-1">
                  {results.alphaWarnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alpha Vantage Fixed Window Results */}
            {results.alphaFixedWindow && (
              <AlphaFixedWindowCard
                data={results.alphaFixedWindow}
                slidingWindow={results.alphaSlidingWindow}
              />
            )}

            {/* Alpha Vantage Sliding Window Results */}
            {results.alphaSlidingWindow && (
              <AlphaSlidingWindowCard data={results.alphaSlidingWindow} />
            )}
          </>
        )}
      </main>

      {/* Footer with Download Button */}
      <footer className="border-t border-gray-800 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {results && (
            <div className="mb-6 text-center space-y-4">
              {/* Download CSV Button */}
              <div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/export-excel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ results, alphaPrimarySymbol }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || res.statusText);
                      }
                      const blob = await res.blob();
                      const disposition = res.headers.get('Content-Disposition');
                      const match = disposition?.match(/filename="?([^";\n]+)"?/);
                      const fileName = match ? match[1].trim() : `trend-analysis-${alphaPrimarySymbol}-${new Date().toISOString().split('T')[0]}.csv`;
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = fileName;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Error generating CSV:', error);
                      alert(language === 'he' ? 'שגיאה ביצירת קובץ CSV.' : 'Error generating CSV.');
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg mr-3"
                >
                  {language === 'he' ? '📊 הורד CSV' : '📊 Download CSV'}
                </button>
                
                {/* Download JSON Button */}
                <button
                  onClick={() => {
                    // Create a comprehensive data export for ChatGPT
                    const exportData = {
                      analysisDate: new Date().toISOString(),
                      company: alphaPrimarySymbol,
                      period: alphaRange,
                      results: {
                        fixedWindow: results.alphaFixedWindow,
                        slidingWindow: results.alphaSlidingWindow,
                        googleTrends: results.series,
                        warnings: results.warnings,
                        alphaWarnings: results.alphaWarnings
                      },
                      summary: results.alphaFixedWindow ? {
                        symbol: results.alphaFixedWindow.symbols[0],
                        cumulativeReturn: results.alphaFixedWindow.metrics[results.alphaFixedWindow.symbols[0]]?.cumulativeReturn,
                        maxDrawdown: results.alphaFixedWindow.metrics[results.alphaFixedWindow.symbols[0]]?.maxDrawdown,
                        volatility: results.alphaFixedWindow.metrics[results.alphaFixedWindow.symbols[0]]?.stddev
                      } : null
                    };
                    
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `trend-analysis-${alphaPrimarySymbol}-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  {translations?.[language]?.downloadData || (language === 'he' ? '📥 הורד JSON ל-ChatGPT' : '📥 Download JSON for ChatGPT')}
                </button>
              </div>
              <div className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-400 text-xs">
                {language === 'he' 
                  ? 'Excel: כל הנתונים מסודרים לפי תאריכים | JSON: כל הנתונים לניתוח ב-ChatGPT' 
                  : 'Excel: All data organized by dates | JSON: All data for ChatGPT analysis'}
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gray-800/50 border border-purple-500/30 text-gray-400 text-sm">
              Meta Trends Analyzer • Powered by Google Trends API & Alpha Vantage
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Toggle Chip Component
function ToggleChip({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        enabled
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {enabled ? '✓ ' : ''}{label}
    </button>
  );
}

// Global Insights Component
function GlobalInsights({ series }: { series: TrendSeries[] }) {
  const insights = analyzeAllSeries(series);
  
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gray-800/60 border border-purple-500/30 px-4 py-3 text-gray-200 text-lg">
        {insights.overallTrend}
      </div>
      {insights.strongestRising && (
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-green-900/30 border border-green-500/40 text-green-300">
          📈 Strongest growth: <span className="font-semibold ml-1">{insights.strongestRising.label}</span>
        </div>
      )}
      {insights.strongestDeclining && (
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300">
          📉 Strongest decline: <span className="font-semibold ml-1">{insights.strongestDeclining.label}</span>
        </div>
      )}
    </div>
  );
}

// Trend Card Component
function TrendCard({ series, formatTimestamp }: { series: TrendSeries; formatTimestamp: (ts: number) => string }) {
  const lifecycle = getLifecycleLabel(series);
  const description = getLifecycleDescription(lifecycle);
  const badgeColor = getLifecycleColor(lifecycle);

  // Prepare chart data
  const queryDataMap = series.extra?.queryDataMap || {};
  const queries = series.extra?.queries || [series.query];
  const hasMultipleQueries = queries.length > 1 && Object.keys(queryDataMap).length > 0;
  
  // If we have individual query data, merge it; otherwise use combined points
  let chartData: any[];
  
  if (hasMultipleQueries) {
    // Collect all timestamps from all queries
    const allTimestamps = new Set<number>();
    Object.values(queryDataMap).forEach((points: any) => {
      if (Array.isArray(points)) {
        points.forEach((p: TimeSeriesPoint) => allTimestamps.add(p.timestamp));
      }
    });
    
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    
    chartData = sortedTimestamps.map(timestamp => {
      const dataPoint: any = {
        time: formatTimestamp(timestamp),
        timestamp
      };
      
      // Add value for each query
      queries.forEach((query, idx) => {
        const queryPoints = queryDataMap[query] || [];
        const point = Array.isArray(queryPoints) 
          ? queryPoints.find((p: TimeSeriesPoint) => p.timestamp === timestamp)
          : null;
        dataPoint[`query${idx}`] = point?.value ?? null;
      });
      
      return dataPoint;
    });
  } else {
    // Single query - use combined points
    chartData = series.points.map((point) => ({
      time: formatTimestamp(point.timestamp),
      value: point.value,
      timestamp: point.timestamp
    }));
  }

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google_web': return '🔍';
      case 'google_youtube': return '📺';
      case 'google_images': return '🖼️';
      case 'google_news': return '📰';
      case 'google_shopping': return '🛒';
      case 'google_froogle': return '🛍️';
      default: return '📊';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{getSourceIcon(series.source)}</span>
            {series.label}
          </h3>
          <div className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/60 border border-purple-500/30 text-gray-400 text-sm">
            {series.extra?.description || series.extra?.rawMetricName || series.source}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
          {lifecycle}
        </span>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="mb-4" style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickLine={{ stroke: '#374151' }}
                tickFormatter={(value: string) => {
                  // Find the data point to get the timestamp
                  const dataPoint = chartData.find((d: any) => d.time === value);
                  if (dataPoint && dataPoint.timestamp) {
                    return formatTimestamp(dataPoint.timestamp);
                  }
                  return value;
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickLine={{ stroke: '#374151' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value: any) => [value, '']}
                labelFormatter={(label: string) => {
                  // If label is already formatted with year, return as is
                  // Otherwise, try to extract timestamp and format with year
                  const dataPoint = chartData.find((d: any) => d.time === label);
                  if (dataPoint && dataPoint.timestamp) {
                    return formatTimestamp(dataPoint.timestamp);
                  }
                  return label;
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                iconType="line"
              />
              {/* Render multiple lines if we have individual query data */}
              {hasMultipleQueries ? (
                // Multi-query chart with different colors
                queries.map((query, idx) => (
                  <Line
                    key={query}
                    type="monotone"
                    dataKey={`query${idx}`}
                    stroke={QUERY_COLORS[idx % QUERY_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: QUERY_COLORS[idx % QUERY_COLORS.length], r: 1.5 }}
                    activeDot={{ r: 3 }}
                    name={query}
                    connectNulls
                  />
                ))
              ) : (
                // Single line for combined/average data
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 1.5 }}
                  activeDot={{ r: 3 }}
                  name={series.query}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-400 text-sm">
            No data points available
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="pt-4 border-t border-gray-700">
        <div className="rounded-lg bg-gray-800/50 border border-purple-500/30 px-3 py-2 text-sm text-gray-300 mb-3">
          {description}
        </div>
        <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800/60 border border-purple-500/30 text-gray-300 text-xs">
          <span className="text-purple-300 font-medium">Queries:</span>
          <span className="text-purple-400">{series.query}</span>
          {series.extra?.region && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-purple-300 font-medium">Region:</span>
              <span>{series.extra.region}</span>
            </>
          )}
          {series.extra?.category && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-purple-300 font-medium">Category:</span>
              <span>{series.extra.category}</span>
            </>
          )}
        </div>
        {/* Show related queries if available */}
        {series.extra?.related_queries && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-600 text-gray-400 text-xs font-medium mb-2">Related Queries:</div>
            <div className="flex flex-wrap gap-1">
              {series.extra.related_queries.top?.slice(0, 3).map((q: any, i: number) => (
                <span key={i} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                  {q.query}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Alpha Vantage Fixed Window Card Component - Simplified for Product Launch Timing
function AlphaFixedWindowCard({ data, slidingWindow }: { data: any; slidingWindow?: any }) {
  const symbolColors: Record<string, string> = {
    'AAPL': '#3B82F6', // Blue
    'MSFT': '#10B981', // Green
    'NVDA': '#8B5CF6', // Purple
    'GOOGL': '#EC4899', // Pink
    'META': '#F59E0B', // Amber
    'TSLA': '#EF4444', // Red
    'AMZN': '#06B6D4' // Cyan
  };

  const getSymbolColor = (symbol: string) => {
    return symbolColors[symbol] || '#8B5CF6';
  };

  const symbol = data.symbols[0];
  const metrics = data.metrics[symbol] || {};
  const maxDrawdown = metrics.maxDrawdown ?? 0;
  const stddev = metrics.stddev ?? 0;
  const priceFirst = metrics.priceFirst;
  const priceLast = metrics.priceLast;

  // Same as chart: return from period start (last point = change vs start of period)
  let displayReturn: number;
  if (slidingWindow?.windows?.length > 0) {
    const byDate = [...slidingWindow.windows].sort(
      (a: any, b: any) => new Date(b.midpoint).getTime() - new Date(a.midpoint).getTime()
    );
    const latestWindow = byDate[0];
    const latestMetrics = latestWindow.metrics?.[symbol] || {};
    displayReturn = latestMetrics.returnFromPeriodStart ?? latestMetrics.cumulativeReturn ?? metrics.cumulativeReturn ?? 0;
  } else {
    displayReturn = metrics.cumulativeReturn ?? 0;
  }
  const cumulativeReturn = displayReturn;

  const fmt = (n: number) => (n >= 1e6 || (n < 0.01 && n > 0)) ? n.toFixed(2) : n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  // Recommendation based only on displayReturn (same as card) so it matches the chart
  let recommendation = '';
  let recommendationColor = 'text-gray-300';
  let recommendationIcon = '✅';
  if (cumulativeReturn < -20) {
    recommendation = 'דחוף: החברה חוותה ירידה משמעותית – מומלץ לשקול מוצר חדש';
    recommendationColor = 'text-red-400';
    recommendationIcon = '🚨';
  } else if (cumulativeReturn < -10) {
    recommendation = 'תשומת לב: יש ירידה – כדאי לעקוב ולשקול מוצר חדש';
    recommendationColor = 'text-yellow-400';
    recommendationIcon = '⚠️';
  } else if (cumulativeReturn < 0) {
    recommendation = 'מגמה שלילית קלה – כדאי לעקוב';
    recommendationColor = 'text-orange-400';
    recommendationIcon = '📉';
  } else {
    recommendation = 'החברה במצב טוב – אין צורך דחוף במוצר חדש';
    recommendationColor = 'text-green-400';
    recommendationIcon = '✅';
  }

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900/40 border border-blue-500/50 text-blue-200 text-xl font-bold mb-4">
        <span className="text-2xl">📊</span>
        סיכום ביצועים - {symbol}
      </div>
      <div className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800/70 border border-blue-500/40 text-gray-200">
        <span className="text-sm font-medium text-blue-300">ניתוח תקופתי</span>
        <span className="text-blue-200/80">|</span>
        <span className="font-medium">{formatDisplayDate(data.range.start)}</span>
        <span className="text-gray-500">עד</span>
        <span className="font-medium">{formatDisplayDate(data.range.end)}</span>
      </div>

      {/* Recommendation */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${recommendationColor.includes('red') ? 'bg-red-900/20 border-red-500/50' : recommendationColor.includes('yellow') ? 'bg-yellow-900/20 border-yellow-500/50' : recommendationColor.includes('orange') ? 'bg-orange-900/20 border-orange-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{recommendationIcon}</span>
          <div>
            <h3 className={`font-bold text-lg mb-1 ${recommendationColor}`}>המלצה</h3>
            <p className={`text-base ${recommendationColor}`}>{recommendation}</p>
          </div>
        </div>
      </div>

      {/* Simplified Metrics Display - clear for client */}
      {typeof priceFirst === 'number' && typeof priceLast === 'number' && (
        <div className="mb-4 p-3 rounded-lg bg-gray-800/70 border border-blue-500/30">
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-blue-500/40 text-blue-200 text-sm font-medium mb-2">מחירים בתקופה (לפי יום מסחר)</div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><span className="text-gray-500">יום ראשון:</span> <strong className="text-white">{fmt(priceFirst)}</strong></span>
            <span><span className="text-gray-500">יום אחרון:</span> <strong className="text-white">{fmt(priceLast)}</strong></span>
          </div>
        </div>
      )}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/30">
          <div className="inline-flex items-center px-2 py-1 rounded bg-blue-900/30 border border-blue-500/40 text-blue-200 text-sm font-medium mb-2">שינוי במחיר המניה</div>
          <div className={`text-xl font-bold ${cumulativeReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {symbol} – {cumulativeReturn >= 0 ? '+' : ''}{Number(cumulativeReturn).toFixed(1)}%
          </div>
          <div className="text-sm font-medium mt-1">
            {cumulativeReturn >= 0 ? 'עלה' : 'ירד'}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/30">
          <div className="inline-flex items-center px-2 py-1 rounded bg-blue-900/30 border border-blue-500/40 text-blue-200 text-sm font-medium mb-2">תנודתיות</div>
          <div className="text-2xl font-bold text-blue-400">
            {Number(stddev).toFixed(2)}
          </div>
          <div className="mt-2 inline-flex items-center px-2 py-1 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-400 text-xs">
            מידת שינוי המחיר (גבוה = פחות יציב)
          </div>
          <details className="mt-2">
            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
              מה זה תנודתיות ואיך זה מחושב?
            </summary>
            <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-900/50 rounded">
              <p className="mb-1"><strong>תנודתיות (Volatility)</strong> מודדת כמה המחיר משתנה לאורך זמן.</p>
              <p className="mb-1"><strong>איך זה מחושב:</strong> חישוב סטיית התקן (Standard Deviation) של התשואות היומיות/שבועיות, מוכפל ב-√252 (יומי) או √52 (שבועי) כדי לקבל תנודתיות שנתית.</p>
              <p><strong>מה זה אומר:</strong> ערך גבוה = המחיר משתנה הרבה (יותר סיכון), ערך נמוך = המחיר יציב יותר.</p>
            </div>
          </details>
        </div>
      </div>

    </div>
  );
}

// Alpha Vantage Sliding Window Card Component
function AlphaSlidingWindowCard({ data }: { data: any }) {
  const symbolColors: Record<string, string> = {
    'AAPL': '#3B82F6',
    'MSFT': '#10B981',
    'NVDA': '#8B5CF6',
    'GOOGL': '#EC4899',
    'META': '#F59E0B',
    'TSLA': '#EF4444',
    'AMZN': '#06B6D4'
  };

  const getSymbolColor = (symbol: string) => {
    return symbolColors[symbol] || '#8B5CF6';
  };

  // Chart: display actual price instead of return percentage
  const firstPoint: any = {
    date: data.range.start,
    timestamp: new Date(data.range.start).getTime()
  };
  // Get first price for each symbol - calculate from first window price and returnFromPeriodStart
  data.symbols.forEach((symbol: string) => {
    const firstWindow = data.windows[0];
    if (firstWindow?.metrics[symbol]) {
      const firstMetrics = firstWindow.metrics[symbol];
      if (firstMetrics.price !== undefined && firstMetrics.returnFromPeriodStart !== undefined) {
        // Calculate first price: if first window has price P and return R%, then first price = P / (1 + R/100)
        const firstWindowPrice = firstMetrics.price;
        const firstReturn = firstMetrics.returnFromPeriodStart;
        firstPoint[`${symbol}_price`] = firstWindowPrice / (1 + firstReturn / 100);
      } else if (firstMetrics.price !== undefined) {
        // If no returnFromPeriodStart, use the price directly (shouldn't happen, but fallback)
        firstPoint[`${symbol}_price`] = firstMetrics.price;
      } else {
        firstPoint[`${symbol}_price`] = undefined;
      }
    } else {
      firstPoint[`${symbol}_price`] = undefined;
    }
    firstPoint[`${symbol}_stddev`] = undefined;
  });

  const restOfChartData = data.windows.map((window: any) => {
    const point: any = {
      date: window.midpoint,
      timestamp: new Date(window.midpoint).getTime()
    };
    data.symbols.forEach((symbol: string) => {
      const metrics = window.metrics[symbol] || {};
      if (metrics.stddev !== undefined) {
        point[`${symbol}_stddev`] = metrics.stddev;
      }
      // Use actual price instead of return
      if (metrics.price !== undefined) {
        point[`${symbol}_price`] = metrics.price;
      }
    });
    if (window.correlation) {
      Object.keys(window.correlation).forEach((pair) => {
        point[`corr_${pair.replace('-', '_')}`] = window.correlation[pair];
      });
    }
    return point;
  });

  const chartData = [firstPoint, ...restOfChartData];

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📉</span>
        <h2 className="text-2xl font-bold glow-text text-blue-300">מגמות יורדות - {data.symbols[0]}</h2>
      </div>
      <div className="rounded-lg bg-gray-800/50 border border-blue-500/30 px-4 py-2.5 text-gray-300 text-sm mb-6">
        מעקב אחר ירידות במחיר המניה לאורך זמן – אזורים אדומים מצביעים על צורך במוצר חדש
      </div>

      {/* Price Chart - Main focus for product timing */}
      {data.windows.length > 0 && data.windows[0].metrics[data.symbols[0]]?.price !== undefined && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/40 border border-blue-500/50 text-blue-200 text-lg font-semibold mb-3">
            📈 מחיר המניה לאורך זמן
          </div>
          <div className="rounded-lg bg-gray-800/50 border border-blue-500/30 px-4 py-2.5 text-gray-300 text-sm mb-3">
            מעקב אחר מחיר המניה לאורך זמן. הנתונים מוצגים לפי שבועות בין {formatDisplayDate(data.range.start)} ל־{formatDisplayDate(data.range.end)}
          </div>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                  tickFormatter={(v) => typeof v === 'number' ? v.toFixed(2) : String(v)}
                  label={{ value: 'מחיר', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: number, name) => {
                    if (typeof value === 'number') {
                      const fmt = (n: number) => (n >= 1e6 || (n < 0.01 && n > 0)) ? n.toFixed(2) : n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      return [fmt(value), name];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => (label ? formatDisplayDate(String(label)) : label)}
                />
                <Legend 
                  wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                  iconType="line"
                />
                {data.symbols.map((symbol: string) => (
                  <Line
                    key={`${symbol}_price`}
                    type="monotone"
                    dataKey={`${symbol}_price`}
                    stroke={getSymbolColor(symbol)}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={`${symbol} - מחיר`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Additional volatility chart */}
      {data.windows.length > 0 && data.windows[0].metrics[data.symbols[0]]?.stddev !== undefined && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/40 border border-blue-500/50 text-blue-200 text-lg font-semibold mb-3">
            📊 תנודתיות לאורך זמן
          </div>
          <div className="rounded-lg bg-gray-800/50 border border-blue-500/30 px-4 py-2.5 text-gray-300 text-sm mb-3">
            תנודתיות גבוהה = שוק לא יציב – יכול להצביע על צורך במוצר חדש. הנתונים מוצגים לפי שבועות בין {formatDisplayDate(data.range.start)} ל־{formatDisplayDate(data.range.end)}
          </div>
          <details className="mb-3">
            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
              מה זה תנודתיות ואיך זה מחושב?
            </summary>
            <div className="text-xs text-gray-400 mt-2 p-3 bg-gray-900/50 rounded">
              <p className="mb-2"><strong>תנודתיות (Volatility)</strong> מודדת כמה המחיר משתנה לאורך זמן.</p>
              <p className="mb-2"><strong>איך זה מחושב:</strong> חישוב סטיית התקן (Standard Deviation) של התשואות השבועיות, מוכפל ב-√52 כדי לקבל תנודתיות שנתית.</p>
              <p className="mb-2"><strong>מה זה אומר:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>ערך גבוה (מעל 0.3) = המחיר משתנה הרבה, שוק לא יציב</li>
                <li>ערך בינוני (0.15-0.3) = תנודתיות רגילה</li>
                <li>ערך נמוך (מתחת ל-0.15) = המחיר יציב יחסית</li>
              </ul>
            </div>
          </details>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: number) => [typeof value === 'number' ? value.toFixed(2) : value, '']}
                  labelFormatter={(label) => (label ? formatDisplayDate(String(label)) : label)}
                />
                <Legend 
                  wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                  iconType="line"
                />
                {data.symbols.map((symbol: string) => (
                    <Line
                    key={`${symbol}_stddev`}
                      type="monotone"
                    dataKey={`${symbol}_stddev`}
                    stroke={getSymbolColor(symbol)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    name={`${symbol} - תנודתיות`}
                    />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
