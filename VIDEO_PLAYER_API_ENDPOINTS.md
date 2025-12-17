# Video Player Page - API Endpoints

## Complete List of API Calls

### On Page Load (Initial Data Fetch)

#### 1. **GET `/videos/{videoID}`** 
- **When:** First thing when page loads
- **Purpose:** Get video streaming URL and initial button states
- **Response includes:**
  - `video_url` - Streaming URL
  - `upvoted` - Boolean (user has upvoted this video)
  - `downvoted` - Boolean (user has downvoted this video)
  - `following` - Boolean (user is following the video creator)
  - `put_view_error` - Any view tracking errors

**Code Location:** Line 128
```typescript
videoResponse = await apiClient.getVideo(videoId)
```

#### 2. **GET `/videos/list`**
- **When:** After getting video URL, to find video metadata
- **Purpose:** Get video title, description, views, creator info
- **Searches:** Up to 5 pages (250 videos) to find the current video
- **Response includes:**
  - Video metadata (title, description, tags, etc.)
  - Creator username
  - View/upvote/downvote counts
  - **Does NOT include:** user's upvoted/downvoted/following status

**Code Location:** Line 153
```typescript
const videosResponse = await apiClient.getVideoList({ page, limit: videosPerPage, seed })
```

#### 3. **GET `/users/{username}`** (Optional)
- **When:** If user is logged in and video creator identified
- **Purpose:** Get creator's follower count and profile data
- **Response includes:**
  - Creator profile info
  - Follower/following counts
  - Total videos

**Code Location:** Line 208
```typescript
const creatorResponse = await apiClient.getUserByUsername(videoCreatorUsername)
```

---

### User Actions - Button Clicks

#### 4. **POST `/social/videos/upvote/{videoID}`**
- **When:** User clicks upvote button
- **Purpose:** Toggle upvote status (add or remove upvote)
- **Behavior:** Acts as a toggle - removes upvote if already upvoted

**Code Location:** Line 301
```typescript
await apiClient.upvoteVideo(videoId)
```

**Followed by:** GET `/videos/{videoID}` to refresh state (Line 326)

#### 5. **POST `/social/videos/downvote/{videoID}`**
- **When:** User clicks downvote button
- **Purpose:** Toggle downvote status (add or remove downvote)
- **Behavior:** Acts as a toggle - removes downvote if already downvoted

**Code Location:** Line 374
```typescript
await apiClient.downvoteVideo(videoId)
```

**Followed by:** GET `/videos/{videoID}` to refresh state (Line 399)

#### 6. **POST `/social/users/follow/{username}`**
- **When:** User clicks follow button (when not following)
- **Purpose:** Follow the video creator
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "message": "Followed successfully"
    }
  }
  ```

**Code Location:** Line 497
```typescript
const response = await apiClient.followUser(username)
```

**Followed by:** 
- GET `/users/{username}` to refresh follower count (Line 505)
- GET `/videos/{videoID}` to refresh all button states (Line 534)

#### 7. **POST `/social/users/unfollow/{username}`**
- **When:** User clicks follow button (when already following)
- **Purpose:** Unfollow the video creator
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "message": "Unfollowed successfully"
    }
  }
  ```

**Code Location:** Line 464
```typescript
const response = await apiClient.unfollowUser(username)
```

**Followed by:**
- GET `/users/{username}` to refresh follower count (Line 472)
- GET `/videos/{videoID}` to refresh all button states (Line 534)

---

## API Call Flow Diagram

### Initial Page Load
```
User navigates to /watch/{videoID}
  ↓
1. GET /videos/{videoID}
   → Returns: video_url, upvoted, downvoted, following
   → Sets initial button states ✓
  ↓
2. GET /videos/list (search for video metadata)
   → Returns: title, description, views, creator
   → Does NOT update button states
  ↓
3. GET /users/{username} (if logged in)
   → Returns: follower count
```

### Upvote Button Click
```
User clicks upvote
  ↓
Optimistic update: isLiked = !isLiked
  ↓
POST /social/videos/upvote/{videoID}
  ↓
Success
  ↓
GET /videos/{videoID}
  → Returns current state: upvoted, downvoted, following
  → Syncs all button states
```

### Downvote Button Click
```
User clicks downvote
  ↓
Optimistic update: isDisliked = !isDisliked
  ↓
POST /social/videos/downvote/{videoID}
  ↓
Success
  ↓
GET /videos/{videoID}
  → Returns current state: upvoted, downvoted, following
  → Syncs all button states
```

