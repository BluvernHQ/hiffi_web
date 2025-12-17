# Follow Button Toggle Implementation

## Overview
This document describes the implementation of follow/unfollow functionality with proper state management across the application.

## API Endpoints

### Follow User
```
POST /social/users/follow/{username}
```
**Response:**
```json
{
    "success": true,
    "data": {
        "message": "Followed successfully"
    }
}
```

### Unfollow User
```
POST /social/users/unfollow/{username}
```
**Response:**
```json
{
    "success": true,
    "data": {
        "message": "Unfollowed successfully"
    }
}
```

### Get Video with Follow Status
```
GET /videos/{videoID}
```
**Response:**
```json
{
    "success": true,
    "data": {
        "downvoted": false,
        "following": false,
        "upvoted": false,
        "video_url": "https://..."
    }
}
```

## Implementation Details

### 1. API Client Updates

#### Updated `getVideo` Method
- **File:** `lib/api-client.ts`
- **Changes:** Added `following?: boolean` field to the return type and response handling
- **Purpose:** The `/videos/{videoID}` endpoint now returns the follow status for the video creator

```typescript
async getVideo(videoId: string): Promise<{
  success: boolean
  video_url: string
  upvoted?: boolean
  downvoted?: boolean
  following?: boolean  // NEW FIELD
  put_view_error?: string
}>
```

### 2. Watch Page Updates

#### Initial Follow State
- **File:** `app/watch/[videoId]/page.tsx`
- **Changes:**
  1. The `getVideo` API response now includes the `following` field
  2. Initial follow state is set directly from this response
  3. Removed redundant `checkFollowingStatus` API call that was previously used
  
```typescript
// Set follow state from getVideo response
const videoCreatorUsername = foundVideo.userUsername || foundVideo.user_username
if (userData?.username && userData.username !== videoCreatorUsername) {
  setIsFollowing(videoResponse.following || false)
}
```

#### Follow Toggle Logic
- **Optimistic Updates:** State is updated immediately before API call for better UX
- **Error Handling:** State is reverted if API call fails
- **No Verification:** Removed unnecessary follow status verification after toggle
- **Follower Count:** Automatically updates after follow/unfollow action

```typescript
const handleFollow = async () => {
  // Store previous state for rollback
  const previousFollowingState = isFollowing
  const previousFollowersCount = videoCreator?.followers || 0

  // Optimistic update
  setIsFollowing(!isFollowing)

  try {
    if (previousFollowingState) {
      await apiClient.unfollowUser(username)
    } else {
      await apiClient.followUser(username)
    }
    
    // Refresh creator data for updated follower count
    const creatorResponse = await apiClient.getUserByUsername(username)
    setVideoCreator(creatorResponse.user)
  } catch (error) {
    // Revert on error
    setIsFollowing(previousFollowingState)
    setVideoCreator({ ...videoCreator, followers: previousFollowersCount })
  }
}
```

### 3. Profile Page Updates

#### Initial Follow State
- **File:** `app/profile/[username]/page.tsx`
- **Changes:** Follow state is checked when loading profile data
- **Method:** Uses `checkFollowingStatus` to determine if current user follows the profile user

#### Follow Toggle Logic
- Similar to watch page implementation
- Optimistic updates with error rollback
- Updates follower count after action
- Removed unnecessary verification call

### 4. State Management

#### Follow Button States
1. **Default (Not Following):** Shows "Follow" button
2. **Following:** Shows "Following" button with secondary variant
3. **Loading (Action in Progress):** Shows "Following..." or "Unfollowing..." with disabled state
4. **Checking (Initial Load):** Shows "Checking..." while determining initial state (watch page only)

#### Button Display Logic
```typescript
// Watch Page
{user && userData && (userData?.username) !== (video.userUsername || video.user_username) && (
  <Button
    variant={isFollowing ? "secondary" : "default"}
    size="sm"
    onClick={handleFollow}
    disabled={isCheckingFollow || isFollowingAction}
  >
    {isCheckingFollow 
      ? "Checking..." 
      : isFollowingAction 
        ? (isFollowing ? "Unfollowing..." : "Following...") 
        : isFollowing 
          ? "Following" 
          : "Follow"}
  </Button>
)}

// Profile Page
<Button 
  variant={isFollowing ? "secondary" : "default"}
  onClick={handleFollow}
  disabled={isFollowingAction}
>
  {isFollowingAction ? (
    <>
      <UserPlus className="mr-2 h-4 w-4 animate-pulse" />
      {isFollowing ? "Unfollowing..." : "Following..."}
    </>
  ) : isFollowing ? (
    <>
      <UserCheck className="mr-2 h-4 w-4" />
      Following
    </>
  ) : (
    <>
      <UserPlus className="mr-2 h-4 w-4" />
      Follow
    </>
  )}
</Button>
```

## Benefits of This Implementation

1. **Fewer API Calls:** Initial follow state comes from `getVideo` response, eliminating extra API calls
2. **Better UX:** Optimistic updates make the UI feel instant and responsive
3. **Consistent State:** Follow status is synced across page refreshes
4. **Error Resilience:** Failed actions revert state gracefully
5. **Proper Toggle:** State correctly toggles between following/not following

## Testing Checklist

- [ ] Follow button appears on video watch page (not for own videos)
- [ ] Follow button appears on profile page (not for own profile)
- [ ] Clicking follow changes button to "Following"
- [ ] Clicking unfollow changes button back to "Follow"
- [ ] Follower count updates after follow/unfollow
- [ ] Button is disabled during API calls
- [ ] State persists after page refresh
- [ ] Error messages display if API calls fail
- [ ] State reverts if API call fails
- [ ] No follow button shown when viewing own content
- [ ] Follow button requires authentication (prompts sign in if not logged in)

## Known Considerations

1. **Race Conditions:** Double-click protection via `isFollowingAction` state
2. **Authentication:** Follow button only visible when user is authenticated
3. **Self-Follow Prevention:** Button hidden when viewing own content
4. **Network Errors:** Graceful handling with state rollback and error toasts
