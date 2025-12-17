# Follow State Race Condition Fix

## Problem Identified

### Error Observed
```
POST /social/users/follow/hrcbkvqnl3w - 400 Bad Request
Error: "You are already following this user"
```

### Console Logs Showed
```
[hiffi] 🔄 Optimistic update - Follow state: {
  previousFollowingState: false,  ← Button showed "Follow"
  newFollowingState: true
}
[hiffi] 🔄 ENDPOINT HIT: POST /social/users/follow/{username}
ERROR 400: "You are already following this user"  ← Server says already following!
```

### Root Cause

The follow button displayed "Follow" (meaning `isFollowing = false`) when the user was actually already following the creator. This happened because:

1. **Video data loaded first** - `getVideo` API returned `following: true`
2. **userData not available yet** - Auth context hadn't loaded
3. **Conditional check failed** - Code only set follow state if `userData?.username` existed
4. **State never set** - Follow state remained at initial value of `false`
5. **Wrong button displayed** - User saw "Follow" instead of "Following"

### The Problematic Code

```typescript
// OLD CODE - Only set follow state if userData is available
if (userData?.username && userData.username !== videoCreatorUsername) {
  console.log("[hiffi] 👤 Setting follow state:", videoResponse.following || false)
  setIsFollowing(videoResponse.following || false)
}
// If userData isn't loaded yet, follow state is never set!
```

**Sequence of Events:**
```
1. Video loads → getVideo returns {following: true}
2. Code checks: if (userData?.username ...) → FALSE (userData not loaded yet)
3. Follow state NOT set → isFollowing stays false
4. Button shows "Follow" (incorrect)
5. User clicks "Follow"
6. API rejects: "You are already following this user"
```

## Solution Implemented

### Remove userData Dependency

The follow state from the API response should be stored **immediately**, regardless of whether `userData` is loaded. The button rendering logic already handles the auth check.

**NEW CODE:**
```typescript
// Store follow state from API response immediately
// Button rendering will handle the auth check
console.log("[hiffi] 👤 Setting follow state from API:", videoResponse.following || false)
setIsFollowing(videoResponse.following || false)
// No longer conditional on userData availability ✓
```

**Fixed Sequence:**
```
1. Video loads → getVideo returns {following: true}
2. Code immediately sets: setIsFollowing(true) ✓
3. Button shows "Following" (correct) ✓
4. User clicks "Following"
5. API call: POST /social/users/unfollow/{username} ✓
6. Success!
```

## Changes Made

### File: `app/watch/[videoId]/page.tsx`

#### Change 1: Set Follow State Unconditionally (Line 203-210)

**Before:**
```typescript
// Update follow state from getVideo API response
// Only if user is authenticated and not viewing their own video
if (userData?.username && userData.username !== videoCreatorUsername) {
  console.log("[hiffi] 👤 Setting follow state:", videoResponse.following || false)
  setIsFollowing(videoResponse.following || false)
}
```

**After:**
```typescript
// Update follow state from getVideo API response
// Store it regardless of userData availability - button rendering will handle auth check
console.log("[hiffi] 👤 Setting follow state from API:", videoResponse.following || false)
setIsFollowing(videoResponse.following || false)
```

**Why:** The follow state from the API is the source of truth and should be stored immediately. The button component already has logic to hide the button if user is not authenticated or viewing their own video:

```typescript
{user && userData && (userData?.username) !== (video.userUsername || video.user_username) && (
  <Button>...</Button>
)}
```

#### Change 2: Updated Comment (Line 275-277)

Clarified that follow status is set immediately when video loads, not conditionally.

## Button Rendering Logic

The follow button is already properly protected by auth checks in the JSX:

```typescript
{user && userData && (userData?.username) !== (video.userUsername || video.user_username) && (
  <Button
    variant={isFollowing ? "secondary" : "default"}
    onClick={handleFollow}
  >
    {isFollowing ? "Following" : "Follow"}
  </Button>
)}
```

**Conditions for button to show:**
1. `user` - User must be logged in
2. `userData` - User data must be loaded
3. `userData.username !== videoCreatorUsername` - Can't follow yourself

These checks happen at **render time**, not at state-setting time.

## Why This Works

### Separation of Concerns

1. **State Management** - Store the follow state from API immediately
2. **UI Rendering** - Check auth/ownership when rendering button
3. **Action Handling** - Verify auth when clicking button

### Timeline

```
Page Load:
  ├─ Fetch video data
  ├─ Get follow state: following=true
  ├─ Set state: setIsFollowing(true) ✓
  ├─ (userData still loading...)
  └─ Video state: READY

Auth Load:
  ├─ userData loads
  ├─ Button checks: user exists? ✓
  ├─ Button checks: userData exists? ✓
  ├─ Button checks: not own video? ✓
  └─ Button renders: "Following" ✓

Button Click:
  ├─ User clicks "Following"
  ├─ handleFollow checks auth ✓
  ├─ Optimistic update: setIsFollowing(false)
  ├─ API call: POST /unfollow
  └─ Success! ✓
```

## Testing

### Before Fix
```
Page Load → Button shows "Follow" (wrong)
Click "Follow" → Error 400: "Already following"
```

### After Fix
```
Page Load → Button shows "Following" (correct)
Click "Following" → API call to unfollow
Success → Button shows "Follow"
Click "Follow" → API call to follow
Success → Button shows "Following"
```

## Console Logs to Verify

### On Page Load
Look for this log to confirm follow state is being set:
```
[hiffi] 👤 Setting follow state from API: true
```

### If Still Shows Wrong State
Check these logs:
1. **Initial state log:**
   ```
   [hiffi] 📊 Button states received from API: {upvoted: ?, downvoted: ?, following: ?}
   ```
   
2. **State setting log:**
   ```
   [hiffi] 👤 Setting follow state from API: true
   ```

3. **Button visibility check:**
   - Is `user` defined?
   - Is `userData` defined?
   - Is `userData.username` different from video creator?

## Related Files

- `app/watch/[videoId]/page.tsx` - Follow button implementation
- `VIDEO_PLAYER_ENDPOINTS_AND_LOGS.md` - Console logging reference

## Key Takeaway

**Store state immediately when received from API. Let the UI rendering logic handle conditional display based on auth state.**

This prevents race conditions where async data (userData) might load after other data (video), causing state to not be set when needed.
