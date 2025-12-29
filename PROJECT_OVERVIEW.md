# Meta Trends Analyzer - Project Overview

## Executive Summary

Meta Trends Analyzer is a sophisticated full-stack web application that provides unified trend analysis across five major digital platforms. Built with Next.js 15, TypeScript, and modern web technologies, it offers real-time insights into product and topic popularity trends.

## Core Value Proposition

**Single Query → Multi-Platform Intelligence**

Users can:
1. Enter one search term
2. Select region and time range
3. Get comprehensive trend data from Google, YouTube, TikTok, Pinterest, and Reddit
4. View unified visualizations with lifecycle analysis
5. Make data-driven decisions about market timing and product launches

## Technical Architecture

### Frontend Layer
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS with custom dark theme
- **Charts**: Recharts for interactive visualizations
- **Design Pattern**: Component-based architecture with hooks

### Backend Layer
- **API Routes**: Next.js API routes (serverless)
- **Language**: TypeScript (strict mode)
- **Architecture**: Adapter pattern for external APIs
- **Data Flow**: Parallel API calls with Promise.all

### External Integrations
1. **SearchAPI.io** → Google Trends (Web + YouTube)
2. **TikTok Research API** → Video analytics
3. **Pinterest API** → Trending keywords
4. **Pushshift** → Reddit mentions

## Key Features

### 1. Unified Search Interface
- Single input field for all platforms
- Smart query parsing and normalization
- Region-specific analysis (10+ countries)
- Flexible time ranges (7 days to 5+ years)

### 2. Multi-Source Data Aggregation
- Parallel API calls for optimal performance
- Graceful degradation (works with any subset of APIs)
- Automatic error handling and user-friendly warnings
- Real-time data freshness

### 3. Advanced Visualizations
- Interactive line charts per platform
- Time-series comparison
- Normalized 0-100 scales for comparability
- Color-coded trend indicators

### 4. Lifecycle Analysis
- Automatic trend classification:
  - **Rising**: Growing interest
  - **Peak**: At maximum interest
  - **Declining**: Decreasing interest
  - **Stable**: Consistent interest
- Slope analysis and pattern recognition
- Cross-platform comparison

### 5. Global Insights
- Identifies strongest rising/declining platforms
- Overall trend summary
- Comparative analysis across sources

## Data Flow

```
User Input
    ↓
Input Parser (normalize query, region, time)
    ↓
API Orchestrator (/api/analyze)
    ↓
┌─────────┬──────────┬─────────┬───────────┬────────┐
│ Google  │ YouTube  │ TikTok  │ Pinterest │ Reddit │
│ Trends  │ Trends   │ API     │ API       │ API    │
└─────────┴──────────┴─────────┴───────────┴────────┘
    ↓ (parallel fetch)
Raw API Responses
    ↓
Adapters (transform to unified TrendSeries format)
    ↓
Normalization & Lifecycle Analysis
    ↓
JSON Response to Frontend
    ↓
Recharts Visualization + UI Cards
    ↓
User sees comprehensive trend analysis
```

## File Structure & Responsibilities

### `/app` - Next.js App Router

**`page.tsx`** (1,000+ lines)
- Main UI component
- Search interface with controls
- Trend card rendering
- Chart integration
- State management

**`layout.tsx`**
- Root layout wrapper
- Metadata configuration
- Global HTML structure

**`globals.css`**
- Tailwind directives
- Custom CSS variables
- Dark theme styling
- Glow effects and animations

**`api/analyze/route.ts`**
- Main API endpoint (POST)
- Request validation
- API orchestration
- Error handling
- Response formatting

### `/lib` - Shared Business Logic

**`types.ts`**
- TypeScript type definitions
- TrendSeries, TimeSeriesPoint
- AnalyzeRequest/Response
- Enums for sources and time ranges

**`inputParsing.ts`**
- Query text cleaning
- Time range mapping
- Region normalization
- Parameter validation

**`googleTrends.ts`**
- SearchAPI.io integration
- Web search trends
- YouTube search trends
- Response parsing

**`tiktokTrends.ts`**
- TikTok Research API integration
- Video query construction
- Daily aggregation logic
- 30-day window handling

**`pinterestTrends.ts`**
- Pinterest Trends API integration
- Keyword matching algorithm
- Time series extraction
- Interest category filtering

**`redditMentions.ts`**
- Pushshift API integration
- Aggregation by day
- Comment count tracking

**`normalize.ts`**
- 0-100 scaling
- Gap filling
- Smoothing algorithms
- Data preprocessing

**`lifecycle.ts`**
- Statistical analysis
- Trend classification
- Slope calculation
- Cross-platform comparison
- Color coding helpers

**`mockData.ts`**
- Demo data generation
- Development/testing support
- Pattern simulation

## API Integration Details

### Google Trends (via SearchAPI.io)

**Parameters**:
- `engine`: "google_trends"
- `data_type`: "TIMESERIES"
- `q`: search query
- `time`: "now 7-d", "today 12-m", etc.
- `geo`: region code
- `gprop`: "" (web) or "youtube"

