# Analytics Setup Guide

This document explains how Google Analytics and Microsoft Clarity are configured in the Hiffi web application.

## Current Setup

### Google Analytics
- **Package**: `@next/third-parties` (Next.js official package)
- **Component**: `GoogleAnalytics` from `@next/third-parties/google`
- **Location**: `app/layout.tsx`
- **Environment Variable**: `NEXT_PUBLIC_GA_ID`

### Microsoft Clarity
- **Implementation**: Custom script injection via Next.js `Script` component
- **Location**: `app/layout.tsx` (in `<head>`)
- **Environment Variable**: `NEXT_PUBLIC_CLARITY_ID`

## Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Microsoft Clarity Project ID
NEXT_PUBLIC_CLARITY_ID=your-clarity-project-id
```

### How to Get Your IDs

#### Google Analytics
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property or select an existing one
3. Go to Admin → Data Streams
4. Select your web stream
5. Copy the Measurement ID (format: `G-XXXXXXXXXX`)

#### Microsoft Clarity
1. Go to [Microsoft Clarity](https://clarity.microsoft.com/)
2. Sign in with your Microsoft account
3. Create a new project
4. Add your website URL
5. Copy the Project ID from the setup instructions

## Implementation Details

### Google Analytics
- Uses Next.js official `GoogleAnalytics` component
- Automatically handles page views and events
- Only loads if `NEXT_PUBLIC_GA_ID` is set
- Placed in `<body>` for optimal loading

### Microsoft Clarity
- Uses Next.js `Script` component with `afterInteractive` strategy
- Injected in `<head>` section
- Only loads if `NEXT_PUBLIC_CLARITY_ID` is set
- Provides session recordings and heatmaps

## Verification

### Check if Analytics are Loading

1. **Google Analytics**:
   - Open browser DevTools → Network tab
   - Filter by "google-analytics" or "gtag"
   - You should see requests to `www.google-analytics.com` or `www.googletagmanager.com`

2. **Microsoft Clarity**:
   - Open browser DevTools → Network tab
   - Filter by "clarity"
   - You should see requests to `www.clarity.ms`

### Browser Extensions
- Use [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) for GA
- Check Microsoft Clarity dashboard for real-time visitors

## Production Deployment

Make sure to set these environment variables in your production environment:

- **Vercel**: Add in Project Settings → Environment Variables
- **Docker**: Add to `.env.local` or pass via `docker-compose.yml`
- **Other platforms**: Set as environment variables in your hosting platform

## Notes

- Both analytics tools only load if their respective environment variables are set
- This prevents errors in development if IDs are not configured
- The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- Never commit `.env.local` files to version control

