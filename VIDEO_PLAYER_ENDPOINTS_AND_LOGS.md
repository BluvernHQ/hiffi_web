# Video Player Page - API Endpoints & Console Logs

## Overview

This document details all API endpoints hit in the video player page and the console logs that help track button states (following, upvoted, downvoted).

## Button Behavior Strategy

### ✅ Current Implementation

**On Page Load:**
- Fetch initial state from `/videos/{videoID}` endpoint
- Set button states based on API response: `following`, `upvoted`, `downvoted`
- Console logs show the initial values received

**On Button Click:**
- **Optimistic update** - Update UI immediately for better UX
- Make API call (follow/unfollow/upvote/downvote)
- **No instant refresh** - State persists until page reload
- Console logs show the optimistic updates

**On Page Reload:**
- Fresh state fetched from `/videos/{videoID}` endpoint
- UI syncs with server state
- Ensures consistency across sessions

## API Endpoints Hit

### 1. Initial Page Load

#### 1.1 Get Video Data
```
🔄 ENDPOINT HIT: GET /videos/{videoID}
```
**Purpose:** Get video streaming URL and initial button states
**Returns:**
```json
{
  "success": true,
  "data": {
    "video_url": "https://...",
    "upvoted": false,     ← Used for upvote button
    "downvoted": false,   ← Used for downvote button
    "following": true     ← Used for follow button
  }
}
```
**Console Logs:**
```
[hiffi] 🔄 ENDPOINT HIT: GET /videos/{videoID}
[hiffi] ✅ Video response from API: {success: true, video_url: "...", ...}
[hiffi] 📊 Button states received from API: {upvoted: false, downvoted: false, following: true}
[hiffi] 🎯 Setting initial button states: {upvoted: false, downvoted: false, following: true}
[hiffi] 👤 Setting follow state: true
```

#### 1.2 Get Video Metadata
```
🔄 ENDPOINT HIT: GET /videos/list?page={page}&limit={limit}&seed={seed}
```
**Purpose:** Get video title, description, views, creator info, related videos
**Multiple calls:** Pages 1-5 until video found or end reached
**Console Logs:**
```
[hiffi] 🔄 ENDPOINT HIT: GET /videos/list?page=1&limit=50&seed=abc123
[hiffi] ✅ Got 50 videos from page 1
[hiffi] 🔄 ENDPOINT HIT: GET /videos/list?page=2&limit=50&seed=abc123
[hiffi] ✅ Got 45 videos from page 2
```

#### 1.3 Get Video Creator Data
```
🔄 ENDPOINT HIT: GET /users/{username}
```
**Purpose:** Get creator's follower count, profile info
**Only if:** User is logged in (requires authentication)
**Console Logs:**
```
[hiffi] 🔄 ENDPOINT HIT: GET /users/{username}
[hiffi] ✅ Creator data from API: {success: true, user: {...}}
[hiffi] Creator profile: {username: "...", followers: 1234, ...}
[hiffi] Creator followers: 1234
```

### 2. Upvote Button Click

#### 2.1 Upvote/Remove Upvote
```
🔄 ENDPOINT HIT: POST /social/videos/upvote/{videoID}
```
**Purpose:** Toggle upvote on video
**Behavior:** 
- If not upvoted → Upvote
- If already upvoted → Remove upvote
- If downvoted → Remove downvote and add upvote

**Console Logs:**
```
[hiffi] 🔄 ENDPOINT HIT: POST /social/videos/upvote/{videoID}
[hiffi] ✅ Upvote API call successful
[hiffi] 🔄 Optimistic update: {wasLiked: false, wasDisliked: false, newLikedState: true, newDislikedState: false}
```

**No Refresh:** State will sync on next page load

### 3. Downvote Button Click

#### 3.1 Downvote/Remove Downvote
```
🔄 ENDPOINT HIT: POST /social/videos/downvote/{videoID}
```
**Purpose:** Toggle downvote on video
**Behavior:**
- If not downvoted → Downvote
- If already downvoted → Remove downvote
- If upvoted → Remove upvote and add downvote

**Console Logs:**
```
[hiffi] 🔄 ENDPOINT HIT: POST /social/videos/downvote/{videoID}
[hiffi] ✅ Downvote API call successful
[hiffi] 🔄 Optimistic update: {wasLiked: false, wasDisliked: false, newLikedState: false, newDislikedState: true}
```

**No Refresh:** State will sync on next page load

### 4. Follow Button Click

#### 4.1 Follow User
```
🔄 ENDPOINT HIT: POST /social/users/follow/{username}
```
**Purpose:** Follow the video creator
**Console Logs:**
```
[hiffi] 🔄 Optimistic update - Follow state: {previousFollowingState: false, newFollowingState: true}
[hiffi] 🔄 ENDPOINT HIT: POST /social/users/follow/{username}
[hiffi] ✅ Follow API call successful
```