**Response**: Timeline data with timestamps and 0-100 interest values

### TikTok Research API

**Endpoint**: `/v2/research/video/query/`
**Method**: POST
**Auth**: Bearer token

**Query Structure**:
```json
{
  "query": {
    "and": [
      { "operation": "EQ", "field_name": "keyword", "field_values": ["term"] }
    ]
  },
  "start_date": "YYYYMMDD",
  "end_date": "YYYYMMDD",
  "max_count": 100
}
```

**Limitation**: 30-day window maximum

### Pinterest Trends

**Endpoint**: `/v5/trends/keywords/{region}/top/{trend_type}`
**Method**: GET
**Auth**: Bearer token

**Parameters**:
- `interests`: category filter
- `limit`: result count
- `normalize_against_group`: false

### Reddit (Pushshift)

**Endpoint**: `/reddit/comment/search/`
**Method**: GET

**Parameters**:
- `q`: search term
- `aggs`: "created_utc"
- `frequency`: "day"
- `after`/`before`: timestamps

## Security Considerations

### API Key Management
- All keys stored in `.env.local` (gitignored)
- Server-side only access (Next.js API routes)
- No client-side exposure
- Environment variable validation

### Rate Limiting
- Each API has its own limits
- Graceful error handling
- User-facing warnings
- Automatic retry logic (optional future enhancement)

### Input Validation
- Query sanitization
- Region code validation
- Time range validation
- Type safety via TypeScript

## Performance Optimizations

1. **Parallel API Calls**: Promise.all for concurrent fetching
2. **Lazy Loading**: Charts rendered only when data available
3. **Responsive Design**: Mobile-optimized UI
4. **Code Splitting**: Next.js automatic code splitting
5. **Edge-Ready**: Can be deployed to Vercel Edge Network

## Scalability Considerations

### Current Design (MVP)
- Single-region deployment
- Synchronous API calls
- No caching layer
- In-memory processing

### Future Scaling Path
1. Add Redis caching (reduce API calls)
2. Implement request queuing (handle rate limits)
3. Add CDN for static assets
4. Consider WebSocket for real-time updates
5. Database for user accounts and saved searches
6. Background jobs for batch analysis

## Use Cases

### Product Managers
- Validate product-market fit
- Time product launches
- Monitor competitor trends
- Identify seasonal patterns

### Marketers
- Optimize campaign timing
- Choose trending topics
- Platform selection
- Content strategy

### Researchers
- Market trend analysis
- Consumer behavior studies
- Cross-platform comparisons
- Historical trend analysis

### Entrepreneurs
- Market opportunity assessment
- Niche identification
- Demand validation
- Launch timing

## Future Roadmap

### Phase 1 (Current - MVP)
- ✅ Multi-platform data aggregation
- ✅ Unified visualization
- ✅ Lifecycle analysis
- ✅ Dark theme UI

### Phase 2 (Next)
- [ ] OpenAI-powered insights
- [ ] Export functionality (CSV, PDF)
- [ ] Comparative mode (multiple keywords)
- [ ] Email alerts

### Phase 3 (Advanced)
- [ ] User accounts and saved searches
- [ ] Historical baseline comparisons
- [ ] Sentiment analysis integration
- [ ] Custom dashboards

### Phase 4 (Enterprise)
- [ ] Team collaboration features
- [ ] API access
- [ ] White-label options
- [ ] Advanced analytics

## Deployment Options

### Vercel (Recommended)
- One-click deployment
- Automatic HTTPS
- Edge network
- Environment variable management
- Zero configuration

### Other Platforms
- Netlify
- AWS Amplify
- Railway
- Fly.io
- Docker (self-hosted)

## Success Metrics

1. **Data Coverage**: Percentage of queries with data from all 5 sources
2. **Response Time**: Average API response time < 3 seconds
3. **Accuracy**: Correlation with official platform analytics
4. **User Engagement**: Time on site, searches per session
5. **API Reliability**: Uptime and error rates

## Technical Debt & Known Limitations

### Current Limitations
1. TikTok API has 30-day window limit
2. No caching → repeated searches hit APIs again
3. No user accounts → can't save searches
4. Limited error recovery
5. Pushshift reliability issues

### Technical Debt
1. No test coverage yet
2. Some components could be extracted
3. Mock data integration incomplete
4. Could add loading skeletons
5. Accessibility improvements needed

## Development Best Practices

1. **Type Safety**: Strict TypeScript, no `any`
2. **Error Handling**: Try-catch + null returns
3. **Code Organization**: Adapter pattern, single responsibility
4. **Styling**: Tailwind utility classes, no inline styles
5. **Documentation**: JSDoc comments, README files

## Conclusion

Meta Trends Analyzer is a production-ready MVP that demonstrates:
- Modern full-stack architecture
- Clean code organization
- Extensible design patterns
- Professional UI/UX
- Real-world API integrations

The project is designed for easy enhancement and scaling, with clear separation of concerns and comprehensive documentation.

---

**Built by**: AI Assistant
**Stack**: Next.js 15 + TypeScript + Tailwind + Recharts
**License**: MIT

