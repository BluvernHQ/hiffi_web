# Video Playback Issues - Todo List

## Current Technology Stack
- **Video Format**: MP4 (progressive streaming via HTTP Range requests)
- **Not using**: HLS (.m3u8) or DASH (.mpd)
- **Streaming**: Direct MP4 streaming with Range request support
- **Proxy**: Next.js route handler (`/proxy/video/stream`) that proxies to Workers/CDN

---

## Frontend Responsibilities (React/Next.js/TypeScript)

### 1. Page Visibility API Implementation ⚠️ CRITICAL
**Issues Fixed**: #45, #46, #47, #48, #49

**Tasks**:
- [ ] Add `visibilitychange` event listener to detect tab visibility
- [ ] Pause video when tab becomes hidden (browser already does this, but need to track state)
- [ ] Resume video when tab becomes visible (if it was playing before)
- [ ] Save playback state before tab becomes hidden
- [ ] Restore playback state when tab becomes visible
- [ ] Handle edge cases: video ended, paused by user, etc.

**Files to Modify**:
- `components/video/video-player.tsx`

**Implementation Notes**:
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab hidden - save state
      if (videoRef.current) {
        // Browser will pause automatically, just track it
        wasPlayingBeforeHidden.current = !videoRef.current.paused
      }
    } else {
      // Tab visible - restore if was playing
      if (wasPlayingBeforeHidden.current && videoRef.current) {
        videoRef.current.play().catch(console.error)
      }
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [])
```

---

### 2. Browser Navigation Handling ⚠️ CRITICAL
**Issues Fixed**: #48, #49

**Tasks**:
- [ ] Detect browser back/forward navigation
- [ ] Persist video playback state (currentTime, isPlaying) in sessionStorage
- [ ] Restore video state when page remounts after navigation
- [ ] Handle Next.js router navigation (back/forward)
- [ ] Clean up state on component unmount
- [ ] Handle edge case: video URL changes but user navigates back

**Files to Modify**:
- `components/video/video-player.tsx`
- `app/watch/[videoId]/page.tsx`

**Implementation Notes**:
```typescript
// Save state before unmount
useEffect(() => {
  return () => {
    if (videoRef.current) {
      sessionStorage.setItem(`video_state_${videoId}`, JSON.stringify({
        currentTime: videoRef.current.currentTime,
        wasPlaying: !videoRef.current.paused,
        timestamp: Date.now()
      }))
    }
  }
}, [videoId])

// Restore state on mount
useEffect(() => {
  const savedState = sessionStorage.getItem(`video_state_${videoId}`)
  if (savedState && videoRef.current) {
    const state = JSON.parse(savedState)
    // Only restore if recent (within 5 minutes)
    if (Date.now() - state.timestamp < 5 * 60 * 1000) {
      videoRef.current.currentTime = state.currentTime
      if (state.wasPlaying) {
        videoRef.current.play().catch(console.error)
      }
    }
  }
}, [videoId])
```

---

### 3. Multi-Tab Resource Conflict Resolution ⚠️ HIGH PRIORITY
**Issues Fixed**: #46, #47

**Tasks**:
- [ ] Add unique identifier to proxy URL to avoid browser cache conflicts
- [ ] Use cache-busting query parameter per tab (e.g., `?t=${Date.now()}`)
- [ ] OR use sessionStorage-based tab ID to create unique URLs
- [ ] Ensure each tab gets independent video resource
- [ ] Test: Same video in 2 tabs should play independently
- [ ] Test: Different videos in 2 tabs should play independently

**Files to Modify**:
- `components/video/video-player.tsx` (URL generation)
- `app/proxy/video/stream/route.ts` (may need to handle cache-busting params)

**Implementation Notes**:
```typescript
// Generate unique tab ID on first load
const tabId = useMemo(() => {
  let id = sessionStorage.getItem('video_tab_id')
  if (!id) {
    id = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('video_tab_id', id)
  }
  return id
}, [])

