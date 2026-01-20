# Environment Variables Setup

Copy this template to `.env.local` and fill in your values.

```env
# ============================================
# SUPABASE (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ============================================
# AI PROVIDERS (Choose at least one)
# ============================================

# OpenAI (Recommended for Nova)
OPENAI_API_KEY=sk-...

# OR Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# ============================================
# MARKET DATA (Phase 5)
# ============================================

# Twelve Data - https://twelvedata.com/
# Free tier: 800 API calls/day, 8 calls/minute
TWELVE_DATA_API_KEY=your-twelve-data-key

# ============================================
# NEWS APIs (Phase 7)
# ============================================

# NewsAPI.org - https://newsapi.org/
# Free tier: 100 requests/day
NEWS_API_KEY=your-newsapi-key

# ============================================
# WEATHER (Phase 8)
# ============================================

# OpenWeatherMap - https://openweathermap.org/api
# Free tier: 1000 calls/day
OPENWEATHERMAP_API_KEY=your-openweathermap-key

# ============================================
# OPTIONAL SERVICES
# ============================================

# Vercel Analytics (if deploying to Vercel)
# NEXT_PUBLIC_ANALYTICS_ID=

# Error Tracking (e.g., Sentry)
# SENTRY_DSN=
```

## Getting API Keys

### Supabase (Required)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy the URL and anon/public key

### OpenAI (Recommended)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add billing
3. Generate an API key
4. Recommended model: `gpt-4-turbo-preview`

### Twelve Data (Market Data)
1. Go to [twelvedata.com](https://twelvedata.com)
2. Sign up for free account
3. Get API key from dashboard
4. Free tier supports 800 calls/day

### NewsAPI (News)
1. Go to [newsapi.org](https://newsapi.org)
2. Register for free developer account
3. Get API key
4. Free tier: 100 requests/day

### OpenWeatherMap (Weather)
1. Go to [openweathermap.org](https://openweathermap.org)
2. Create free account
3. Generate API key
4. Free tier: 1000 calls/day

## Rate Limits Summary

| Service | Free Tier Limit | Recommended Usage |
|---------|----------------|-------------------|
| OpenAI | Pay per use | ~$20-50/month typical |
| Twelve Data | 800/day | Poll every 30 seconds |
| NewsAPI | 100/day | Cache aggressively |
| OpenWeatherMap | 1000/day | Poll every 30 minutes |

## Production Considerations

1. **API Key Security**: Never commit `.env.local` to git
2. **Rate Limiting**: Implement caching to stay within limits
3. **Fallbacks**: Have mock data for when APIs are unavailable
4. **Monitoring**: Track API usage to avoid unexpected costs
