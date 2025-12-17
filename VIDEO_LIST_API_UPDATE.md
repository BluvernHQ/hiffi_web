# API Structure Updates

## Date
December 17, 2025

## Summary
Updated the API client methods to handle new response structures from the backend API:
1. `/videos/list` - Videos now wrapped with `following` status
2. `/videos/list/self` - Videos now wrapped with `following` status  
3. `/users/{username}` - Now includes `following` status at data level

## API Response Changes

### New Structure
The API now returns videos wrapped in an object that includes both the video data and a `following` status:

```json
{
  "success": true,
  "data": {
    "count": 2,
    "limit": 2,
    "offset": 0,
    "seed": "johndoe",
    "videos": [
      {
        "video": {
          "video_id": "d2396d5d...",
          "video_url": "videos/d2396d5d...",
          "video_thumbnail": "thumbnails/videos/d2396d5d....jpg",
          "video_title": "Video Title",
          "video_description": "Description",
          "video_tags": ["hip hop"],
          "video_views": 2,
          "video_upvotes": 0,
          "video_downvotes": 0,
          "video_comments": 0,
          "user_uid": "76561713...",
          "user_username": "username",
          "created_at": "2025-12-15T12:14:03.629104Z",
          "updated_at": "2025-12-15T12:14:05.696203Z"
        },
        "following": false
      }
    ]
  }
}
```

### Old Structure
Previously, the API returned videos directly in an array:

```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "video_id": "d2396d5d...",
        "video_url": "videos/d2396d5d...",
        ...
      }
    ]
  }
}
```

## Changes Made

### 1. New TypeScript Interfaces

Added type definitions in `lib/api-client.ts`:

```typescript
// Video Types
export interface Video {
  video_id: string
  video_url: string
  video_thumbnail: string
  video_title: string
  video_description: string
  video_tags: string[]
  video_views: number
  video_upvotes: number
  video_downvotes: number
  video_comments: number
  user_uid: string
  user_username: string
  created_at: string
  updated_at: string
  following?: boolean // Added from /videos/list response
  upvoted?: boolean // Added from /videos/{videoId} response
  downvoted?: boolean // Added from /videos/{videoId} response
}

// API response wrapper for video list items
export interface VideoListItem {
  video: Video
  following: boolean
}
```

### 2. Updated `getVideoList()` Method

- Updated return type from `videos: any[]` to `videos: Video[]`
- Added transformation logic to flatten the nested structure
- Now extracts `following` status and merges it with video object
- Maintains backward compatibility with old API format

**Transformation Logic:**
```typescript
const videos = rawVideos.map((item: any) => {
  // If item has 'video' property, it's the new format
  if (item.video) {
    return {
      ...item.video,
      following: item.following || false,
    }
  }
  // Otherwise, it's already in the old format (backward compatibility)
  return item
})
```

### 3. Updated `listSelfVideos()` Method

- Applied same changes as `getVideoList()`
- Now handles the new nested structure
- Maintains backward compatibility

## Benefits

1. **Type Safety**: Proper TypeScript interfaces provide better IDE support and catch errors at compile time
2. **Following Status**: Videos now include the user's following status for the video creator
3. **Backward Compatible**: Code still works with the old API format if needed
4. **Consistent**: Both public and self video list endpoints handle the same structure

## Impact on Existing Code

### No Breaking Changes
The transformation is done in the API client layer, so existing code that uses `getVideoList()` and `listSelfVideos()` will continue to work without modifications. Videos are returned as flat objects with the `following` field included.

### New Feature Available
Components can now access the `following` field on video objects:

```typescript
const response = await apiClient.getVideoList({ offset: 0, limit: 10, seed })
response.videos.forEach(video => {
  console.log(`${video.video_title} - Following: ${video.following}`)
})
```

## User Profile Endpoint Changes

### New Structure - `/users/{username}`

The API now returns following status at the data level:

```json
{
  "success": true,
  "data": {
    "following": false,
    "user": {
      "id": 29,
      "uid": "76561713dae4e05f24989c89812f0be4",
      "username": "3vvvyoggbp4",
      "name": "3VVVyoGGBP4",
      "role": "user",
      "profile_picture": "",
      "followers": 0,
      "following": 0,
      "total_streams": 0,
      "total_videos": 1,
      "created_at": "2025-12-15T12:14:03.53278Z",
      "updated_at": "2025-12-15T12:14:03.53278Z"
    }
  }
}
```

**Note**: The `following` field at the data level indicates whether the **current authenticated user** is following this profile user.

### Updated `getUserByUsername()` Method

- Now extracts and returns `following` status from the response
- Return type updated to include `following?: boolean`
- Components can now get following status without a separate API call

**Previous Implementation:**
```typescript
// Required separate call to checkFollowingStatus()
const userResponse = await apiClient.getUserByUsername(username);
const isFollowing = await apiClient.checkFollowingStatus(username);
```

**New Implementation:**
```typescript
// Following status included in response
const userResponse = await apiClient.getUserByUsername(username);
const isFollowing = userResponse.following; // Already available!
```

## Files Modified

- `lib/api-client.ts` - Updated API client methods and added type definitions
- `app/profile/[username]/page.tsx` - Updated to use `following` field from API response
- `app/watch/[videoId]/page.tsx` - Updated to use `following` field from API response

## Testing Recommendations

1. Test video list loading on home page
2. Test video list on profile pages
3. Test search functionality
4. Verify following status displays correctly
5. Test pagination with new structure
6. Verify backward compatibility if API reverts

## Related Documentation

- See `FOLLOW_STATE_CONDITIONAL_BUG.md` for follow button behavior
- See `VIDEO_PLAYER_ENDPOINTS.md` for video player API details
