# Thumbnail Authentication Setup

## Overview
Thumbnails are fetched from Cloudflare Workers and require authentication via the `x-api-key` header.

## Configuration

### Base URL
```
https://black-paper-83cf.hiffi.workers.dev
```

### Thumbnail URL Format
```
https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/{videoId}.jpg
```

### API Key Header
All requests to Workers must include:
```
x-api-key: SECRET_KEY
```

## Implementation

### 1. Storage Helper (`lib/storage.ts`)

#### `getThumbnailUrl(thumbnailPath)`
Constructs the full thumbnail URL from the API path:

```typescript
// Input: "thumbnails/videos/abc123.jpg"
// Output: "https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/abc123.jpg"
export function getThumbnailUrl(thumbnailPath: string): string {
  if (!thumbnailPath) return ""
  
  // If already a full URL, return as-is
  if (thumbnailPath.startsWith(`${WORKERS_BASE_URL}/`)) {
    return thumbnailPath
  }
  
  // Construct Workers URL
  return `${WORKERS_BASE_URL}/${thumbnailPath}`
}
```

#### `getWorkersApiKey()`
Gets the API key from environment or uses default:

```typescript
export function getWorkersApiKey(): string {
  // Uses NEXT_PUBLIC_WORKERS_API_KEY env var or defaults to "SECRET_KEY"
  return process.env.NEXT_PUBLIC_WORKERS_API_KEY || "SECRET_KEY"
}
```

### 2. Authenticated Image Component (`components/video/authenticated-image.tsx`)

The `AuthenticatedImage` component handles thumbnail fetching with authentication:

**Key Features:**
- ✅ Automatically adds `x-api-key` header to all Workers requests
- ✅ Fetches images as blobs and creates object URLs
- ✅ Handles loading states with skeleton
- ✅ Shows error states if fetch fails
- ✅ Properly cleans up blob URLs to prevent memory leaks

**Usage:**
```typescript
<AuthenticatedImage
  src={getThumbnailUrl(video.video_thumbnail)}
  alt={video.video_title}
  fill
  className="object-cover"
  priority={true}
/>
```

### 3. Video Card Component (`components/video/video-card.tsx`)

Video cards automatically use `AuthenticatedImage` for thumbnails:

```typescript
const thumbnailUrl = thumbnail
  ? getThumbnailUrl(thumbnail)
  : `${WORKERS_BASE_URL}/${videoId}`

return (
  <AuthenticatedImage
    src={thumbnailUrl}
    alt={title}
    fill
    className="object-cover"
  />
)
```

## How It Works

### Flow Diagram
```
1. API returns video data
   └─> video_thumbnail: "thumbnails/videos/{videoId}.jpg"

2. getThumbnailUrl() constructs full URL
   └─> "https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/{videoId}.jpg"

3. AuthenticatedImage component fetches with headers
   └─> GET with headers: { 'x-api-key': 'SECRET_KEY' }

4. Creates blob URL and displays
   └─> blob:http://localhost:3000/abc-123...
```

### Authentication Process

```typescript
// 1. Detect Workers URL
const isWorkersUrl = src.startsWith(WORKERS_BASE_URL)

// 2. Fetch with authentication header
const response = await fetch(src, {
  headers: {
    'x-api-key': getWorkersApiKey(), // "SECRET_KEY"
  },
  mode: 'cors',
  credentials: 'omit',
})

// 3. Convert to blob and create object URL
const blob = await response.blob()
const blobUrl = URL.createObjectURL(blob)

// 4. Use blob URL in Image component
<Image src={blobUrl} ... />
```

## Environment Variables

### Development (.env.local)
```bash
NEXT_PUBLIC_WORKERS_API_KEY=SECRET_KEY
```

### Production
Set in your hosting platform's environment variables:
```bash
NEXT_PUBLIC_WORKERS_API_KEY=your_production_key_here
```

## API Response Format

### Video List Response
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "video": {
          "video_id": "abc123...",
          "video_thumbnail": "thumbnails/videos/abc123.jpg",
          "video_title": "My Video",
          ...
        },
        "following": false
      }
    ]
  }
}
```

### Search Videos Response
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "video_id": "abc123...",
        "video_thumbnail": "thumbnails/videos/abc123.jpg",
        "video_title": "My Video",
        ...
      }
    ],
    "count": 10
  }
}
```

## Components Using Thumbnails

| Component | Uses AuthenticatedImage | Location |
|-----------|------------------------|----------|
| VideoCard | ✅ Yes | `components/video/video-card.tsx` |
| VideoGrid | ✅ Yes (via VideoCard) | `components/video/video-grid.tsx` |
| SearchOverlay | ✅ Yes | `components/search/search-overlay.tsx` |
| SearchPage | ✅ Yes (via VideoGrid) | `app/search/page.tsx` |

## Troubleshooting

### Thumbnails Not Loading

**Check 1: API Key**
```typescript
console.log('API Key:', getWorkersApiKey())
// Should output: "SECRET_KEY" or your custom key
```

**Check 2: CORS Headers**
Workers must return these headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: x-api-key, content-type
```

**Check 3: URL Format**
```typescript
console.log('Thumbnail URL:', getThumbnailUrl(video.video_thumbnail))
// Should output: "https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/{videoId}.jpg"
```

**Check 4: Network Tab**
- Open browser DevTools → Network tab
- Filter by "thumbnails"
- Check request headers include `x-api-key: SECRET_KEY`
- Check response status is `200 OK`

### Common Issues

1. **403 Forbidden**: API key missing or incorrect
2. **CORS Error**: Workers not configured for CORS
3. **404 Not Found**: Thumbnail doesn't exist or wrong URL format
4. **Loading Forever**: Check console for errors

## Testing

### Manual Test
1. Open any page with videos (home, search, profile)
2. Open DevTools → Network tab
3. Filter by "thumbnails"
4. Check request includes `x-api-key` header
5. Verify thumbnails load correctly

### Test Cases
- ✅ Home page video thumbnails
- ✅ Search results video thumbnails  
- ✅ Profile page video thumbnails
- ✅ Video player related videos
- ✅ Search overlay quick results

## Security Notes

1. **API Key in Client**: The `x-api-key` is exposed in client-side code. This is acceptable for read-only public content.
2. **Environment Variables**: Use `NEXT_PUBLIC_` prefix for client-side variables.
3. **Rate Limiting**: Consider implementing rate limiting on Workers side.
4. **Key Rotation**: Plan for periodic API key rotation if needed.

## Summary

✅ **Everything is already configured!**

- Thumbnails use proper authentication
- `x-api-key` header is automatically added
- All video components use `AuthenticatedImage`
- Search results display thumbnails correctly
- Blob URLs prevent memory leaks
- Error handling is in place

No changes needed - the implementation is complete and follows best practices! 🎉
