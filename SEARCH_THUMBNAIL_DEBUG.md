# Search Thumbnail Debugging Guide

## Issue
Thumbnails not displaying in search results - showing placeholder icons instead.

## Possible Causes

### 1. API Response Missing `video_thumbnail` Field

The search API might not be returning the `video_thumbnail` field in the response.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "video_id": "abc123...",
        "video_thumbnail": "thumbnails/videos/abc123.jpg",  // ← This field is required
        "video_title": "Video Title"
      }
    ]
  }
}
```

**If Missing:** The code will fallback to constructing URL from `video_id`

### 2. Incorrect Fallback URL

**Fixed in latest update:**
- ❌ Before: `https://black-paper-83cf.hiffi.workers.dev/{videoId}`
- ✅ After: `https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/{videoId}.jpg`

---

## Debugging Steps

### Step 1: Check Console Logs

After searching, look for these logs in browser console:

```
[API] searchVideos response: { count: X, videos: X, firstVideo: {...} }
[VideoCard] No thumbnail field, using fallback for videoId: abc123...
[VideoCard] Fallback URL: https://...
[hiffi] Fetching thumbnail from Workers: https://...
[hiffi] Using API key: SECR...
```

### Step 2: Verify API Response

**Test the search API directly:**

```bash
curl -X GET "https://beta.hiffi.com/api/search/videos/hiphop" \
  -H "Content-Type: application/json"
```

**Check if response includes `video_thumbnail` field for each video.**

### Step 3: Test Thumbnail URL Directly

```bash
# Test if thumbnail exists
curl -I "https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/{VIDEO_ID}.jpg" \
  -H "x-api-key: SECRET_KEY"
```

**Expected:** HTTP 200 with image content
**If 404:** Thumbnail doesn't exist on server
**If 403:** API key is wrong

---

## Recent Changes

### 1. Added Debugging Logs

**File:** `lib/api-client.ts`
- Now logs search API response structure
- Shows first video's fields including `video_thumbnail`

### 2. Fixed Fallback URL

**File:** `components/video/video-card.tsx`
- Changed fallback from `/{videoId}` to `/thumbnails/videos/{videoId}.jpg`
- Added logging when fallback is used

### 3. Enhanced AuthenticatedImage Logging

**File:** `components/video/authenticated-image.tsx`
- Already logs: "Fetching thumbnail from Workers: {url}"
- Already logs: "Using API key: SECR..."
- Already logs errors with details

---

## Quick Fix Options

### Option 1: If API Doesn't Return `video_thumbnail`

The fallback URL is now correct, so thumbnails should work if they exist on the server.

### Option 2: If Thumbnails Don't Exist on Server

Backend needs to ensure thumbnails are generated and stored at:
```
thumbnails/videos/{video_id}.jpg
```

### Option 3: If API Key is Wrong

Update the environment variable:
```bash
# .env.local
NEXT_PUBLIC_WORKERS_API_KEY=your-correct-api-key
```

---

## Testing Instructions

1. **Clear browser console**
2. **Search for "hiphop"** in the app
3. **Check console for logs:**
   - `[API] searchVideos response` - See if `video_thumbnail` field exists
   - `[VideoCard] No thumbnail field` - Indicates fallback being used
   - `[hiffi] Fetching thumbnail` - Shows actual URL being fetched
   - `[hiffi] Failed to fetch` - Shows error if fetch fails

4. **Check Network tab:**
   - Look for requests to `black-paper-83cf.hiffi.workers.dev`
   - Check if they return 200 or 404/403
   - Verify `x-api-key` header is present

---

## Expected Console Output

### Success Case:
```
[API] searchVideos response: { count: 2, videos: 2, firstVideo: { video_id: "abc...", video_thumbnail: "thumbnails/videos/abc.jpg", video_title: "..." } }
[hiffi] Fetching thumbnail from Workers: https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/abc.jpg
[hiffi] Using API key: SECR...
```

### Fallback Case (No thumbnail field):
```
[API] searchVideos response: { count: 2, videos: 2, firstVideo: { video_id: "abc...", video_thumbnail: undefined, video_title: "..." } }
[VideoCard] No thumbnail field, using fallback for videoId: abc...
[VideoCard] Fallback URL: https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/abc.jpg
[hiffi] Fetching thumbnail from Workers: https://black-paper-83cf.hiffi.workers.dev/thumbnails/videos/abc.jpg
[hiffi] Using API key: SECR...
```

### Error Case:
```
[hiffi] Fetch failed with status: 404 Not Found
[hiffi] Failed to fetch authenticated image: Error: Failed to fetch image: 404 Not Found
```

---

## Next Steps

1. **Search for something** and **check console logs**
2. **Copy the thumbnail URL** from console
3. **Test it directly** in browser with dev tools Network tab
4. **Check the response** (200? 404? 403?)
5. **Verify x-api-key header** is being sent

---

## Files Modified

- ✅ `lib/api-client.ts` - Added response logging
- ✅ `components/video/video-card.tsx` - Fixed fallback URL + added logging
- ✅ `components/video/authenticated-image.tsx` - Already has comprehensive logging
