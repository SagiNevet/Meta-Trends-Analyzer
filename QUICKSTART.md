# 🚀 Quick Start Guide

Get your Meta Trends Analyzer up and running in 5 minutes!

## Prerequisites

✅ Node.js 18+ installed
✅ npm or yarn
✅ At least ONE API key (see below)

## 3-Step Setup

### 1️⃣ Install Dependencies

```bash
cd meta-trends-analyzer
npm install
```

### 2️⃣ Configure API Keys

Create `.env.local` in the project root:

```bash
# Minimum: Add at least ONE of these
SEARCHAPI_API_KEY=your_key_here        # Easiest to get - free tier available
# OR
# (Reddit works without a key)
```

**Quick API Key Options:**

| Service | Difficulty | Free Tier | Gets You |
|---------|-----------|-----------|----------|
| SearchAPI.io | ⭐ Easy | 100/month | Google + YouTube trends |
| Reddit | ⭐ Easiest | Unlimited | Reddit mentions (no key needed) |
| Pinterest | ⭐⭐ Medium | Yes | Pinterest trends |
| TikTok | ⭐⭐⭐⭐⭐ Hard | Requires approval | TikTok video data |

**Get SearchAPI.io key** (recommended for MVP):
1. Go to https://www.searchapi.io/
2. Sign up (free)
3. Copy API key from dashboard
4. Paste into `.env.local`

### 3️⃣ Start the App

```bash
npm run dev
```

Open http://localhost:3000 🎉

## First Search

1. Enter: "iPhone 16" (or any trending topic)
2. Select region: "US"
3. Time range: "Last 30 days"
4. Enable: Google Web + YouTube + Reddit
5. Click "🚀 Analyze Trends"

## Without API Keys

The app works even without API keys:

1. Start the app: `npm run dev`
2. Try a search with ALL sources DISABLED (just to see the UI)
3. Or enable only Reddit (works without a key)
4. You'll see warnings for missing API keys - this is expected!

## Troubleshooting

### ❌ "Missing API key" warnings
**Solution**: This is normal if you haven't added all API keys. The app works with any subset of APIs.

### ❌ `npm install` fails
**Solution**: Make sure Node.js 18+ is installed: `node --version`

### ❌ Port 3000 already in use
**Solution**: Kill the process or use a different port:
```bash
PORT=3001 npm run dev
```

### ❌ API returns errors
**Solution**: Check your API key is correct and has remaining quota

## Next Steps

✅ Working? Great! Now read:
- [README.md](./README.md) - Full documentation
- [SETUP.md](./SETUP.md) - Detailed API setup guide
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Architecture details

## Production Deployment

### Vercel (1-Click)

1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repo
4. Add environment variables in Vercel dashboard
5. Deploy!

## Need Help?

- 📖 Check [README.md](./README.md) for detailed docs
- 🐛 Found a bug? Check browser console for errors
- 🔑 API issues? Verify your keys in `.env.local`
- 💬 Questions? Check [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**You're all set!** Start analyzing trends across Google, YouTube, TikTok, Pinterest, and Reddit! 🎊

