# Meta Trends Analyzer 🚀

A full-stack Next.js application that provides unified trend analysis across 5 major platforms: Google Trends (Web + YouTube), TikTok, Pinterest, and Reddit.

![Meta Trends Analyzer](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwind-css)

## 🌟 Features

- **Unified Search Interface**: Single search box to query trends across multiple platforms
- **5 Data Sources**:
  - 🔍 Google Web Search Trends
  - 📺 YouTube Search Trends
  - 🎵 TikTok Video Analytics
  - 📌 Pinterest Trending Keywords
  - 🤖 Reddit Mentions
- **Futuristic Dark UI**: Modern, low-attention-span optimized interface
- **Interactive Charts**: Real-time visualization using Recharts
- **Lifecycle Analysis**: Automatic trend classification (Rising, Peak, Declining, Stable)
- **Global Insights**: Cross-platform trend comparison
- **Flexible Time Ranges**: 7 days to 5+ years
- **Region Support**: Analyze trends by country/region

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **APIs**:
  - SearchAPI.io (Google Trends)
  - TikTok Research API
  - Pinterest Trends API
  - Pushshift Reddit API

## 📦 Installation

1. **Clone the repository** (or navigate to the project folder):
   ```bash
   cd meta-trends-analyzer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env.local` file in the root directory:
   
   ```env
   # SearchAPI.io for Google Trends
   SEARCHAPI_API_KEY=your_searchapi_key_here

   # TikTok Research API
   TIKTOK_CLIENT_KEY=your_tiktok_client_key
   TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
   TIKTOK_ACCESS_TOKEN=your_tiktok_access_token

   # Pinterest API
   PINTEREST_ACCESS_TOKEN=your_pinterest_access_token

   # Pushshift Reddit API (optional)
   PUSHSHIFT_API_KEY=your_pushshift_key_if_needed

   # OpenAI (for future AI analysis - optional)
   OPENAI_API_KEY=your_openai_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 API Keys Setup

### Google Trends (via SearchAPI.io)

1. Sign up at [SearchAPI.io](https://www.searchapi.io/)
2. Get your API key from the dashboard
3. Add to `.env.local` as `SEARCHAPI_API_KEY`

### TikTok Research API

1. Apply for TikTok Research API access at [TikTok Developers](https://developers.tiktok.com/)
2. Create an app and obtain credentials
3. Get an access token (OAuth 2.0)
4. Add credentials to `.env.local`

**Note**: TikTok Research API has a 30-day window limit per query.

### Pinterest Trends API

1. Create a Pinterest app at [Pinterest Developers](https://developers.pinterest.com/)
2. Generate an access token with `boards:read` and `pins:read` scopes
3. Add to `.env.local` as `PINTEREST_ACCESS_TOKEN`

### Reddit (Pushshift)

1. The Pushshift API is publicly accessible
2. Some instances may require an API key
3. Add to `.env.local` if needed: `PUSHSHIFT_API_KEY`

## 🎯 Usage

1. **Enter a search query**: Type any product, topic, or keyword (e.g., "iPhone 16", "electric cars")

2. **Select region**: Choose a country code (US, GB, CA, etc.)

3. **Choose time range**:
   - Last 7 days
   - Last 30 days
   - Last 12 months
   - Last 5 years
   - All time

4. **Toggle data sources**: Enable/disable specific platforms

5. **Advanced options** (optional):
   - Pinterest interest category
   - Pinterest trend type

6. **Click "Analyze Trends"**: View results across all enabled platforms

## 📊 Architecture

```
meta-trends-analyzer/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Main API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main UI page
├── lib/
│   ├── types.ts                  # TypeScript type definitions
│   ├── inputParsing.ts           # Query parsing logic
│   ├── googleTrends.ts           # Google Trends adapter
│   ├── tiktokTrends.ts           # TikTok adapter
│   ├── pinterestTrends.ts        # Pinterest adapter
│   ├── redditMentions.ts         # Reddit adapter
│   ├── normalize.ts              # Data normalization utilities
│   └── lifecycle.ts              # Trend lifecycle analysis
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔄 Data Flow

1. **User Input** → Parsed and normalized by `inputParsing.ts`
2. **API Orchestration** → `/api/analyze` endpoint calls enabled adapters in parallel
3. **External APIs** → Each adapter fetches data from its respective service
4. **Normalization** → Raw data transformed into unified `TrendSeries` format
5. **Lifecycle Analysis** → Automatic trend classification
6. **Visualization** → Recharts renders interactive line charts
7. **Insights** → Cross-platform analysis and recommendations

## 🎨 UI Features

### Search Interface
- Large, glowing input field with futuristic styling
- Region and time range selectors
- Toggle chips for each data source
- Collapsible advanced options

### Trend Cards
- One card per enabled API source
- Interactive line charts (Recharts)
- Lifecycle badges (Rising, Peak, Declining, Stable)
- Color-coded status indicators
- Detailed metric descriptions

### Global Insights
- Cross-platform trend comparison
- Strongest rising/declining source identification
- Overall trend summary

### Dark Theme
- Purple/pink gradient accents
- Glassmorphism effects
- Smooth transitions and hover states
- Responsive design

## 🛠️ Development

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
npm start
```

### Lint code:
```bash
npm run lint
```

## 🚧 Limitations & Notes

1. **TikTok API**: Maximum 30-day window per request. Longer ranges are automatically clamped.
2. **API Rate Limits**: Each service has its own rate limits. The app handles errors gracefully.
3. **API Keys Required**: Without valid API keys, respective sources will be disabled.
4. **Data Availability**: Not all keywords will have data on all platforms.

## 🔮 Future Enhancements

- [ ] OpenAI-powered market lifecycle analysis
- [ ] Export trends to CSV/PDF
- [ ] Comparative mode (compare multiple keywords)
- [ ] Historical baseline comparisons
- [ ] Email alerts for significant trend changes
- [ ] Custom dashboard layouts
- [ ] Sentiment analysis integration
- [ ] Multi-language support

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SEARCHAPI_API_KEY` | Yes* | SearchAPI.io key for Google Trends |
| `TIKTOK_ACCESS_TOKEN` | Yes* | TikTok Research API access token |
| `PINTEREST_ACCESS_TOKEN` | Yes* | Pinterest API access token |
| `PUSHSHIFT_API_KEY` | No | Reddit Pushshift API key (optional) |
| `OPENAI_API_KEY` | No | OpenAI API key for future AI features |

*Required only if you want to use that specific data source

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙋 Support

For issues or questions:
1. Check API key configuration in `.env.local`
2. Verify API credentials are valid and have proper permissions
3. Check browser console for detailed error messages
4. Review API provider documentation for rate limits and requirements

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

