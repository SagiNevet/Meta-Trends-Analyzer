'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Listing } from '@/lib/listingTypes';
import { autocomplete } from '@/lib/autocomplete';
import { getStockListings } from '@/lib/stockSymbols';

interface SymbolAutocompleteProps {
  onSelect: (listing: Listing) => void;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  language?: 'he' | 'en';
}

export default function SymbolAutocomplete({
  onSelect,
  value = '',
  disabled = false,
  placeholder,
  language = 'he',
}: SymbolAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load listings on mount
  useEffect(() => {
    loadListings();
  }, []);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const loadListings = async () => {
    try {
      // First try to load from predefined list (faster, always available)
      const predefinedListings = getStockListings();
      setAllListings(predefinedListings);
      
      // Then try to load from API (if available, will merge)
      try {
        const response = await fetch('/api/listings');
        if (response.ok) {
          const apiListings = await response.json();
          // Merge: predefined first, then API (deduplicate by symbol)
          const seen = new Set<string>();
          const merged: Listing[] = [];
          
          for (const listing of predefinedListings) {
            seen.add(listing.symbol);
            merged.push(listing);
          }
          
          for (const listing of apiListings) {
            if (!seen.has(listing.symbol)) {
              seen.add(listing.symbol);
              merged.push(listing);
            }
          }
          
          setAllListings(merged);
        }
      } catch (apiError) {
        // If API fails, use predefined list only
        console.warn('API listings not available, using predefined list only');
      }
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
  };

  const searchSymbols = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // First, search local listings
      const localResults = autocomplete(allListings, searchQuery, 12);

      // If we have fewer than 3 results, try remote search
      if (localResults.length < 3) {
        try {
          const remoteResponse = await fetch(`/api/symbol-search?q=${encodeURIComponent(searchQuery)}`);
          if (remoteResponse.ok) {
            const remoteResults: Listing[] = await remoteResponse.json();
            
            // Merge and deduplicate
            const seen = new Set<string>();
            const merged: Listing[] = [];
            
            // Add local results first
            for (const listing of localResults) {
              const key = `${listing.symbol}|${listing.exchange}`;
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(listing);
              }
            }
            
            // Add remote results
            for (const listing of remoteResults) {
              const key = `${listing.symbol}|${listing.exchange}`;
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(listing);
              }
            }
            
            setSuggestions(merged.slice(0, 12));
          } else {
            setSuggestions(localResults);
          }
        } catch (error) {
          console.error('Remote search failed:', error);
          setSuggestions(localResults);
        }
      } else {
        setSuggestions(localResults);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [allListings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);

    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Immediate search for better UX (no debounce delay)
    if (newQuery.trim().length > 0) {
      searchSymbols(newQuery);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (listing: Listing) => {
    // Update query immediately
    const symbol = listing.symbol;
    setQuery(symbol);
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    // Update input value directly to ensure it's set
    if (inputRef.current) {
      inputRef.current.value = symbol;
    }
    
    // Call onSelect callback
    onSelect(listing);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // Try to find exact match
        const exactMatch = suggestions.find(
          (s) => s.symbol.toUpperCase() === query.trim().toUpperCase()
        );
        if (exactMatch) {
          handleSelect(exactMatch);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          handleSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if focus is moving to dropdown
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && dropdownRef.current?.contains(relatedTarget)) {
      // Focus is moving to dropdown, don't close it
      return;
    }
    
    // Delay to allow click events to fire
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder || (language === 'he' ? 'הקלד שם חברה או סמל...' : 'Type company name or symbol...')}
        className={`w-full px-4 py-3 bg-gray-900/80 border border-blue-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto"
        >
          {suggestions.map((listing, index) => (
            <div
              key={`${listing.symbol}-${listing.exchange}-${index}`}
              onMouseDown={(e) => {
                // Prevent blur from firing before click
                e.preventDefault();
              }}
              onClick={() => {
                handleSelect(listing);
                // Refocus input after selection
                inputRef.current?.focus();
              }}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-b-0 ${
                index === selectedIndex ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-white text-lg">{listing.symbol}</div>
                  <div className="text-sm text-gray-300 mt-1">{listing.name}</div>
                </div>
                {listing.exchange && (
                  <div className="text-xs text-gray-500 ml-4">
                    {listing.exchange}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

