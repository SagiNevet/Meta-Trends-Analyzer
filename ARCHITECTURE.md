# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              app/page.tsx (React UI)                │   │
│  │  • Search input                                     │   │
│  │  • Region/time selectors                            │   │
│  │  • API toggle chips                                 │   │
│  │  • Results cards with Recharts                      │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/analyze
                           │ (JSON request)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         app/api/analyze/route.ts                    │   │
│  │  • Validate request                                 │   │
│  │  • Call parseUserQuery()                            │   │
│  │  • Check API keys                                   │   │
│  │  • Orchestrate parallel API calls                   │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          lib/inputParsing.ts                        │   │
│  │  • Clean query text                                 │   │
│  │  • Map time ranges to API formats                   │   │
│  │  • Normalize region codes                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          PARALLEL API CALLS (Promise.all)           │   │
│  └──┬────┬─────┬──────────┬─────────┬──────────────────┘   │
│     │    │     │          │         │                       │
└─────┼────┼─────┼──────────┼─────────┼───────────────────────┘
      │    │     │          │         │
      ▼    ▼     ▼          ▼         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ADAPTERS (lib/)                      │
├─────────────────────────────────────────────────────────────┤
│  googleTrends.ts  │  tiktokTrends.ts  │  pinterestTrends.ts│
│  • Check API key  │  • Check token    │  • Check token     │
│  • Build request  │  • Build query    │  • Build params    │
│  • Fetch data     │  • POST request   │  • GET request     │
│  • Transform      │  • Aggregate      │  • Match keyword   │
│  • Return series  │  • Return series  │  • Return series   │
├─────────────────────────────────────────────────────────────┤
│  redditMentions.ts                                          │
│  • Build Pushshift query                                   │
│  • Aggregate by day                                         │
│  • Return series                                            │
└──────────────────────────────────────────────────────────────┘
      │         │         │          │         │
      ▼         ▼         ▼          ▼         ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL APIs                             │
├─────────────────────────────────────────────────────────────┤
│  SearchAPI.io     │  TikTok API   │  Pinterest API          │
│  ───────────      │  ──────────   │  ─────────────          │
│  Google Trends    │  Video Query  │  Trending Keywords      │
│  • Web search     │  • 30-day max │  • By region/interest   │
│  • YouTube search │  • OAuth 2.0  │  • Time series          │
│  • 0-100 scale    │  • View counts│  • 0-100 normalized     │
├─────────────────────────────────────────────────────────────┤
│  Pushshift API                                              │
│  ─────────────                                              │
│  Reddit Comments                                            │
│  • Aggregations by day                                      │
│  • Mention counts                                           │
└─────────────────────────────────────────────────────────────┘
      │         │         │          │         │
      └─────────┴─────────┴──────────┴─────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA PROCESSING                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          lib/normalize.ts                           │   │
