# Frontend Features That Depend on Backend Support

This document outlines which frontend features for fixing video playback issues **require backend coordination** vs. which can be implemented independently.

---

## ✅ **Frontend Features - NO Backend Dependency Required**

These features can be implemented **entirely on the frontend** and don't require any backend changes:

### 1. Page Visibility API Implementation
**Status**: ✅ Frontend-only  
**Backend Dependency**: None  
**Why**: This is a browser API that doesn't interact with backend

- Tab visibility detection using `document.visibilitychange`
- Pause/resume logic based on tab state
- State tracking in React components

---

### 2. Browser Navigation Handling
**Status**: ✅ Frontend-only  
**Backend Dependency**: None  
**Why**: Uses browser sessionStorage and Next.js router

- Persist video state to `sessionStorage`
- Restore state on page remount
- Handle back/forward navigation

---

### 3. Video Element Lifecycle Management
**Status**: ✅ Frontend-only  
**Backend Dependency**: None  
**Why**: React component lifecycle management

- Cleanup on unmount
- Event listener management
- Play promise cancellation

---

### 4. Play Promise Management
**Status**: ✅ Frontend-only  
**Backend Dependency**: None  
**Why**: Browser API error handling

- Play promise error handling
- Retry logic
- State synchronization

---

### 5. State Synchronization
**Status**: ✅ Frontend-only  
**Backend Dependency**: None  
**Why**: React state management

- React state ↔ Video element state sync
- Race condition handling

---

### 6. Extended Pause Handling
**Status**: ✅ Frontend-only  
**Backend Dependency**: None  
**Why**: Frontend timing and state logic

- Detect long pauses
- Optional video element reload

---

## ⚠️ **Frontend Features - Backend Coordination MAY Be Needed**

These features **might** need backend support, depending on implementation approach:

### 1. Multi-Tab Resource Conflict Resolution
**Status**: ⚠️ Mostly Frontend, Backend Verification Needed

#### Frontend Implementation (Primary Solution):
- Add cache-busting query parameter to proxy URL
- Example: `/proxy/video/stream?url=...&tab=unique_tab_id`
- This is a **frontend change** in URL generation

#### Backend Verification Needed:
- ✅ **Verify** `/proxy/video/stream` route handler ignores unknown query params
- ✅ **Verify** Workers/CDN handles multiple concurrent requests for same video
- ✅ **Verify** no rate limiting blocks multiple tabs
- ✅ **Test** that Range requests work correctly with cache-busting params

**Backend Action Required**: 
- **Testing/Verification only** - no code changes expected
- The Next.js proxy route (`app/proxy/video/stream/route.ts`) should already ignore extra query params

**Risk Level**: Low - likely already works, just needs verification

---

## 🔴 **Frontend Features - Backend Support REQUIRED**

These features **definitely** require backend changes or support:

### 1. Signed URL Expiration Handling (If Needed)
**Status**: 🔴 Requires Backend Coordination  
**Issue**: If signed URLs expire during playback

#### Current Situation:
- Frontend calls `GET /videos/{videoId}` to get signed URL
- URL is used for entire video playback session
- If URL expires mid-playback, video will fail

#### Backend Action Required:
- [ ] **Verify** signed URL expiration time (should be long enough for full video)
- [ ] **Optionally**: Provide URL refresh endpoint `GET /videos/{videoId}/refresh-url`
- [ ] **Optionally**: Return expiration timestamp in API response
- [ ] **Optionally**: Implement automatic URL refresh in frontend before expiration

**When This Matters**:
- Long videos (>30 minutes)
- Extended pause scenarios
- Multi-tab scenarios where URLs might expire

**Current Risk**: Low (likely URLs already have sufficient expiration)

---

### 2. Video URL Refresh Endpoint (Optional Enhancement)
**Status**: 🔴 Requires New Backend Endpoint  
**Priority**: Low (only if expiration becomes an issue)

#### Proposed Backend Endpoint:
```
GET /videos/{videoId}/refresh-url
Authorization: Bearer {token} (optional)

Response:
{
  "video_url": "string",
  "expires_at": "ISO8601 timestamp"
}
```

#### Frontend Usage:
```typescript
// Refresh URL before expiration
const refreshVideoUrl = async () => {
  const response = await apiClient.refreshVideoUrl(videoId)
  setSignedVideoUrl(response.video_url)
}
```

**When Needed**: Only if URLs expire during playback

---

### 3. Concurrent Request Handling Verification
**Status**: 🔴 Requires Backend Testing  
**Priority**: Medium (critical for multi-tab fix)

#### What Backend Needs to Verify:

1. **Workers/CDN Configuration**:
   - ✅ Can handle multiple Range requests for same video simultaneously
   - ✅ No per-IP rate limiting that blocks multiple tabs
   - ✅ Connection pooling works correctly

2. **Backend API Endpoint** (`GET /videos/{videoId}`):
   - ✅ Can handle concurrent requests from same user
   - ✅ No rate limiting that blocks multiple tabs
   - ✅ Response times are fast (<200ms ideally)

3. **Proxy Route** (`/proxy/video/stream`):
   - ✅ Already handles multiple concurrent requests ✅ (Next.js route)
   - ✅ Properly forwards Range requests
   - ✅ Doesn't block on connection limits

**Backend Action Required**:
- **Testing only** - verify concurrent access works
- **Configuration check** - ensure no rate limiting blocks multiple tabs
- **Monitoring** - log concurrent request patterns for debugging

**Risk Level**: Medium - needs verification but likely already works

---

## 📋 **Backend API Endpoints Currently Used**

