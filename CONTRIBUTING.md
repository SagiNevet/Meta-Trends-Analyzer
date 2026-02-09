# Contributing to Meta Trends Analyzer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your API keys
4. Start the dev server: `npm run dev`

## Project Structure

```
meta-trends-analyzer/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── analyze/       # Main analysis endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main UI page
├── lib/                   # Shared libraries
│   ├── types.ts          # TypeScript types
│   ├── inputParsing.ts   # Query parsing
│   ├── googleTrends.ts   # Google Trends adapter
│   ├── tiktokTrends.ts   # TikTok adapter
│   ├── pinterestTrends.ts # Pinterest adapter
│   ├── redditMentions.ts # Reddit adapter
│   ├── normalize.ts      # Data normalization
│   ├── lifecycle.ts      # Trend analysis
│   └── mockData.ts       # Mock data for testing
└── ...config files
```

## Code Style

- **TypeScript**: Use strong typing, avoid `any` when possible
- **Formatting**: The project uses ESLint + Next.js defaults
- **Naming**: Use camelCase for variables/functions, PascalCase for types/components
- **Comments**: Add JSDoc comments for exported functions

## Adding a New Data Source

To add a new trend data source:

1. **Create an adapter** in `lib/yourSource.ts`:
   ```typescript
   export async function fetchYourSourceTrends(
     keyword: string,
     // ... other params
   ): Promise<TrendSeries | null> {
     // Implementation
   }
   ```

2. **Update types** in `lib/types.ts`:
   ```typescript
   export type TrendSource = 'google_web' | 'google_youtube' | 'tiktok' | 'pinterest' | 'reddit' | 'your_source';
   ```

3. **Add to API route** in `app/api/analyze/route.ts`:
   ```typescript
   if (body.enableYourSource) {
     promises.push(fetchYourSourceTrends(...));
   }
   ```

4. **Update UI** in `app/page.tsx`:
   - Add toggle chip
   - Add icon to `getSourceIcon()`
   - Update request type

5. **Add environment variable** to `.env.example`

6. **Document** in README.md

## Testing

Before submitting:

1. Test with real API keys (if available)
2. Test with missing API keys (should show warnings)
3. Test with various time ranges
4. Test with different regions
5. Run linter: `npm run lint`
6. Build successfully: `npm run build`

## API Adapter Guidelines

When creating adapters:

- **Defensive**: Check for missing API keys before calling
- **Error handling**: Wrap calls in try-catch, return `null` on error
- **Logging**: Use `console.warn` for missing keys, `console.error` for API errors
- **Type safety**: Define response types, validate before mapping
- **Normalization**: Convert to `TrendSeries` format consistently

Example:

```typescript
export async function fetchExampleTrends(
  keyword: string
): Promise<TrendSeries | null> {
  const apiKey = process.env.EXAMPLE_API_KEY;
  
  if (!apiKey) {
    console.warn('Example API disabled: missing EXAMPLE_API_KEY');
    return null;
  }

  try {
    const response = await fetch('https://api.example.com/trends', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to TrendSeries
    return {
      source: 'example',
      label: 'Example Trends',
      query: keyword,
      rawMetricName: 'interest_score',
      points: data.points.map(p => ({
        timestamp: p.time,
        value: p.score
      })),
      extra: { /* additional data */ }
    };
  } catch (error) {
    console.error('Error fetching Example trends:', error);
    return null;
  }
}
```

## UI/UX Guidelines

- **Dark theme**: Use purple/pink gradients for accents
- **Performance**: Keep chart rendering smooth, limit data points if needed
- **Responsiveness**: Test on mobile and desktop
- **Loading states**: Always show loading indicators for async operations
- **Error messages**: User-friendly, actionable error messages

## Submitting Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages: `git commit -m "Add: brief description"`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request with:
   - Clear description of changes
   - Screenshots (for UI changes)
   - Testing notes
   - Any breaking changes

## Enhancement Ideas

Here are some areas that could use improvement:

- [ ] Add caching layer (Redis) for API responses
- [ ] Implement OpenAI analysis feature
- [ ] Add export functionality (CSV, PDF)
- [ ] Create comparative mode (multiple keywords side-by-side)
- [ ] Add sentiment analysis
- [ ] Implement user accounts and saved searches
- [ ] Add webhook/alert system for trend changes
- [ ] Improve mobile UI
- [ ] Add data visualization options (bar charts, area charts)
- [ ] Create admin dashboard for API usage monitoring

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Documentation improvements
- General questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