│  │  • Scale to 0-100 (if needed)                       │   │
│  │  • Fill time gaps                                   │   │
│  │  • Smooth data                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                    │
│                        ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          lib/lifecycle.ts                           │   │
│  │  • Calculate statistics                             │   │
│  │  • Compute slope                                    │   │
│  │  • Classify trend (Rising/Peak/Declining/Stable)    │   │
│  │  • Generate insights                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 UNIFIED RESPONSE                            │
│  {                                                          │
│    series: [                                                │
│      {                                                      │
│        source: 'google_web',                                │
│        label: 'Google Web Search',                          │
│        points: [{timestamp, value}, ...],                   │
│        extra: { description, ... }                          │
│      },                                                     │
│      { ... more series ... }                                │
│    ],                                                       │
│    warnings: ['TikTok disabled: missing key', ...]         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   VISUALIZATION                             │
│  • Recharts line charts                                    │
│  • Lifecycle badges (colored)                              │
│  • Global insights panel                                   │
│  • Warning notifications                                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Details

### 1. Request Phase
```
User Input → Query Parsing → Time Mapping → Region Normalization
```

### 2. Fetch Phase (Parallel)
```
Promise.all([
  fetchGoogleWebTrends(),
  fetchGoogleYouTubeTrends(),
  fetchTikTokTrends(),
  fetchPinterestTrends(),
  fetchRedditMentions()
])
```

### 3. Transform Phase
```
Raw API Response → Adapter → TrendSeries (unified format)
```

### 4. Analysis Phase
```
TrendSeries[] → normalize() → lifecycle() → Insights
```

### 5. Response Phase
```
JSON Response → React State → Recharts → User sees charts
```

## Type Flow

```typescript
AnalyzeRequest (from UI)
    ↓
ParsedQuery (normalized params)
    ↓
[API Calls] → Raw API Responses
    ↓
TrendSeries[] (unified format)
    ↓
AnalyzeResponse (to UI)
    ↓
Rendered as TrendCard[] components
```

## Component Hierarchy

```
page.tsx (Main)
├── Header
├── SearchSection
│   ├── Input (query)
│   ├── Selects (region, time)
│   ├── ToggleChips[] (API sources)
│   ├── AdvancedOptions (collapsible)
│   └── AnalyzeButton
├── WarningsSection
├── GlobalInsights
└── ResultsGrid
    └── TrendCard[]
        ├── Header (title + lifecycle badge)
        ├── ResponsiveContainer
        │   └── LineChart (Recharts)
        └── Summary (description)
```

## File Dependency Graph

```
app/page.tsx
├── imports: lib/types.ts
├── imports: lib/lifecycle.ts
└── fetches: /api/analyze

app/api/analyze/route.ts
├── imports: lib/types.ts
├── imports: lib/inputParsing.ts
├── imports: lib/googleTrends.ts
├── imports: lib/tiktokTrends.ts
├── imports: lib/pinterestTrends.ts
└── imports: lib/redditMentions.ts

lib/googleTrends.ts
└── imports: lib/types.ts

lib/tiktokTrends.ts
└── imports: lib/types.ts

lib/pinterestTrends.ts
└── imports: lib/types.ts

lib/redditMentions.ts
└── imports: lib/types.ts

lib/lifecycle.ts
├── imports: lib/types.ts
└── uses: lib/normalize.ts (optional)

lib/inputParsing.ts
└── imports: lib/types.ts

lib/types.ts
└── (no dependencies - base types)
```

## Environment Variables Flow

```
.env.local (gitignored)
    ↓
process.env.SEARCHAPI_API_KEY (server-side only)
    ↓
Checked in adapter (e.g., googleTrends.ts)
    ↓
If missing: return null + console.warn
If present: include in API request
```

## Error Handling Strategy

```
User Request
    ↓
[Validation] → 400 Bad Request if invalid
    ↓
[API Key Check] → null + warning if missing
    ↓
[API Call] → try/catch → null + warning if error
    ↓
[Collect Results] → filter out nulls
    ↓
[Return] → series[] + warnings[]
    ↓
[UI] → Show warnings, render available series
```

## Performance Optimizations

1. **Parallel API Calls**: Promise.all instead of sequential
2. **Early Return**: Adapters return null immediately if no API key
3. **Error Isolation**: One API failure doesn't break others
4. **Lazy Loading**: Charts only render when data available
5. **Code Splitting**: Next.js automatic splitting

## Security Boundaries

```
┌─────────────────────┐
│   Client Browser    │  ← No API keys here
│   (public code)     │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│   Next.js Server    │  ← API keys here (secure)
│   (private code)    │
└──────────┬──────────┘
           │ API Keys
           ▼
┌─────────────────────┐
│   External APIs     │
└─────────────────────┘
```

## Deployment Architecture

```
GitHub Repository
    ↓
Vercel (or other host)
    ↓
├── Static Assets (Next.js build)
├── API Routes (serverless functions)
└── Environment Variables (secure storage)
    ↓
External APIs (Google, TikTok, Pinterest, Reddit)
```

---

This architecture ensures:
- ✅ Separation of concerns
- ✅ Type safety throughout
- ✅ Secure API key handling
- ✅ Graceful error handling
- ✅ Parallel performance
- ✅ Extensible design