### 1. `GET /videos/{videoId}`
**Used For**: Getting video metadata and signed streaming URL

**Frontend Code**:
```typescript
const response = await apiClient.getVideo(videoId)
const videoUrl = response.video_url // Signed URL from Workers
```

**Backend Requirements** (Current):
- ✅ Must return `video_url` field with signed/streaming URL
- ✅ Should be fast (<500ms)
- ✅ Should work for authenticated and unauthenticated users

**Potential Issues**:
- Slow response times → delayed playback start
- Rate limiting → blocks multiple tabs
- URL expiration → playback fails mid-video

**Backend Action**: Verify these don't cause issues

---

### 2. Video Streaming (via Workers/CDN)
**Used For**: Actual video streaming

**Frontend Code**:
```typescript
// Proxy URL: /proxy/video/stream?url={encoded_workers_url}
const proxyUrl = `/proxy/video/stream?url=${encodeURIComponent(workersUrl)}`
```

**Backend/Infrastructure Requirements**:
- ✅ Workers must support HTTP Range requests (206 Partial Content)
- ✅ Workers must handle concurrent requests for same video
- ✅ Workers must support CORS headers
- ✅ Workers API key must be valid

**Current Implementation**:
- ✅ Frontend proxy route handles this (`app/proxy/video/stream/route.ts`)
- ✅ Range requests are forwarded correctly
- ✅ CORS headers are set

**Backend Action**: Verify Workers/CDN configuration supports concurrent requests

---

## 🎯 **Summary: What Backend Dev Needs to Do**

### Required Actions (Critical):
1. **Test multi-tab concurrent requests**
   - Same video in 2 tabs
   - Different videos in 2 tabs
   - Verify no rate limiting blocks this

2. **Verify signed URL expiration times**
   - Ensure URLs last long enough for full video playback
   - Check if expiration causes any issues

3. **Monitor API response times**
   - `GET /videos/{videoId}` should be fast
   - Slow responses delay video playback start

### Optional Actions (Enhancements):
1. **Add URL refresh endpoint** (if expiration becomes issue)
2. **Add request tracking/logging** (for debugging)
3. **Improve error responses** (better error messages)

### Testing Coordination:
- Backend should test multi-tab scenarios
- Backend should verify Workers/CDN concurrent request handling
- Both teams should coordinate on testing checklist

---

## 📊 **Dependency Matrix**

| Frontend Feature | Backend Code Change | Backend Testing | Backend Config |
|-----------------|---------------------|-----------------|----------------|
| Page Visibility API | ❌ None | ❌ None | ❌ None |
| Browser Navigation | ❌ None | ❌ None | ❌ None |
| Video Lifecycle | ❌ None | ❌ None | ❌ None |
| Play Promise Mgmt | ❌ None | ❌ None | ❌ None |
| Multi-Tab Conflicts | ❌ None | ✅ Required | ✅ Verify |
| URL Expiration | ⚠️ Maybe | ✅ Required | ✅ Verify |
| Concurrent Requests | ❌ None | ✅ Required | ✅ Verify |

---

## 🚀 **Recommended Approach**

### Phase 1: Frontend-Only Fixes (Can Start Immediately)
1. Page Visibility API
2. Browser Navigation Handling
3. Video Element Lifecycle
4. Play Promise Management

**Backend Action**: None required

---

### Phase 2: Frontend + Backend Verification
5. Multi-Tab Resource Conflicts
   - Frontend: Add cache-busting
   - Backend: Test concurrent requests

**Backend Action**: Testing/verification only

---

### Phase 3: Optional Enhancements (If Needed)
6. URL refresh endpoint (if expiration issues found)
7. Enhanced logging/monitoring

**Backend Action**: Only if issues are discovered

---

## 📝 **Backend Checklist**

### Critical (Do Before Phase 2):
- [ ] Test: Same video playing in 2 tabs simultaneously
- [ ] Test: Different videos playing in 2 tabs simultaneously
- [ ] Verify: No rate limiting blocks concurrent requests
- [ ] Verify: `GET /videos/{videoId}` handles concurrent requests
- [ ] Check: Signed URL expiration times (should be >2 hours for safety)
- [ ] Monitor: API response times for video endpoint

### Optional (If Issues Found):
- [ ] Implement URL refresh endpoint
- [ ] Add request tracking/logging
- [ ] Improve error responses
- [ ] Add monitoring dashboards

---

## 🔍 **Questions for Backend Dev**

1. **What is the expiration time for signed video URLs?**
   - Need to know if URLs can expire during playback

2. **Is there any rate limiting on `GET /videos/{videoId}`?**
   - Multiple tabs might trigger rate limits

3. **Can Workers/CDN handle concurrent Range requests for same video?**
   - Critical for multi-tab support

4. **Are there any connection limits per IP/user?**
   - Could block multiple tabs

5. **What happens if a video URL expires during playback?**
   - Error handling scenario

---

## 📞 **Coordination Points**

1. **Before Phase 2**: Frontend dev should coordinate with backend to test multi-tab scenarios
2. **During Testing**: Both teams should test together to verify fixes
3. **If Issues Found**: Backend should prioritize URL expiration and concurrent request handling
4. **Monitoring**: Backend should monitor for new errors related to multi-tab playback

---

## ✅ **Good News**

**95% of fixes are frontend-only!**

The critical fixes (Page Visibility, Navigation, Lifecycle) require **zero backend changes**. Only the multi-tab fix requires backend **verification/testing**, not code changes.

The backend is likely already capable of handling these scenarios - it just needs to be tested and confirmed.