#### 4.2 Refresh Creator Data (After Follow)
```
🔄 ENDPOINT HIT: GET /users/{username} (refreshing after follow)
```
**Purpose:** Get updated follower count
**Console Logs:**
```
[hiffi] 🔄 ENDPOINT HIT: GET /users/{username} (refreshing after follow)
[hiffi] ✅ Refreshed creator data after follow: {success: true, user: {...}}
```

#### 4.3 Unfollow User
```
🔄 ENDPOINT HIT: POST /social/users/unfollow/{username}
```
**Purpose:** Unfollow the video creator
**Console Logs:**
```
[hiffi] 🔄 Optimistic update - Follow state: {previousFollowingState: true, newFollowingState: false}
[hiffi] 🔄 ENDPOINT HIT: POST /social/users/unfollow/{username}
[hiffi] ✅ Unfollow API call successful
```

#### 4.4 Refresh Creator Data (After Unfollow)
```
🔄 ENDPOINT HIT: GET /users/{username} (refreshing after unfollow)
```
**Purpose:** Get updated follower count
**Console Logs:**
```
[hiffi] 🔄 ENDPOINT HIT: GET /users/{username} (refreshing after unfollow)
[hiffi] ✅ Refreshed creator data after unfollow: {success: true, user: {...}}
```

**No State Refresh:** Follow button state will sync on next page load via `/videos/{videoID}`

## Complete Endpoint Summary

### On Page Load (First Time)
1. `GET /videos/{videoID}` - Get streaming URL + button states
2. `GET /videos/list` (multiple pages) - Get video metadata
3. `GET /users/{username}` - Get creator data (if logged in)

**Total: 3-8 API calls** (depending on how many video list pages needed)

### On Upvote Click
1. `POST /social/videos/upvote/{videoID}` - Toggle upvote

**Total: 1 API call**

### On Downvote Click
1. `POST /social/videos/downvote/{videoID}` - Toggle downvote

**Total: 1 API call**

### On Follow Click
1. `POST /social/users/follow/{username}` - Follow user
2. `GET /users/{username}` - Refresh follower count

**Total: 2 API calls**

### On Unfollow Click
1. `POST /social/users/unfollow/{username}` - Unfollow user
2. `GET /users/{username}` - Refresh follower count

**Total: 2 API calls**

## Button State Tracking

### Console Log Pattern

**Initial State (Page Load):**
```
[hiffi] 📊 Button states received from API:
  ├─ upvoted: false/true
  ├─ downvoted: false/true
  └─ following: false/true
```

**Optimistic Updates (Button Clicks):**
```
[hiffi] 🔄 Optimistic update:
  ├─ Previous state: {...}
  └─ New state: {...}
```

**API Calls:**
```
[hiffi] 🔄 ENDPOINT HIT: POST/GET /endpoint/path
[hiffi] ✅ API call successful / Error message
```

## How to Verify Button States

### 1. Check Initial State on Page Load
Look for these console logs:
```
[hiffi] 📊 Button states received from API: {upvoted: false, downvoted: false, following: true}
```

This shows what the server says about your interaction with this video.

### 2. Check Optimistic Updates on Button Click
Look for these console logs:
```
[hiffi] 🔄 Optimistic update: {wasLiked: false, newLikedState: true}
```

This shows the UI updating immediately before the API call completes.

### 3. Verify API Calls
Look for these console logs:
```
[hiffi] 🔄 ENDPOINT HIT: POST /social/videos/upvote/{videoID}
[hiffi] ✅ Upvote API call successful
```

This confirms the API call was made and succeeded.

### 4. Check State on Page Reload
Reload the page and check the initial state logs again. The state should match your last action.

## Troubleshooting

### Problem: Button doesn't toggle
**Check console for:**
1. Initial state logs - Is the correct state being loaded?
2. Optimistic update logs - Is the state updating locally?
3. API call logs - Is the API call succeeding?

### Problem: State resets after page reload
**Check console for:**
1. Initial state logs on reload - What state is the server returning?
2. The `/videos/{videoID}` endpoint response - Does it include `upvoted`, `downvoted`, `following`?

### Problem: Multiple button clicks don't work
**Check console for:**
1. Double-click protection - Are multiple API calls being prevented?
2. API errors - Is the server rejecting the requests?

## Key Points

1. **Initial state comes from `/videos/{videoID}`** - This is the source of truth on page load
2. **Optimistic updates for better UX** - UI updates immediately on button click
3. **No instant refresh** - State persists until page reload
4. **Console logs track everything** - Use them to debug button issues
5. **Server state syncs on reload** - Ensures consistency across sessions

## Testing Checklist

- [ ] Check console logs show initial button states on page load
- [ ] Click upvote - Console shows optimistic update and API call
- [ ] Click downvote - Console shows optimistic update and API call
- [ ] Click follow - Console shows optimistic update and API calls (2)
- [ ] Reload page - Initial state matches last action
- [ ] All button states (upvoted, downvoted, following) are correctly logged
- [ ] No errors in console during button clicks
