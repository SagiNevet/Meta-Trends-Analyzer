# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- API keys from the services you want to use

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your API keys:

```env
SEARCHAPI_API_KEY=your_actual_key_here
TIKTOK_ACCESS_TOKEN=your_actual_token_here
PINTEREST_ACCESS_TOKEN=your_actual_token_here
# ... etc
```

### 3. Test the Setup

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Verify API Connections

Try a search with only the APIs you've configured enabled. The app will show warnings for any missing API keys.

## Obtaining API Keys

### SearchAPI.io (Google Trends)

**Required for**: Google Web Search + YouTube Trends

1. Go to [SearchAPI.io](https://www.searchapi.io/)
2. Sign up for an account (free tier available)
3. Go to Dashboard → API Key
4. Copy the key to your `.env.local` as `SEARCHAPI_API_KEY`

**Cost**: Free tier includes 100 searches/month

### TikTok Research API

**Required for**: TikTok video analytics

⚠️ **Important**: TikTok Research API requires approval and is primarily available for academic/research purposes.

1. Apply at [TikTok Developers](https://developers.tiktok.com/)
2. Complete the Research API application form
3. Wait for approval (can take several weeks)
4. Once approved, create an app and generate OAuth credentials
5. Add to `.env.local`:
   - `TIKTOK_CLIENT_KEY`
   - `TIKTOK_CLIENT_SECRET`
   - `TIKTOK_ACCESS_TOKEN`

**Alternative**: For MVP/demo purposes, you can leave TikTok disabled.

### Pinterest Trends API

**Required for**: Pinterest trending keywords

1. Go to [Pinterest Developers](https://developers.pinterest.com/)
2. Create a new app
3. Generate an access token with appropriate scopes
4. Add to `.env.local` as `PINTEREST_ACCESS_TOKEN`

**Cost**: Free tier available

### Reddit (Pushshift)

**Required for**: Reddit mentions over time

The Pushshift API is publicly accessible and typically doesn't require a key. If you're using a private instance that requires authentication, add `PUSHSHIFT_API_KEY` to your `.env.local`.

**Note**: Pushshift has been intermittently unavailable. Consider implementing fallback to Reddit's official API if needed.

## Minimum Viable Setup

For a working demo, you only need **ONE** of the following:

- `SEARCHAPI_API_KEY` (easiest to obtain, covers 2 sources: Google Web + YouTube)
- Reddit (works without any key)

The app is designed to work with any combination of available APIs.

## Testing Without API Keys

The app handles missing API keys gracefully:

1. Start the app without any keys in `.env.local`
2. Try a search with all sources disabled
3. The UI will show warnings explaining which APIs are unavailable
4. Add keys one at a time and test each source

## Troubleshooting

### "Missing API Key" warnings

- Check that `.env.local` exists in the project root
- Verify the key names match exactly (e.g., `SEARCHAPI_API_KEY`, not `SEARCHAPI_KEY`)
- Restart the dev server after adding new keys

### API errors (401, 403)

- Verify your API keys are valid and not expired
- Check that your API account has sufficient credits/quota
- Review the API provider's dashboard for rate limit status

### TikTok "30-day limit" warning

- This is expected behavior due to TikTok API limitations
- Choose time ranges ≤ 30 days or accept the automatic clamping

### No data returned

- Try a more common/popular keyword
- Adjust the time range (some platforms have limited historical data)
- Check the region setting (some keywords are region-specific)

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed to:

- Netlify
- AWS Amplify
- Railway
- Fly.io
- Self-hosted (Docker)

Make sure to set environment variables in your hosting platform's dashboard.

## Security Notes

⚠️ **Never commit `.env.local` or any file containing actual API keys to version control!**

- `.env.local` is already in `.gitignore`
- Only commit `.env.example` with placeholder values
- Use your hosting platform's secret management for production

---

Need help? Check the main [README.md](./README.md) for more details.

