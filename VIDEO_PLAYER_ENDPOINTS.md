# Video Player Page - API Endpoints

## Current Endpoints Being Called

### 1. **On Page Load**

#### GET `/videos/{videoID}`
- **When**: Immediately on page load (Line 128)
- **Purpose**: Get video streaming URL and initial button states
- **Returns**:
  ```json
  {
    "success": true,
    "data": {
      "video_url": "https://...",
      "upvoted": false,
      "downvoted": false,
      "following": false
    }
  }
  ```
- **Sets State**:
  - `video.video_url` / `video.streaming_url`
  - `isLiked` (from `upvoted`)
  - `isDisliked` (from `downvoted`)
  - `isFollowing` (from `following`)

#### GET `/videos/list?page={page}&limit={limit}&seed={seed}`
- **When**: After getting video URL, searches for video metadata (Lines 153)
- **Purpose**: Get video title, description, views, creator info
- **Returns**: Array of videos with metadata
- **Used For**: Finding the current video's metadata and related videos

#### GET `/users/{username}` 
- **When**: After finding video metadata (Line 208)
- **Purpose**: Get video creator's profile data (follower count, etc.)
- **Requires**: Authentication
- **Returns**:
  ```json
  {
    "success": true,
    "user": {
      "username": "...",
      "name": "...",
      "followers": 0,
      "following": 0
    }
  }
  ```

---

### 2. **On Upvote Button Click**

#### POST `/social/videos/upvote/{videoID}`
- **When**: User clicks upvote button (Line 301)
- **Purpose**: Toggle upvote on the video
- **Behavior**: Acts as a toggle - if already upvoted, removes upvote

#### GET `/videos/{videoID}` (Refresh)
- **When**: After upvote API succeeds (Line 326)
- **Purpose**: Get updated vote state from server
- **Why**: To sync UI with server state

---

### 3. **On Downvote Button Click**

#### POST `/social/videos/downvote/{videoID}`
- **When**: User clicks downvote button (Line 374)
- **Purpose**: Toggle downvote on the video
- **Behavior**: Acts as a toggle - if already downvoted, removes downvote

#### GET `/videos/{videoID}` (Refresh)
- **When**: After downvote API succeeds (Line 399)
- **Purpose**: Get updated vote state from server
- **Why**: To sync UI with server state

---

### 4. **On Follow Button Click**

#### POST `/social/users/unfollow/{username}` (if already following)
- **When**: User clicks "Following" button (Line 464)
- **Purpose**: Unfollow the user

#### POST `/social/users/follow/{username}` (if not following)
- **When**: User clicks "Follow" button (Line 497)
- **Purpose**: Follow the user

#### GET `/users/{username}` (Refresh)
- **When**: After follow/unfollow API succeeds (Lines 472, 505)
- **Purpose**: Get updated follower count

#### GET `/videos/{videoID}` (Refresh)
- **When**: After follow/unfollow API succeeds (Line 534)
- **Purpose**: Get updated follow state from server
- **Why**: To sync UI with server state

---

## Summary of API Calls

### Page Load Sequence:
```
1. GET /videos/{videoID}               → Get streaming URL + initial states
2. GET /videos/list (multiple pages)   → Search for video metadata
3. GET /users/{username}               → Get creator profile (if authenticated)
```

### Button Click Sequences:

**Upvote:**
```
1. POST /social/videos/upvote/{videoID}  → Toggle upvote
2. GET /videos/{videoID}                 → Refresh all states
```

**Downvote:**
```
1. POST /social/videos/downvote/{videoID}  → Toggle downvote
2. GET /videos/{videoID}                   → Refresh all states
```

**Follow:**
```
1. POST /social/users/follow/{username}    → Follow user
   OR
   POST /social/users/unfollow/{username}  → Unfollow user
2. GET /users/{username}                   → Refresh follower count
3. GET /videos/{videoID}                   → Refresh all states
```

---

## Current Issues

1. **Too many refreshes after button clicks**
   - After each button click, we're calling `GET /videos/{videoID}` again
   - This is unnecessary if we trust the optimistic update

2. **State should only load on page load**
   - Initial state: Load from `GET /videos/{videoID}` ✓
   - After button click: Just optimistic update (no refresh needed)
   - On page reload: Load from `GET /videos/{videoID}` again ✓

---

## Recommended Changes

### Simplify Button Handlers

**Current behavior:**
```
Click button → Optimistic update → API call → Refresh from /videos/{videoID}
```

**Desired behavior:**
```
Click button → Optimistic update → API call → Done
(State reloads from /videos/{videoID} only on page refresh)
```

### Benefits:
- Fewer API calls
- Faster UI response
- Simpler code
- State still syncs on page reload

### Trade-off:
- If API call fails silently, UI might be out of sync until page reload
- But we have error handling that reverts optimistic updates, so this is fine
