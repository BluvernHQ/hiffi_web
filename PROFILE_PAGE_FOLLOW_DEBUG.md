# Profile Page Follow Button Debug Guide

## Issue

After clicking "Follow" on the profile page, the button still displays "Follow" instead of changing to "Following".

## Console Logs Added

### 1. Initial Follow State Check (Page Load)

```
[hiffi] 🔄 Checking initial follow status for {username} on profile page
[hiffi] ✅ Initial follow status on profile page: false
```

**What to check:**
- Does the initial state match reality?
- If you're already following, it should show `true`

### 2. Button Click

```
[hiffi] 🔘 Follow button clicked on profile page: {
  currentState: false,
  action: "follow",
  username: "..."
}
```

**What to check:**
- Is `currentState` correct before clicking?
- Is `action` what you expect (follow/unfollow)?

### 3. Optimistic Update

```
[hiffi] 🔄 Optimistic update on profile page: {
  previousFollowingState: false,
  newFollowingState: true
}
```

**What to check:**
- Is `newFollowingState` the opposite of `previousFollowingState`?
- This happens IMMEDIATELY before API call

### 4. API Call

```
[hiffi] 🔄 ENDPOINT HIT: POST /social/users/follow/{username} (from profile page)
[hiffi] ✅ Follow API call successful (profile page)
```

**What to check:**
- Does API call succeed?
- Any errors shown?

### 5. Completion

```
[hiffi] ✅ Follow action completed on profile page. Current isFollowing state: true
[hiffi] 🏁 Follow action finished on profile page. isFollowingAction set to false
```

**What to check:**
- Final `isFollowing` state should match your action
- `isFollowingAction` reset allows clicking again

### 6. If Error Occurs

```
[hiffi] ❌ Failed to follow/unfollow user on profile page: {error}
[hiffi] 🔄 Reverting optimistic update on profile page: {
  revertingTo: false
}
```

**What to check:**
- What error occurred?
- Did state revert to previous value?

## Debugging Checklist

### Scenario 1: Button doesn't change at all

**Check console for:**
1. ✅ Optimistic update log - Did state update locally?
   ```
   [hiffi] 🔄 Optimistic update: {newFollowingState: true}
   ```
2. ✅ Completion log - What's the final state?
   ```
   [hiffi] ✅ Current isFollowing state: true
   ```
3. ❌ Error log - Did an error revert the state?
   ```
   [hiffi] ❌ Failed to follow/unfollow user
   ```

**Possible causes:**
- Error after optimistic update → State reverted
- React re-render issue → State updated but UI didn't refresh
- Button reading wrong state variable

### Scenario 2: Button changes then reverts

**Check console for:**
1. ✅ Optimistic update works
2. ✅ API call succeeds
3. ❌ But then something reverts it

**Possible causes:**
- `fetchUserData` re-running and overwriting state
- Parent component re-rendering
- State being reset somewhere

### Scenario 3: API returns error "Already following"

**Check console for:**
1. Initial state log:
   ```
   [hiffi] ✅ Initial follow status: false  ← Wrong!
   ```
2. Button click:
   ```
   [hiffi] 🔘 currentState: false  ← But you're actually following!
   ```
3. API error:
   ```
   Error: "You are already following this user"
   ```

**Possible causes:**
- Initial follow state check (`checkFollowingStatus`) returned wrong value
- Race condition: userData loaded after profile data
- API endpoint not returning correct follow status

## How Follow State is Determined

### Profile Page (Different from Video Player!)

**Initial State:**
1. Load profile data: `GET /users/{username}`
2. Check follow status: `checkFollowingStatus(username)`
   - This queries the current user's following list
   - Returns `true` if username is in the list
3. Set `isFollowing` state

**After Button Click:**
1. Optimistic update: `setIsFollowing(!isFollowing)`
2. API call: `POST /social/users/follow/{username}` or `unfollow`
3. Refresh profile data (for follower count)
4. **State persists** - No re-check needed

## Key Differences: Profile vs Video Player

### Video Player Page
- Gets follow status from `GET /videos/{videoID}` response
- `following` field included in video data
- Single API call gets everything

### Profile Page
- Gets follow status from separate `checkFollowingStatus` call
- Queries current user's following list
- Two API calls: profile + follow status

## Potential Issues & Solutions

### Issue 1: fetchUserData Re-runs After Follow

**Problem:** After follow action, `fetchUserData` might re-run due to dependencies, which calls `checkFollowingStatus` again and might get stale data.

**Solution:** `fetchUserData` dependencies are `[username, toast, authLoading, currentUserData?.username]` - none change after follow, so it shouldn't re-run.

### Issue 2: setProfileUser Triggers Re-render

**Problem:** Calling `setProfileUser(profileData)` might trigger a re-render that resets follow state.

**Solution:** `isFollowing` is separate state from `profileUser`, so they shouldn't affect each other.

### Issue 3: React Strict Mode Double Render

**Problem:** In development, React Strict Mode runs effects twice, which might cause double API calls.

**Solution:** This is expected behavior. Check if issue persists in production build.

## Testing Steps

1. **Open browser console**
2. **Navigate to a user's profile**
3. **Watch for initial state logs:**
   ```
   [hiffi] 🔄 Checking initial follow status for {username}
   [hiffi] ✅ Initial follow status: false
   ```
4. **Click Follow button**
5. **Watch the logs in order:**
   - Button clicked
   - Optimistic update
   - API call
   - Completion
6. **Check if button text changed**
7. **Check final state log:**
   ```
   [hiffi] ✅ Current isFollowing state: true
   ```

## Expected Console Output

### Following a User

```
[hiffi] 🔘 Follow button clicked: {currentState: false, action: "follow"}
[hiffi] 🔄 Optimistic update: {previousFollowingState: false, newFollowingState: true}
[hiffi] 🔄 ENDPOINT HIT: POST /social/users/follow/username
[hiffi] ✅ Follow API call successful
[hiffi] ✅ Follow action completed. Current isFollowing state: true
[hiffi] 🏁 Follow action finished
```

**Button should show: "Following"** ✓

### Unfollowing a User

```
[hiffi] 🔘 Follow button clicked: {currentState: true, action: "unfollow"}
[hiffi] 🔄 Optimistic update: {previousFollowingState: true, newFollowingState: false}
[hiffi] 🔄 ENDPOINT HIT: POST /social/users/unfollow/username
[hiffi] ✅ Unfollow API call successful
[hiffi] ✅ Follow action completed. Current isFollowing state: false
[hiffi] 🏁 Follow action finished
```

**Button should show: "Follow"** ✓

## Files Modified

- `app/profile/[username]/page.tsx` - Added comprehensive logging

## Next Steps

If button still doesn't update after adding these logs:

1. **Share the console logs** - All logs from page load to button click
2. **Check React DevTools** - Inspect `isFollowing` state in component
3. **Try hard refresh** - Clear cache and reload
4. **Check browser console for errors** - Any React errors?

The logs will reveal exactly where the state flow breaks!