### Follow Button Click
```
User clicks follow/unfollow
  ↓
Optimistic update: isFollowing = !isFollowing
  ↓
POST /social/users/follow/{username} OR unfollow
  ↓
Success
  ↓
GET /users/{username}
  → Updates follower count
  ↓
GET /videos/{videoID}
  → Returns current state: upvoted, downvoted, following
  → Syncs all button states
```

---

## State Management

### State Variables

```typescript
const [isFollowing, setIsFollowing] = useState(false)
const [isLiked, setIsLiked] = useState(false)
const [isDisliked, setIsDisliked] = useState(false)
const [upvoteState, setUpvoteState] = useState({
  upvoted: false,
  downvoted: false,
})
```

### State Update Sources

1. **Initial Load:**
   - From `GET /videos/{videoID}` response (Line 183-196)

2. **After Upvote:**
   - Optimistic: `setIsLiked(!wasLiked)` (Line 306)
   - Server sync: From `GET /videos/{videoID}` response (Line 329-341)

3. **After Downvote:**
   - Optimistic: `setIsDisliked(!wasDisliked)` (Line 377)
   - Server sync: From `GET /videos/{videoID}` response (Line 402-414)

4. **After Follow/Unfollow:**
   - Optimistic: `setIsFollowing(!isFollowing)` (Line 459)
   - Server sync: From `GET /videos/{videoID}` response (Line 536-550)

---

## Potential Issues to Check

### 1. Server-Side Toggle Behavior
**Question:** Do the upvote/downvote API endpoints act as toggles?
- If NOT already upvoted, `POST /upvote` should add upvote
- If ALREADY upvoted, `POST /upvote` should remove upvote

**Verify:** Check API documentation or test manually

### 2. Timing Issues
**Potential Problem:** The `GET /videos/{videoID}` refresh call might happen too quickly, before the server has updated the database.

**Solution:** Add a small delay before refresh?
```typescript
await new Promise(resolve => setTimeout(resolve, 100))
const videoResponse = await apiClient.getVideo(videoId)
```

### 3. Race Conditions
**Potential Problem:** If user clicks button multiple times rapidly, state updates might conflict.

**Current Protection:** 
- Upvote/downvote: No explicit protection
- Follow: Has `isFollowingAction` flag to prevent double-clicks

**Solution:** Add similar protection to upvote/downvote?

### 4. Response Format Inconsistency
**Potential Problem:** The `GET /videos/{videoID}` response might have inconsistent format.

**Current Handling:**
```typescript
const upvoted = response.data?.upvoted ?? response.upvoted ?? false
```

This handles both formats but defaults to `false` if missing.

---

## Debugging Steps

### 1. Add Console Logs
Check what the API is returning:

```typescript
console.log("[DEBUG] Before upvote - isLiked:", isLiked)
await apiClient.upvoteVideo(videoId)
console.log("[DEBUG] After upvote API call")
const videoResponse = await apiClient.getVideo(videoId)
console.log("[DEBUG] Video response:", videoResponse)
console.log("[DEBUG] Setting isLiked to:", videoResponse.upvoted)
```

### 2. Check Network Tab
- Open browser DevTools → Network tab
- Click upvote button
- Check the responses:
  1. POST `/social/videos/upvote/{videoID}` - should succeed
  2. GET `/videos/{videoID}` - check the `upvoted` value in response

### 3. Verify API Behavior
Test the API directly:
```bash
# Initial state
GET /videos/{videoID}
# Should show: upvoted: false

# Click upvote
POST /social/videos/upvote/{videoID}

# Check state
GET /videos/{videoID}
# Should show: upvoted: true

# Click upvote again (to remove)
POST /social/videos/upvote/{videoID}

# Check state
GET /videos/{videoID}
# Should show: upvoted: false
```

### 4. Check for State Overwrites
Search for any other places in the code that might be setting these states:
```typescript
// Search for:
setIsLiked
setIsDisliked
setIsFollowing
```

---

## Expected Behavior

### Upvote Button
- **Not upvoted:** Shows empty thumbs up, count is neutral
- **Click once:** Fills thumbs up icon, count increases by 1
- **Click again:** Empties thumbs up icon, count decreases by 1

### Downvote Button
- **Not downvoted:** Shows empty thumbs down, count is neutral
- **Click once:** Fills thumbs down icon, count increases by 1
- **Click again:** Empties thumbs down icon, count decreases by 1

### Follow Button
- **Not following:** Shows "Follow" button (default variant)
- **Click once:** Changes to "Following" button (secondary variant)
- **Click again:** Changes back to "Follow" button

### Mutual Exclusivity
- Upvoting should remove any existing downvote
- Downvoting should remove any existing upvote
- Only one can be active at a time