// Add to proxy URL
const proxyUrl = `/proxy/video/stream?url=${encodeURIComponent(processedUrl)}&tab=${tabId}`
```

---

### 4. Video Element Lifecycle Management ⚠️ HIGH PRIORITY
**Issues Fixed**: #45, #48, #49

**Tasks**:
- [ ] Proper cleanup of video element on unmount
- [ ] Clear all intervals and timeouts on unmount
- [ ] Cancel pending play promises on unmount
- [ ] Reset video element state on URL change
- [ ] Handle component remount scenarios
- [ ] Prevent memory leaks from event listeners

**Files to Modify**:
- `components/video/video-player.tsx`

**Implementation Notes**:
```typescript
useEffect(() => {
  const video = videoRef.current
  if (!video) return

  // ... event listeners ...

  return () => {
    // Cleanup
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }
    if (bufferCheckIntervalRef.current) {
      clearInterval(bufferCheckIntervalRef.current)
    }
    video.pause()
    video.src = ''
    video.load()
  }
}, [signedVideoUrl])
```

---

### 5. Play Promise Management Improvements
**Issues Fixed**: #45, #48, #49

**Tasks**:
- [ ] Better error handling for play promises
- [ ] Handle AbortError gracefully (when play is interrupted)
- [ ] Clear play promises on navigation/unmount
- [ ] Prevent multiple simultaneous play() calls
- [ ] Add retry logic for failed play attempts

**Files to Modify**:
- `components/video/video-player.tsx`

---

### 6. State Synchronization Improvements
**Issues Fixed**: All issues

**Tasks**:
- [ ] Ensure React state matches video element state
- [ ] Handle race conditions between state updates
- [ ] Sync isPlaying state with video.paused
- [ ] Handle edge cases: video error, network error, etc.

**Files to Modify**:
- `components/video/video-player.tsx`

---

### 7. Extended Pause Handling
**Issues Fixed**: #45

**Tasks**:
- [ ] Detect when video has been paused for extended period (>30 seconds)
- [ ] Optionally reload video element if paused too long
- [ ] Reset buffer state if needed after extended pause
- [ ] Handle switching to new video after extended pause

**Files to Modify**:
- `components/video/video-player.tsx`

---

## Backend Responsibilities (Golang)

### 1. Multi-Tab Request Handling (Optional Enhancement)
**Issues Fixed**: #46, #47

**Tasks**:
- [ ] Ensure backend/Workers can handle concurrent requests for same video
- [ ] Verify Range request handling works correctly with concurrent requests
- [ ] Check if rate limiting affects multiple tabs
- [ ] Consider adding request tracking/logging for debugging

**Files to Check**:
- Workers/CDN configuration
- Backend video serving logic (if any)

**Notes**:
- If using CDN/Workers, this is likely already handled
- Frontend cache-busting should be primary solution

---

### 2. Video Streaming Endpoint Optimization
**Issues Fixed**: #45 (indirectly)

**Tasks**:
- [ ] Verify Range request support is optimal
- [ ] Check response headers for proper caching directives
- [ ] Ensure Connection: keep-alive is properly handled
- [ ] Verify partial content (206) responses work correctly
- [ ] Check CORS headers for multi-tab scenarios

**Current Status**: 
- ✅ Already implemented in `app/proxy/video/stream/route.ts`
- ✅ Range requests are handled
- ✅ CORS headers are set

**Optional Enhancements**:
- Add request ID tracking for debugging
- Improve error responses
- Add rate limiting headers if needed

---

### 3. Signed URL Generation (If Applicable)
**Issues Fixed**: #46, #47 (if signed URLs expire)

**Tasks**:
- [ ] Verify signed URLs don't expire too quickly
- [ ] Consider URL refresh mechanism if videos are long
- [ ] Ensure signed URLs work across multiple tabs

**Notes**:
- Currently using Workers URL with API key
- Check if Workers URLs have expiration that could cause issues

---

### 4. API Response Optimization
**Tasks**:
- [ ] Ensure `GET /videos/{videoId}` endpoint is fast
- [ ] Consider caching video URL responses
- [ ] Verify response times don't affect playback start

**Current Status**:
- ✅ Already implemented
- No changes needed unless performance issues detected

---

## Shared/Coordination Items

### 1. Testing Requirements
**Both Teams Should Test**:
- [ ] Same video in 2 tabs simultaneously
- [ ] Different videos in 2 tabs simultaneously
- [ ] Navigate back/forward in browser history
- [ ] Switch tabs while video is playing
- [ ] Pause video, switch tabs, wait, switch back
- [ ] Close tab, reopen same video URL
- [ ] Long videos (>30 minutes) with tab switching

---

### 2. Monitoring & Debugging
**Frontend**:
- [ ] Add console logging for visibility changes
- [ ] Log navigation events
- [ ] Track video state transitions
- [ ] Add error boundary for video player

**Backend**:
- [ ] Log Range request patterns
- [ ] Monitor concurrent request patterns
- [ ] Track response times
- [ ] Monitor error rates

---

## Priority Order

### Phase 1: Critical (Fix Immediately)
1. Frontend: Page Visibility API (#1)
2. Frontend: Browser Navigation Handling (#2)
3. Frontend: Video Element Lifecycle (#4)

### Phase 2: High Priority (Fix Soon)
4. Frontend: Multi-Tab Resource Conflict (#3)
5. Frontend: Play Promise Management (#5)

### Phase 3: Nice to Have
6. Frontend: Extended Pause Handling (#7)
7. Frontend: State Synchronization (#6)
8. Backend: Any optimizations if needed

---

## HLS/DASH Considerations

### Current Answer: NO, Not Needed for These Issues

**Why HLS/DASH won't fix these specific issues:**
- These bugs are about **tab visibility**, **navigation**, and **resource conflicts**
- HLS/DASH are for **adaptive bitrate streaming** (quality adjustment based on network)
- Your current MP4 streaming already works; the issues are state management related

**When you WOULD need HLS/DASH:**
- If you want adaptive quality (switch between 480p/720p/1080p automatically)
- If videos are very long and need better seeking
- If you need live streaming
- If you want better buffering strategies for low-bandwidth users

**Current MP4 approach is fine for:**
- Progressive download with Range requests ✅
- Seeking to any position ✅
- Multiple tabs (once we fix the cache conflicts) ✅
- Standard playback ✅

---

## Notes

- **All critical fixes are frontend-only** - no backend changes required for the reported issues
- Backend work is optional enhancements
- The proxy route (`/proxy/video/stream`) is already well-implemented
- Main issues are React/Next.js state management and browser API handling
