'use client';

import { useState, useRef, useEffect } from 'react';
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

/** Symbol to company name for stock quote display */
const SYMBOL_COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Alphabet', NVDA: 'NVIDIA', META: 'Meta',
  AMZN: 'Amazon', TSLA: 'Tesla', NFLX: 'Netflix', AMD: 'AMD', INTC: 'Intel', DIS: 'Disney'
};

// Translations
const translations = {
  he: {
    title: 'Meta Trends Analyzer',
    subtitle: 'ניתוח מגמות מתקדם',
    enterQueries: 'הזן מוצרים לניתוח',
    pressEnterAddMore: 'Enter או לחיצה על + להוספת מוצר',
    checkIphones: 'בדיקת אייפונים',
    checkRTX: 'בדיקת RTX',
    placeholderQuery: 'למשל iPhone 16',
    queryLabel: 'מוצר',
    removeQuery: 'הסר מוצר',
    addQuery: 'הוסף מוצר',
    advancedOptions: 'אפשרויות מתקדמות',
    alphaTitle: 'ניתוח תזמון מוצר חדש - Alpha Vantage',
    alphaDesc: 'ניתוח מגמות מחיר המניה להערכת תזמון השקת מוצר חדש.',
    selectCompany: 'בחר חברה לניתוח',
    selectPeriod: 'תקופת ניתוח',
    analyze: '🚀 ניתוח מגמות',
    analyzing: 'מנתח...',
    downloadData: '📥 הורד נתונים ל-ChatGPT',
    downloadDesc: 'הקובץ כולל את כל הנתונים לניתוח ב-ChatGPT',
    language: 'English',
    dataSources: 'מקורות נתונים',
    region: 'אזור',
    timeRange: 'תקופת זמן',
    timeRange7d: '7 ימים אחרונים',
    timeRange30d: '30 יום אחרונים',
    timeRange12m: '12 חודשים אחרונים',
    timeRange5y: '5 שנים אחרונות',
    timeRangeAll: 'כל התקופה',
    googleTrendsSource: 'מקור Google Trends (בחר אחד)',
    sourceWeb: 'חיפוש ברשת',
    sourceYoutube: 'YouTube',
    sourceImages: 'תמונות',
    sourceNews: 'חדשות',
    sourceShopping: 'קניות',
    sourceFroogle: 'Froogle',
    useGoogleTrends: 'השתמש ב-Google Trends',
    useAlphaVantage: 'השתמש ב-Alpha Vantage',
    warnings: 'אזהרות',
    alphaWarnings: 'אזהרות Alpha Vantage'
  },
  en: {
    title: 'Meta Trends Analyzer',
    subtitle: 'Advanced trend analysis',
    enterQueries: 'Enter queries to analyze',
    pressEnterAddMore: 'Press ENTER or click + to add more',
    checkIphones: 'Check Iphones',
    checkRTX: 'Check RTX',
    placeholderQuery: 'e.g., iPhone 16',
    queryLabel: 'Query',
    removeQuery: 'Remove query',
    addQuery: 'Add another query',
    advancedOptions: 'Advanced Options',
    alphaTitle: 'Product Launch Timing Analysis - Alpha Vantage',
    alphaDesc: 'Stock price trend analysis for product launch timing.',
    selectCompany: 'Select Company for Analysis',
    selectPeriod: 'Analysis Period',
    analyze: '🚀 Analyze Trends',
    analyzing: 'Analyzing...',
    downloadData: '📥 Download Data for ChatGPT',
    downloadDesc: 'File includes all data for ChatGPT analysis',
    language: 'עברית',
    dataSources: 'Data Sources',
    region: 'Region',
    timeRange: 'Time Range',
    timeRange7d: 'Last 7 days',
    timeRange30d: 'Last 30 days',
    timeRange12m: 'Last 12 months',
    timeRange5y: 'Last 5 years',
    timeRangeAll: 'All time',
    googleTrendsSource: 'Google Trends Data Source (Select One)',
    sourceWeb: 'Web Search',
    sourceYoutube: 'YouTube',
    sourceImages: 'Images',
    sourceNews: 'News',
    sourceShopping: 'Shopping',
    sourceFroogle: 'Froogle',
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

// Extended regions list (label = English, labelHe = Hebrew for RTL)
const REGIONS: { value: string; label: string; labelHe: string }[] = [
  { value: 'WORLDWIDE', label: '🌍 Worldwide', labelHe: '🌍 עולמי' },
  { value: 'US', label: '🇺🇸 United States', labelHe: '🇺🇸 ארצות הברית' },
  { value: 'GB', label: '🇬🇧 United Kingdom', labelHe: '🇬🇧 בריטניה' },
  { value: 'CA', label: '🇨🇦 Canada', labelHe: '🇨🇦 קנדה' },
  { value: 'AU', label: '🇦🇺 Australia', labelHe: '🇦🇺 אוסטרליה' },
  { value: 'DE', label: '🇩🇪 Germany', labelHe: '🇩🇪 גרמניה' },
  { value: 'FR', label: '🇫🇷 France', labelHe: '🇫🇷 צרפת' },
  { value: 'IT', label: '🇮🇹 Italy', labelHe: '🇮🇹 איטליה' },
  { value: 'ES', label: '🇪🇸 Spain', labelHe: '🇪🇸 ספרד' },
  { value: 'NL', label: '🇳🇱 Netherlands', labelHe: '🇳🇱 הולנד' },
  { value: 'BE', label: '🇧🇪 Belgium', labelHe: '🇧🇪 בלגיה' },
  { value: 'CH', label: '🇨🇭 Switzerland', labelHe: '🇨🇭 שווייץ' },
  { value: 'AT', label: '🇦🇹 Austria', labelHe: '🇦🇹 אוסטריה' },
  { value: 'SE', label: '🇸🇪 Sweden', labelHe: '🇸🇪 שוודיה' },
  { value: 'NO', label: '🇳🇴 Norway', labelHe: '🇳🇴 נורווגיה' },
  { value: 'DK', label: '🇩🇰 Denmark', labelHe: '🇩🇰 דנמרק' },
  { value: 'FI', label: '🇫🇮 Finland', labelHe: '🇫🇮 פינלנד' },
  { value: 'PL', label: '🇵🇱 Poland', labelHe: '🇵🇱 פולין' },
  { value: 'CZ', label: '🇨🇿 Czech Republic', labelHe: '🇨🇿 צ\'כיה' },
  { value: 'GR', label: '🇬🇷 Greece', labelHe: '🇬🇷 יוון' },
  { value: 'PT', label: '🇵🇹 Portugal', labelHe: '🇵🇹 פורטוגל' },
  { value: 'IE', label: '🇮🇪 Ireland', labelHe: '🇮🇪 אירלנד' },
  { value: 'JP', label: '🇯🇵 Japan', labelHe: '🇯🇵 יפן' },
  { value: 'KR', label: '🇰🇷 South Korea', labelHe: '🇰🇷 דרום קוריאה' },
  { value: 'CN', label: '🇨🇳 China', labelHe: '🇨🇳 סין' },
  { value: 'IN', label: '🇮🇳 India', labelHe: '🇮🇳 הודו' },
  { value: 'SG', label: '🇸🇬 Singapore', labelHe: '🇸🇬 סינגפור' },
  { value: 'MY', label: '🇲🇾 Malaysia', labelHe: '🇲🇾 מלזיה' },
  { value: 'TH', label: '🇹🇭 Thailand', labelHe: '🇹🇭 תאילנד' },
  { value: 'PH', label: '🇵🇭 Philippines', labelHe: '🇵🇭 פיליפינים' },
  { value: 'ID', label: '🇮🇩 Indonesia', labelHe: '🇮🇩 אינדונזיה' },
  { value: 'VN', label: '🇻🇳 Vietnam', labelHe: '🇻🇳 וייטנאם' },
  { value: 'BR', label: '🇧🇷 Brazil', labelHe: '🇧🇷 ברזיל' },
  { value: 'MX', label: '🇲🇽 Mexico', labelHe: '🇲🇽 מקסיקו' },
  { value: 'AR', label: '🇦🇷 Argentina', labelHe: '🇦🇷 ארגנטינה' },
  { value: 'CL', label: '🇨🇱 Chile', labelHe: '🇨🇱 צ\'ילה' },
  { value: 'CO', label: '🇨🇴 Colombia', labelHe: '🇨🇴 קולומביה' },
  { value: 'PE', label: '🇵🇪 Peru', labelHe: '🇵🇪 פרו' },
  { value: 'ZA', label: '🇿🇦 South Africa', labelHe: '🇿🇦 דרום אפריקה' },
  { value: 'EG', label: '🇪🇬 Egypt', labelHe: '🇪🇬 מצרים' },
  { value: 'NG', label: '🇳🇬 Nigeria', labelHe: '🇳🇬 ניגריה' },
  { value: 'KE', label: '🇰🇪 Kenya', labelHe: '🇰🇪 קניה' },
  { value: 'IL', label: '🇮🇱 Israel', labelHe: '🇮🇱 ישראל' },
  { value: 'AE', label: '🇦🇪 UAE', labelHe: '🇦🇪 איחוד האמירויות' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia', labelHe: '🇸🇦 ערב הסעודית' },
  { value: 'TR', label: '🇹🇷 Turkey', labelHe: '🇹🇷 טורקיה' },
  { value: 'RU', label: '🇷🇺 Russia', labelHe: '🇷🇺 רוסיה' },
  { value: 'UA', label: '🇺🇦 Ukraine', labelHe: '🇺🇦 אוקראינה' },
  { value: 'NZ', label: '🇳🇿 New Zealand', labelHe: '🇳🇿 ניו זילנד' }
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
  
  // Google Trends source - only ONE can be enabled at a time (radio button style)
  const [selectedGoogleSource, setSelectedGoogleSource] = useState<'web' | 'youtube' | 'images' | 'news' | 'shopping' | 'froogle'>('web');
  
  // Derived states for backward compatibility
  const enableGoogleWeb = selectedGoogleSource === 'web';
  const enableGoogleYoutube = selectedGoogleSource === 'youtube';
  const enableGoogleImages = selectedGoogleSource === 'images';
  const enableGoogleNews = selectedGoogleSource === 'news';
  const enableGoogleShopping = selectedGoogleSource === 'shopping';
  const enableGoogleFroogle = selectedGoogleSource === 'froogle';
  
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

  // RTL/LTR and lang: Hebrew = right-to-left, English = left-to-right
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', language === 'he' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language === 'he' ? 'he' : 'en');
  }, [language]);
  
  // Handle symbol selection from autocomplete
  const handleSymbolSelect = (listing: Listing) => {
    setAlphaPrimarySymbol(listing.symbol);
  };
  
  // Refs for ENTER navigation
  const queryRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Autocomplete and Drag & Drop states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean[]>([]);
  const [selectedSuggestionIndices, setSelectedSuggestionIndices] = useState<number[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load saved queries from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('trends_queries_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setSuggestions(history);
      } catch (e) {
        console.error('Error loading query history:', e);
      }
    }
  }, []);

  // Save query to history
  const saveQueryToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const saved = localStorage.getItem('trends_queries_history');
    let history: string[] = saved ? JSON.parse(saved) : [];
    
    // Remove if exists and add to beginning
    history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
    history.unshift(query.trim());
    
    // Keep only last 50 queries
    history = history.slice(0, 50);
    
    localStorage.setItem('trends_queries_history', JSON.stringify(history));
    setSuggestions(history);
  };

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(f => f.type === 'text/plain' || f.name.endsWith('.txt'));
    
    if (textFile) {
      const text = await textFile.text();
      const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Max 5 queries
      
      if (lines.length > 0) {
        // Replace all queries with file content (up to 5)
        const newQueries = lines.slice(0, 5);
        // If we have less than 5 lines, add empty fields to reach 5
        while (newQueries.length < 5) {
          newQueries.push('');
        }
        // Save all lines to history
        lines.forEach(line => saveQueryToHistory(line));
        setQueries(newQueries);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Filter suggestions based on input
  const getFilteredSuggestions = (input: string, index: number): string[] => {
    if (!input || input.length < 2) return [];
    const lowerInput = input.toLowerCase();
    return suggestions
      .filter(s => s.toLowerCase().includes(lowerInput))
      .slice(0, 5); // Show max 5 suggestions
  };

  // Handle file input change
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
      
      if (lines.length > 0) {
        // Replace all queries with file content (up to 5)
        const newQueries = lines.slice(0, 5);
        // If we have less than 5 lines, add empty fields to reach 5
        while (newQueries.length < 5) {
          newQueries.push('');
        }
        // Save all lines to history
        lines.forEach(line => saveQueryToHistory(line));
        setQueries(newQueries);
      }
    }
    // Reset input
    e.target.value = '';
  };

  const handleQueryChange = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    setQueries(newQueries);
    
    // Show suggestions if input has at least 2 characters
    const newShowSuggestions = [...showSuggestions];
    newShowSuggestions[index] = value.length >= 2;
    setShowSuggestions(newShowSuggestions);
    const newSelectedIndices = [...selectedSuggestionIndices];
    newSelectedIndices[index] = -1;
    setSelectedSuggestionIndices(newSelectedIndices);
  };

  // Select suggestion
  const selectSuggestion = (index: number, suggestion: string) => {
    handleQueryChange(index, suggestion);
    const newShowSuggestions = [...showSuggestions];
    newShowSuggestions[index] = false;
    setShowSuggestions(newShowSuggestions);
    const newSelectedIndices = [...selectedSuggestionIndices];
    newSelectedIndices[index] = -1;
    setSelectedSuggestionIndices(newSelectedIndices);
    queryRefs.current[index]?.focus();
  };

  // Save query when user finishes typing (on blur)
  const handleQueryBlur = (index: number) => {
    const query = queries[index]?.trim();
    if (query) {
      saveQueryToHistory(query);
    }
    // Delay hiding suggestions to allow click on suggestion
    setTimeout(() => {
      const newShowSuggestions = [...showSuggestions];
      newShowSuggestions[index] = false;
      setShowSuggestions(newShowSuggestions);
      const newSelectedIndices = [...selectedSuggestionIndices];
      newSelectedIndices[index] = -1;
      setSelectedSuggestionIndices(newSelectedIndices);
    }, 200);
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
    const filtered = getFilteredSuggestions(queries[index] || '', index);
    const hasSuggestions = showSuggestions[index] && filtered.length > 0;
    const currentSelectedIndex = selectedSuggestionIndices[index] ?? -1;
    
    if (hasSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newSelectedIndices = [...selectedSuggestionIndices];
        newSelectedIndices[index] = currentSelectedIndex < filtered.length - 1 ? currentSelectedIndex + 1 : currentSelectedIndex;
        setSelectedSuggestionIndices(newSelectedIndices);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newSelectedIndices = [...selectedSuggestionIndices];
        newSelectedIndices[index] = currentSelectedIndex > 0 ? currentSelectedIndex - 1 : -1;
        setSelectedSuggestionIndices(newSelectedIndices);
        return;
      } else if (e.key === 'Enter' && currentSelectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(index, filtered[currentSelectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const newShowSuggestions = [...showSuggestions];
        newShowSuggestions[index] = false;
        setShowSuggestions(newShowSuggestions);
        const newSelectedIndices = [...selectedSuggestionIndices];
        newSelectedIndices[index] = -1;
        setSelectedSuggestionIndices(newSelectedIndices);
        return;
      }
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = queries[index]?.trim();
      
      if (currentValue) {
        // Save to history
        saveQueryToHistory(currentValue);
        
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
      const msg = error instanceof Error ? error.message : String(error);
      const isNetworkError = error instanceof TypeError && (msg === 'Failed to fetch' || msg.includes('fetch'));
      console.error('Analyze error:', error);
      if (isNetworkError) {
        alert('Network error. Make sure the app is running (e.g. npm run dev) and try again.');
      } else {
        alert('Failed to fetch trend data. Check console for details.');
      }
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
                <span className="text-sm font-medium text-purple-200">{translations?.[language]?.enterQueries ?? (language === 'he' ? 'הזן מוצרים לניתוח' : 'Enter queries to analyze')}</span>
                <span className="text-gray-500 mx-2">|</span>
                <span className="text-xs text-gray-400">{translations?.[language]?.pressEnterAddMore ?? (language === 'he' ? 'Enter או לחיצה על + להוספת מוצר' : 'Press ENTER or click + to add more')}</span>
              </div>
              
              {/* Drag & Drop Zone */}
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all mb-4 ${
                  dragActive
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-gray-800/30 hover:border-purple-400/50'
                }`}
              >
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-300 mb-1">
                  {language === 'he' ? 'גרור קובץ טקסט (.txt) כאן או לחץ לבחירה' : 'Drag a text file (.txt) here or click to select'}
                </p>
                <p className="text-gray-500 text-sm">
                  {language === 'he' ? 'כל שורה = מוצר אחד (עד 5 מוצרים)' : 'Each line = one product (up to 5 products)'}
                </p>
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-3 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer transition-colors"
                >
                  {language === 'he' ? 'בחר קובץ' : 'Select File'}
                </label>
              </div>

              {/* Quick-fill product preset buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setQueries(['iphone 13', 'iphone 14', 'iphone 15', 'iphone 16', 'iphone 17'])}
                  className="px-4 py-2 bg-gray-700 hover:bg-purple-600/80 border border-purple-500/50 text-purple-200 rounded-lg text-sm font-medium transition-colors"
                >
                  {translations?.[language]?.checkIphones ?? (language === 'he' ? 'בדיקת אייפונים' : 'Check Iphones')}
                </button>
                <button
                  type="button"
                  onClick={() => setQueries(['rtx 1060', 'rtx 2060', 'rtx 3060', 'rtx 4060', 'rtx 5060'])}
                  className="px-4 py-2 bg-gray-700 hover:bg-purple-600/80 border border-purple-500/50 text-purple-200 rounded-lg text-sm font-medium transition-colors"
                >
                  {translations?.[language]?.checkRTX ?? (language === 'he' ? 'בדיקת RTX' : 'Check RTX')}
                </button>
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
                        onBlur={() => handleQueryBlur(index)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        placeholder={index === 0 ? (enableGoogleTrends ? (translations?.[language]?.placeholderQuery ?? (language === 'he' ? 'למשל iPhone 16' : 'e.g., iPhone 16')) : (language === 'he' ? 'לא נדרש עבור Alpha Vantage' : 'Not required for Alpha Vantage')) : `${translations?.[language]?.queryLabel ?? (language === 'he' ? 'מוצר' : 'Query')} ${index + 1}`}
                        disabled={!enableGoogleTrends}
                        className={`w-full px-6 py-4 bg-gray-900/80 border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg ${!enableGoogleTrends ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      
                      {/* Autocomplete Suggestions */}
                      {showSuggestions[index] && getFilteredSuggestions(query, index).length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-purple-500/50 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {getFilteredSuggestions(query, index).map((suggestion, sugIndex) => (
                            <div
                              key={sugIndex}
                              onClick={() => selectSuggestion(index, suggestion)}
                              className={`px-4 py-2 cursor-pointer text-gray-200 text-sm transition-colors ${
                                sugIndex === (selectedSuggestionIndices[index] ?? -1)
                                  ? 'bg-purple-600/50'
                                  : 'hover:bg-purple-600/30'
                              }`}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {index > 0 && (
                        <button
                          onClick={() => removeQueryField(index)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors z-10"
                          title={translations?.[language]?.removeQuery ?? (language === 'he' ? 'הסר מוצר' : 'Remove query')}
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
                        title={translations?.[language]?.addQuery ?? (language === 'he' ? 'הוסף מוצר' : 'Add another query')}
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

            {/* Data Source Selection - futuristic 2030-style toggles */}
            <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700/80">
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-purple-500/30 text-purple-200 text-sm font-medium mb-3">
                {translations?.[language]?.dataSources || (language === 'he' ? 'מקורות נתונים' : 'Data Sources')}
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enableGoogleTrends}
                    onChange={(e) => setEnableGoogleTrends(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900 ${
                    enableGoogleTrends
                      ? 'border-purple-400 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'border-gray-600 bg-gray-800/80 text-transparent group-hover:border-gray-500'
                  }`}>
                    {enableGoogleTrends && (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 5l3.5 3.5L11 1" />
                      </svg>
                    )}
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-200 transition-colors">{translations?.[language]?.useGoogleTrends || (language === 'he' ? 'השתמש ב-Google Trends' : 'Use Google Trends')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enableAlphaVantage}
                    onChange={(e) => setEnableAlphaVantage(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900 ${
                    enableAlphaVantage
                      ? 'border-blue-400 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                      : 'border-gray-600 bg-gray-800/80 text-transparent group-hover:border-gray-500'
                  }`}>
                    {enableAlphaVantage && (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 5l3.5 3.5L11 1" />
                      </svg>
                    )}
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-200 transition-colors">{translations?.[language]?.useAlphaVantage || (language === 'he' ? 'השתמש ב-Alpha Vantage' : 'Use Alpha Vantage')}</span>
                </label>
              </div>
            </div>

            {/* Basic Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-purple-500/30 text-purple-200 text-sm font-medium mb-2">
                  {translations?.[language]?.region ?? (language === 'he' ? 'אזור' : 'Region')}
                </div>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={!enableGoogleTrends}
                  className={`w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${!enableGoogleTrends ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {language === 'he' ? r.labelHe : r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-purple-500/30 text-purple-200 text-sm font-medium mb-2">
                  {translations?.[language]?.timeRange ?? (language === 'he' ? 'תקופת זמן' : 'Time Range')}
                </div>
                <div className={`flex flex-wrap gap-2 ${!enableGoogleTrends ? 'opacity-50 pointer-events-none' : ''}`}>
                  {([
                    { value: '7d' as TimeRange, labelHe: '7 ימים', labelEn: '7 days' },
                    { value: '30d' as TimeRange, labelHe: '30 יום', labelEn: '30 days' },
                    { value: '12m' as TimeRange, labelHe: '12 חודשים', labelEn: '12 months' },
                    { value: '5y' as TimeRange, labelHe: '5 שנים', labelEn: '5 years' },
                    { value: 'all' as TimeRange, labelHe: 'כל התקופה', labelEn: 'All' }
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTimeRange(opt.value)}
                      disabled={!enableGoogleTrends}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        timeRange === opt.value
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {language === 'he' ? opt.labelHe : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Google Trends Source Selection - Radio Buttons (Only One Active) */}
            {enableGoogleTrends && (
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-900/30 border border-purple-500/40 text-purple-200 text-sm font-medium mb-3">
                {translations?.[language]?.googleTrendsSource ?? (language === 'he' ? 'מקור Google Trends (בחר אחד)' : 'Google Trends Data Source (Select One)')}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedGoogleSource('web')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGoogleSource === 'web'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedGoogleSource === 'web' ? '✓ ' : ''}🔍 {translations?.[language]?.sourceWeb ?? (language === 'he' ? 'חיפוש ברשת' : 'Web Search')}
                </button>
                <button
                  onClick={() => setSelectedGoogleSource('youtube')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGoogleSource === 'youtube'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedGoogleSource === 'youtube' ? '✓ ' : ''}📺 {translations?.[language]?.sourceYoutube ?? 'YouTube'}
                </button>
                <button
                  onClick={() => setSelectedGoogleSource('images')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGoogleSource === 'images'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedGoogleSource === 'images' ? '✓ ' : ''}🖼️ {translations?.[language]?.sourceImages ?? (language === 'he' ? 'תמונות' : 'Images')}
                </button>
                <button
                  onClick={() => setSelectedGoogleSource('news')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGoogleSource === 'news'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedGoogleSource === 'news' ? '✓ ' : ''}📰 {translations?.[language]?.sourceNews ?? (language === 'he' ? 'חדשות' : 'News')}
                </button>
                <button
                  onClick={() => setSelectedGoogleSource('shopping')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGoogleSource === 'shopping'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedGoogleSource === 'shopping' ? '✓ ' : ''}🛒 {translations?.[language]?.sourceShopping ?? (language === 'he' ? 'קניות' : 'Shopping')}
                </button>
                <button
                  onClick={() => setSelectedGoogleSource('froogle')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGoogleSource === 'froogle'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedGoogleSource === 'froogle' ? '✓ ' : ''}🛍️ {translations?.[language]?.sourceFroogle ?? 'Froogle'}
                </button>
              </div>
            </div>
            )}

            {/* Alpha Vantage Input Section - Simplified for Product Launch Timing */}
            <div className={`mb-6 p-4 rounded-lg border ${enableAlphaVantage ? 'bg-blue-900/20 border-blue-500/30' : 'bg-gray-800/30 border-gray-700 opacity-60'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/40 border border-blue-500/50 text-blue-200 text-lg font-semibold mb-3">
                <span>📈</span> {translations?.[language]?.alphaTitle || (language === 'he' ? 'ניתוח תזמון מוצר חדש - Alpha Vantage' : 'Product Launch Timing Analysis - Alpha Vantage')}
              </div>
              <p className="text-gray-400 text-sm mb-4 max-w-xl">
                {translations?.[language]?.alphaDesc ?? (language === 'he' ? 'ניתוח מגמות מחיר המניה להערכת תזמון השקת מוצר חדש.' : 'Stock price trend analysis for product launch timing.')}
              </p>
              
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

                {/* Time Period - pill buttons like stock quote */}
                  <div>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800/80 border border-blue-500/40 text-blue-200 text-sm font-medium mb-2">
                      {translations?.[language]?.selectPeriod || (language === 'he' ? 'תקופת ניתוח' : 'Analysis Period')}
                    </div>
                    <div className={`flex flex-wrap gap-2 ${!enableAlphaVantage ? 'opacity-50 pointer-events-none' : ''}`}>
                      {([
                        { value: '1year' as const, labelHe: 'שנה', labelEn: '1Y' },
                        { value: '3year' as const, labelHe: '3 שנים', labelEn: '3Y' },
                        { value: '5year' as const, labelHe: '5 שנים', labelEn: '5Y' },
                        { value: '10year' as const, labelHe: '10 שנים', labelEn: '10Y' },
                        { value: 'alltime' as const, labelHe: 'מקס\'', labelEn: 'Max' }
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAlphaRange(opt.value)}
                          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                            alphaRange === opt.value
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {language === 'he' ? opt.labelHe : opt.labelEn}
                        </button>
                      ))}
                    </div>
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
                {showAdvanced ? '▼' : '▶'} {translations?.[language]?.advancedOptions ?? (language === 'he' ? 'אפשרויות מתקדמות' : 'Advanced Options')}
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
                  <TrendCard key={index} series={series} formatTimestamp={formatTimestamp} language={language} />
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

            {/* Alpha Vantage: Stock quote style header + chart card only */}
            {results.alphaFixedWindow && (
              <StockQuoteHeader
                data={results.alphaFixedWindow}
                range={alphaRange}
                onRangeChange={setAlphaRange}
                language={language}
              />
            )}

            {/* Alpha Vantage Sliding Window Results (chart + metrics strip) */}
            {results.alphaSlidingWindow && (
              <AlphaSlidingWindowCard
                data={results.alphaSlidingWindow}
                timeSeries={results.alphaFixedWindow?.timeSeries}
                fixedMetrics={results.alphaFixedWindow ? { priceFirst: results.alphaFixedWindow.metrics[results.alphaFixedWindow.symbols[0]]?.priceFirst, priceLast: results.alphaFixedWindow.metrics[results.alphaFixedWindow.symbols[0]]?.priceLast, cumulativeReturn: results.alphaFixedWindow.metrics[results.alphaFixedWindow.symbols[0]]?.cumulativeReturn, stddev: results.alphaFixedWindow.metrics[results.alphaFixedWindow.symbols[0]]?.stddev } : undefined}
              />
            )}

            {/* Same Google Trends charts as above — with stock price in tooltip on hover */}
            {results.series.length > 0 && results.alphaFixedWindow?.timeSeries?.[results.alphaFixedWindow.symbols[0]]?.length && (
              <div className="mb-8 bg-gradient-to-r from-purple-900/30 via-gray-800/50 to-cyan-900/30 border border-purple-500/30 rounded-xl p-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl opacity-90" aria-hidden>📊</span>
                    {language === 'he' ? 'מגמות חיפוש ומחיר מניה, ציר זמן מאוחד' : 'Search Trends & Stock Price, Unified Timeline'}
                  </h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/50 bg-purple-900/40 text-purple-200">
                    {language === 'he' ? 'ציר זמן מאוחד' : 'Unified timeline'}
                  </span>
                </div>
                <div className="rounded-lg bg-gray-800/60 border border-purple-500/20 px-4 py-2.5 mb-4">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === 'he'
                      ? 'דיאגרמות Google Trends לפי מוצר. בריחוף על תאריך בגרף מופיע גם מחיר המניה באותו יום (Alpha Vantage).'
                      : 'Google Trends by product. Hover over a date to see the stock price for that day (Alpha Vantage).'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {results.series.map((series, index) => (
                    <TrendCard
                      key={index}
                      series={series}
                      formatTimestamp={formatTimestamp}
                      language={language}
                      stockTimeSeries={results.alphaFixedWindow?.timeSeries}
                      stockSymbol={results.alphaFixedWindow?.symbols[0]}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-purple-500/20 text-xs">
                    <span className="text-gray-500">{language === 'he' ? 'מגמות' : 'Trends'}</span>
                    <span className="text-purple-300">{results.series.map((s) => s.label).join(', ')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-emerald-500/20 text-xs">
                    <span className="text-gray-500">{language === 'he' ? 'מניה' : 'Stock'}</span>
                    <span className="text-emerald-400 font-medium">{results.alphaFixedWindow?.symbols[0]}</span>
                  </span>
                </div>
              </div>
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

// Percent fill bar — bottle/hourglass style (vertical fill from bottom)
function PercentFillBar({ percent, variant }: { percent: number; variant: 'decline' | 'recovery' }) {
  const fillHeight = Math.min(Math.max(percent, 0), 100);
  const isDecline = variant === 'decline';
  return (
    <div className="flex items-end gap-3 shrink-0">
      <div
        className="w-8 h-16 rounded-b-lg overflow-hidden bg-gray-700/90 border border-gray-600/70 flex flex-col justify-end shadow-inner"
        title={`${percent}%`}
      >
        <div
          className={`w-full rounded-t transition-all duration-700 ease-out ${
            isDecline ? 'bg-gradient-to-t from-red-700 via-red-500 to-red-400 shadow-sm' : 'bg-gradient-to-t from-emerald-700 via-emerald-500 to-emerald-400 shadow-sm'
          }`}
          style={{ height: `${fillHeight}%`, minHeight: fillHeight > 0 ? 4 : 0 }}
        />
      </div>
      <span className={`text-xl font-bold tabular-nums ${isDecline ? 'text-red-400' : 'text-emerald-400'}`}>
        {percent}%
      </span>
    </div>
  );
}

// Global Insights Component — visual percent bars (bottle/hourglass style)
function GlobalInsights({ series }: { series: TrendSeries[] }) {
  const insights = analyzeAllSeries(series);

  return (
    <div className="space-y-6">
      {/* Overall Trend Summary */}
      <div className="rounded-xl bg-gray-800/60 border border-purple-500/30 px-5 py-3.5">
        <p className="text-gray-200 text-lg font-medium">{insights.overallTrend}</p>
      </div>

      {/* Decline Periods — cards with vertical percent bar */}
      {insights.declinePeriods.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-red-300 font-semibold text-sm">
            <span aria-hidden>📉</span>
            תקופות ירידה משמעותיות
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.declinePeriods.map((decline, index) => (
              <div
                key={index}
                className="rounded-xl bg-red-900/20 border border-red-500/40 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <PercentFillBar percent={decline.declinePercent} variant="decline" />
                <div className="flex-1 min-w-0">
                  <p className="text-red-100/90 text-sm font-medium truncate" title={decline.platform}>
                    {decline.platform}
                  </p>
                  <p className="text-red-200/80 text-xs mt-0.5">
                    בין {decline.startDate} ל־{decline.endDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Periods — cards with vertical percent bar */}
      {insights.recoveryPeriods.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-green-300 font-semibold text-sm">
            <span aria-hidden>📈</span>
            תקופות התאוששות
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.recoveryPeriods.map((recovery, index) => (
              <div
                key={index}
                className="rounded-xl bg-green-900/20 border border-green-500/40 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <PercentFillBar percent={recovery.recoveryPercent} variant="recovery" />
                <div className="flex-1 min-w-0">
                  <p className="text-green-100/90 text-sm font-medium truncate" title={recovery.platform}>
                    {recovery.platform}
                  </p>
                  <p className="text-green-200/80 text-xs mt-0.5">החל מ־{recovery.startDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations — styled like decline/recovery with accent */}
      {insights.recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
            <span aria-hidden>💡</span>
            המלצות למוצר חדש
          </h4>
          <div className="space-y-3">
            {insights.recommendations.map((rec, index) => (
              <div
                key={index}
                className="rounded-xl border border-amber-500/40 overflow-hidden flex shadow-sm"
              >
                <div className="w-1.5 shrink-0 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600" aria-hidden />
                <div className="flex-1 bg-gradient-to-r from-amber-900/30 to-amber-950/20 px-5 py-4">
                  <p className="text-amber-50/95 text-sm leading-relaxed">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.recommendations.length === 0 && insights.declinePeriods.length === 0 && insights.recoveryPeriods.length === 0 && (
        <div className="rounded-xl bg-blue-900/20 border border-blue-500/40 px-5 py-3.5 text-blue-200 text-sm">
          אין תקופות ירידה או התאוששות משמעותיות זוהו. המשך מעקב אחר המגמות.
        </div>
      )}
    </div>
  );
}

// Tooltip Component for trend chart
function SimpleTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-purple-500 shadow-lg">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-purple-300 text-sm mb-1">
          <span className="font-medium">{entry.name}:</span> {entry.value}
        </p>
      ))}
    </div>
  );
}

/** Timestamp (seconds) → YYYY-MM-DD for stock lookup */
function tsToDateStr(ts: number): string {
  return new Date(ts * 1000).toISOString().split('T')[0];
}

/** Find the stock entry with the date closest to the given date (same day, or nearest trading day within a few days). */
function findClosestStockEntry(
  targetDateStr: string,
  stockPrices: Array<{ date: string; price: number }>
): { date: string; price: number } | null {
  if (!stockPrices?.length || !targetDateStr) return null;
  const targetTime = new Date(targetDateStr).getTime();
  let best: { date: string; price: number; diff: number } | null = null;
  for (const p of stockPrices) {
    const t = new Date(p.date).getTime();
    const diff = Math.abs(t - targetTime);
    if (best === null || diff < best.diff) {
      best = { date: p.date, price: p.price, diff };
    }
  }
  return best ? { date: best.date, price: best.price } : null;
}

// Tooltip for TrendCard when stock data is shown — same as SimpleTooltip + stock price (nearest date) + date of price
function TrendCardTooltipWithStock({
  active,
  payload,
  label,
  stockTimeSeries,
  stockSymbol,
  formatDisplayDate,
  language = 'he'
}: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  const timestamp = row?.timestamp;
  const stockPrices = stockSymbol && stockTimeSeries?.[stockSymbol];
  const dateStr = typeof timestamp === 'number' ? tsToDateStr(timestamp) : '';
  const stockEntry = findClosestStockEntry(dateStr, stockPrices || []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-purple-500 shadow-lg">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-purple-300 text-sm mb-1">
          <span className="font-medium">{entry.name}:</span> {entry.value}
        </p>
      ))}
      {stockEntry != null && (
        <p className="text-emerald-400 text-sm mt-2 pt-2 border-t border-gray-600 font-medium">
          {language === 'he'
            ? `מחיר מניה (${stockSymbol}) ב־${formatDisplayDate(stockEntry.date)}: $${stockEntry.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `Stock price (${stockSymbol}) on ${formatDisplayDate(stockEntry.date)}: $${stockEntry.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
      )}
    </div>
  );
}

// Trend Card Component
function TrendCard({
  series,
  formatTimestamp,
  language = 'en',
  stockTimeSeries,
  stockSymbol
}: {
  series: TrendSeries;
  formatTimestamp: (ts: number) => string;
  language?: 'he' | 'en';
  stockTimeSeries?: Record<string, Array<{ date: string; price: number }>>;
  stockSymbol?: string;
}) {
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
                content={(props: any) =>
                  stockTimeSeries && stockSymbol ? (
                    <TrendCardTooltipWithStock
                      {...props}
                      stockTimeSeries={stockTimeSeries}
                      stockSymbol={stockSymbol}
                      formatDisplayDate={formatDisplayDate}
                      language={language}
                    />
                  ) : (
                    <SimpleTooltip {...props} />
                  )
                }
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
            {language === 'he' ? 'אין נקודות נתונים' : 'No data points available'}
          </div>
        </div>
      )}

      {/* Summary — compact, scannable */}
      <div className="pt-4 border-t border-gray-700 space-y-3">
        <p className="text-sm text-gray-400 leading-snug">{description}</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/60 border border-gray-600/60 text-xs">
            <span className="text-gray-500">{language === 'he' ? 'שאילתות' : 'Queries'}</span>
            <span className="text-purple-300 truncate max-w-[180px]" title={series.query}>{series.query}</span>
          </span>
          {series.extra?.region && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/60 border border-gray-600/60 text-xs text-gray-300">
              <span className="text-gray-500">{language === 'he' ? 'אזור' : 'Region'}</span>
              <span>{series.extra.region}</span>
            </span>
          )}
          {series.extra?.category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/60 border border-gray-600/60 text-xs text-gray-300">
              <span className="text-gray-500">{language === 'he' ? 'קטגוריה' : 'Category'}</span>
              <span>{series.extra.category}</span>
            </span>
          )}
        </div>
        {series.extra?.related_queries?.top && series.extra.related_queries.top.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">{language === 'he' ? 'קשור' : 'Related'}</span>
            {series.extra.related_queries.top.slice(0, 3).map((q: any, i: number) => (
              <span key={i} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">
                {q.query}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stock Quote style header (like Google Finance / trading apps)
function StockQuoteHeader({
  data,
  range,
  onRangeChange,
  language
}: {
  data: { symbols: string[]; range: { start: string; end: string }; metrics: Record<string, Record<string, number>> };
  range: string;
  onRangeChange: (r: AlphaVantageRange) => void;
  language: string;
}) {
  const symbol = data.symbols[0];
  const metrics = data.metrics[symbol] || {};
  const priceFirst = metrics.priceFirst as number | undefined;
  const priceLast = metrics.priceLast as number | undefined;
  const cumulativeReturn = metrics.cumulativeReturn as number | undefined ?? 0;
  const companyName = SYMBOL_COMPANY_NAMES[symbol] || symbol;
  const changeDollars = typeof priceFirst === 'number' && typeof priceLast === 'number' ? priceLast - priceFirst : 0;
  const isPositive = cumulativeReturn >= 0;

  const rangeOptions: { value: AlphaVantageRange; labelHe: string; labelEn: string }[] = [
    { value: '1year', labelHe: 'שנה', labelEn: '1Y' },
    { value: '3year', labelHe: '3 שנים', labelEn: '3Y' },
    { value: '5year', labelHe: '5 שנים', labelEn: '5Y' },
    { value: '10year', labelHe: '10 שנים', labelEn: '10Y' },
    { value: 'alltime', labelHe: 'מקס\'', labelEn: 'Max' }
  ];
  const rangeLabel = range === 'alltime' ? (language === 'he' ? 'כל הזמן' : 'All Time') : rangeOptions.find(r => r.value === range)?.[language === 'he' ? 'labelHe' : 'labelEn'] || range;

  return (
    <div className="mb-6 p-6 rounded-2xl bg-gray-900/80 border border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{companyName}</h1>
          <p className="text-gray-400 text-sm mt-0.5">NASDAQ: {symbol}</p>
        </div>
      </div>
      {typeof priceLast === 'number' && (
        <div className="mb-1">
          <span className="text-4xl font-bold text-white">USD {priceLast.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )}
      {typeof priceFirst === 'number' && typeof priceLast === 'number' && (
        <div className={`flex items-center gap-2 text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>{isPositive ? '+' : ''}{changeDollars.toFixed(2)} ({isPositive ? '+' : ''}{Number(cumulativeReturn).toFixed(2)}%)</span>
          <span className="text-gray-500 text-sm font-normal">({rangeLabel})</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        {rangeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onRangeChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === opt.value
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500'
            }`}
          >
            {language === 'he' ? opt.labelHe : opt.labelEn}
          </button>
        ))}
      </div>
      <p className="text-gray-500 text-xs mt-3">
        {language === 'he' ? 'סגור:' : 'Close:'} {formatDisplayDate(data.range.end)} • {language === 'he' ? 'לחץ על תקופה ואז "ניתוח מגמות" לעדכון' : 'Select period then click Analyze to update'}
      </p>
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
function AlphaSlidingWindowCard({
  data,
  timeSeries,
  fixedMetrics
}: {
  data: any;
  timeSeries?: Record<string, Array<{ date: string; price: number }>>;
  fixedMetrics?: { priceFirst?: number; priceLast?: number; cumulativeReturn?: number; stddev?: number };
}) {
  const symbolColors: Record<string, string> = {
    'AAPL': '#3B82F6',
    'MSFT': '#10B981',
    'NVDA': '#8B5CF6',
    'GOOGL': '#EC4899',
    'META': '#F59E0B',
    'TSLA': '#EF4444',
    'AMZN': '#06B6D4'
  };

  const getSymbolColor = (symbol: string) => symbolColors[symbol] || '#8B5CF6';

  // For price chart: green when up, red when down (like trading apps)
  const trendPositive = (fixedMetrics?.cumulativeReturn ?? 0) >= 0;
  const priceLineColor = trendPositive ? '#22C55E' : '#EF4444';

  // Chart: display actual price at actual trading date (so date and price match reality)
  const firstWindow = data.windows[0];
  const firstPointDate = firstWindow?.start ?? data.range.start;
  const firstPoint: any = {
    date: firstPointDate,
    timestamp: new Date(firstPointDate).getTime()
  };
  // Get first price for each symbol - calculate from first window price and returnFromPeriodStart
  data.symbols.forEach((symbol: string) => {
    if (firstWindow?.metrics[symbol]) {
      const firstMetrics = firstWindow.metrics[symbol];
      if (firstMetrics.price !== undefined && firstMetrics.returnFromPeriodStart !== undefined) {
        // First price = price at period start (so chart starts at real first date with correct level)
        const firstWindowPrice = firstMetrics.price;
        const firstReturn = firstMetrics.returnFromPeriodStart;
        firstPoint[`${symbol}_price`] = firstWindowPrice / (1 + firstReturn / 100);
      } else if (firstMetrics.price !== undefined) {
        firstPoint[`${symbol}_price`] = firstMetrics.price;
      } else {
        firstPoint[`${symbol}_price`] = undefined;
      }
    } else {
      firstPoint[`${symbol}_price`] = undefined;
    }
    firstPoint[`${symbol}_stddev`] = undefined;
  });

  // Use window.end for date so each point = (actual trading date, closing price on that date)
  const restOfChartData = data.windows.map((window: any) => {
    const point: any = {
      date: window.end,
      timestamp: new Date(window.end).getTime()
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

  // Price chart: one point per week (from timeSeries) when available; otherwise one point per window
  const symbol = data.symbols[0];
  const priceChartData =
    timeSeries?.[symbol] && timeSeries[symbol].length > 0
      ? timeSeries[symbol].map((p: { date: string; price: number }) => ({
          date: p.date,
          timestamp: new Date(p.date).getTime(),
          [`${symbol}_price`]: p.price
        }))
      : chartData;

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
      {/* Section title - consistent with volatility block */}
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800/50 border border-blue-500/30 text-blue-200 text-base font-semibold mb-2">
        <span className="text-lg opacity-90">📈</span>
        <span>גרף מחירים – {data.symbols[0]}</span>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-2xl">מעקב אחר מחיר המניה – ירידות משמעותיות יכולות להצביע על צורך במוצר חדש.</p>

      {/* Price Chart - clean style like trading apps (one point per week when timeSeries available) */}
      {data.windows.length > 0 && (timeSeries?.[symbol]?.length ? true : data.windows[0].metrics[symbol]?.price !== undefined) && (
        <div className="mb-6">
          <div className="rounded-lg bg-gray-800/40 border border-gray-700/50 px-4 py-2 text-gray-500 text-xs font-medium tracking-wide mb-3">
            נתונים שבועיים · {formatDisplayDate(data.range.start)} עד {formatDisplayDate(data.range.end)}
          </div>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceChartData}>
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
                <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }} iconType="line" />
                {data.symbols.map((sym: string) => (
                  <Line
                    key={`${sym}_price`}
                    type="monotone"
                    dataKey={`${sym}_price`}
                    stroke={priceLineColor}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={`${sym} - מחיר`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics strip below chart (like Google Finance) */}
          {fixedMetrics && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-gray-800/50 border border-gray-700 p-4">
              {typeof fixedMetrics.priceFirst === 'number' && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">שפל תקופה</div>
                  <div className="text-white font-semibold">{fixedMetrics.priceFirst.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              )}
              {typeof fixedMetrics.priceLast === 'number' && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">שיא תקופה</div>
                  <div className="text-white font-semibold">{fixedMetrics.priceLast.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              )}
              {typeof fixedMetrics.cumulativeReturn === 'number' && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">שינוי</div>
                  <div className={`font-semibold ${fixedMetrics.cumulativeReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(fixedMetrics.cumulativeReturn >= 0 ? '+' : '') + Number(fixedMetrics.cumulativeReturn).toFixed(2)}%
                  </div>
                </div>
              )}
              {typeof fixedMetrics.stddev === 'number' && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">תנודתיות</div>
                  <div className="text-white font-semibold">{Number(fixedMetrics.stddev).toFixed(2)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Additional volatility chart - same title/caption style as price chart */}
      {data.windows.length > 0 && data.windows[0].metrics[data.symbols[0]]?.stddev !== undefined && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800/50 border border-blue-500/30 text-blue-200 text-base font-semibold mb-2">
            <span className="text-lg opacity-90">📊</span>
            <span>תנודתיות לאורך זמן</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-3 max-w-2xl">תנודתיות גבוהה מעידה על שוק לא יציב ועלולה להצביע על צורך במוצר חדש.</p>
          <div className="rounded-lg bg-gray-800/40 border border-gray-700/50 px-4 py-2 text-gray-500 text-xs font-medium tracking-wide mb-3">
            נתונים שבועיים · {formatDisplayDate(data.range.start)} עד {formatDisplayDate(data.range.end)}
          </div>
          <details className="mb-3">
            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 font-medium py-1">
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
