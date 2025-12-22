# Video Player Page Implementation - How Instant Updates Work

This document explains how the video player page (`app/watch/[videoId]/page.tsx`) is implemented and how updates (following, views, comments, replies) appear instantly to users.

---

## 📋 **Overview: Update Strategies**

The video player uses **three main patterns** for instant updates:

1. **Optimistic Updates** - Update UI immediately, sync with API in background
2. **API Refresh Pattern** - Refetch data from API after mutations
3. **State Management** - React state updates that trigger immediate UI re-renders

**Note**: This is **NOT real-time** (no WebSockets). Updates appear "instant" because of optimistic updates and fast API calls.

---

## 🎯 **1. Following Status Updates**

### Implementation Pattern: **Optimistic Update + API Refresh**

**Location**: `app/watch/[videoId]/page.tsx` - `handleFollow()` function (lines 472-599)

### How It Works:

```typescript
const handleFollow = async () => {
  // 1. OPTIMISTIC UPDATE - Update UI immediately
  const newFollowingState = !isFollowing
  setIsFollowing(newFollowingState)  // ✅ UI updates instantly!
  
  // 2. API CALL - Update backend
  const response = await apiClient.followUser(username) // or unfollowUser
  
  // 3. REFRESH CREATOR DATA - Get updated follower count
  const creatorResponse = await apiClient.getUserByUsername(username)
  setVideoCreator(creatorResponse.user)  // Updates follower count
  
  // 4. ERROR HANDLING - Rollback if API fails
  // If error, revert optimistic update
  setIsFollowing(previousFollowingState)
}
```

### Flow:

1. **User clicks "Follow" button**
   - `setIsFollowing(true)` → Button instantly changes to "Following"
   - User sees immediate feedback ✅

2. **API call happens in background**
   - `apiClient.followUser(username)` updates backend
   
3. **Refresh creator profile**
   - `getUserByUsername()` fetches updated follower count
   - `setVideoCreator()` updates the follower count display
   
4. **Error handling**
   - If API fails, optimistic update is reverted
   - Button returns to previous state
   - Error toast shown

### Key Code Sections:

```typescript:472-599:app/watch/[videoId]/page.tsx
// Store previous state for rollback
const previousFollowingState = isFollowing
const previousFollowersCount = videoCreator?.followers || 0

try {
  setIsFollowingAction(true)
  
  // OPTIMISTIC UPDATE - UI changes instantly
  const newFollowingState = !isFollowing
  setIsFollowing(newFollowingState)

  if (previousFollowingState) {
    // Unfollowing
    await apiClient.unfollowUser(username)
    // Refresh creator data to get updated follower count
    const creatorResponse = await apiClient.getUserByUsername(username)
    setVideoCreator(creatorResponse.user)
  } else {
    // Following
    await apiClient.followUser(username)
    // Refresh creator data
    const creatorResponse = await apiClient.getUserByUsername(username)
    setVideoCreator(creatorResponse.user)
  }
} catch (error) {
  // ROLLBACK on error
  setIsFollowing(previousFollowingState)
  setVideoCreator({
    ...videoCreator,
    followers: previousFollowersCount,
  })
}
```

### Initial State Loading:

Follow status is loaded from `GET /videos/{videoId}` API response:

```typescript:217-221:app/watch/[videoId]/page.tsx
// Update follow state from getVideo API response
const followingStatus = videoResponse.following || false
console.log(`[hiffi] Setting follow state from getVideo API: following=${followingStatus}`)
setIsFollowing(followingStatus)
```

---

## 👍 **2. Like/Dislike (Upvote/Downvote) Updates**

### Implementation Pattern: **Optimistic Update + API Refresh**

**Location**: `app/watch/[videoId]/page.tsx` - `handleLike()` and `handleDislike()` functions

### How It Works:

```typescript
const handleLike = async () => {
  // 1. OPTIMISTIC UPDATE - Update counts immediately
  const wasLiked = isLiked
  setIsLiked(!wasLiked)
  
  // Update video object with new counts
  setVideo({
    ...video,
    video_upvotes: wasLiked ? currentUpvotes - 1 : currentUpvotes + 1,
    video_downvotes: wasDisliked ? currentDownvotes - 1 : currentDownvotes,
  })
  
  // 2. API CALL
  await apiClient.upvoteVideo(videoId)
  
  // 3. REFRESH - Get accurate counts from API
  const videosResponse = await apiClient.getVideoList(...)
  const updatedVideo = videosResponse.videos.find(...)
  setVideo(updatedVideo)  // Sync with server data
}
```

### Flow:

1. **User clicks like button**
   - `setIsLiked(true)` → Thumbs up icon fills instantly
   - `setVideo({ video_upvotes: count + 1 })` → Count increments immediately
   - User sees instant feedback ✅

2. **API call**
   - `apiClient.upvoteVideo(videoId)` updates backend
   
3. **Refresh from API**
   - `getVideoList()` fetches updated video data
   - `setVideo()` syncs with accurate server counts
   
4. **Error handling**
   - If API fails, optimistic state remains (user may see slightly incorrect count until refresh)

### Key Code Sections:

```typescript:324-396:app/watch/[videoId]/page.tsx
const handleLike = async () => {
  await apiClient.upvoteVideo(videoId)
  
  // OPTIMISTIC UPDATE
  const wasLiked = isLiked
  setIsLiked(!wasLiked)
  setIsDisliked(false)
  
  // Update counts optimistically
  if (video) {
    setVideo({
      ...video,
      video_upvotes: wasLiked ? currentUpvotes - 1 : (wasDisliked ? currentUpvotes + 1 : currentUpvotes + 1),
      video_downvotes: wasDisliked ? currentDownvotes - 1 : currentDownvotes,
    })
  }

  // REFRESH - Get accurate data from API
  const videosResponse = await apiClient.getVideoList({ offset: 0, limit: 6, seed })
  const updatedVideo = videosResponse.videos.find((v: any) => (v.video_id || v.videoId) === videoId)
  if (updatedVideo) {
    setVideo(updatedVideo)
  }
}
```

### Initial State Loading:

Vote status loaded from `GET /videos/{videoId}` API:

```typescript:209-215:app/watch/[videoId]/page.tsx
// Update vote state from getVideo API response
setUpvoteState({
  upvoted: videoResponse.upvoted || false,
  downvoted: videoResponse.downvoted || false,
})
setIsLiked(videoResponse.upvoted || false)
setIsDisliked(videoResponse.downvoted || false)
```

---

## 💬 **3. Comments Updates**

### Implementation Pattern: **API Refresh Pattern**

**Location**: `components/video/comment-section.tsx` - `handleSubmit()` function

### How It Works:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // 1. API CALL - Post comment to backend
  await apiClient.postComment(videoId, newComment.trim())
  
  // 2. CLEAR INPUT - Immediate UI feedback
  setNewComment("")
  
  // 3. REFRESH COMMENTS - Fetch updated list
  await fetchComments()  // Refetches all comments from API
}
```

### Flow:

1. **User submits comment**
   - `apiClient.postComment()` posts to backend
   - `setNewComment("")` → Input field clears immediately
   
2. **Refresh comments list**
   - `fetchComments()` calls `GET /comments/{videoId}`
   - `setComments(response.comments)` → New comment appears in list
   
3. **Comment count updates**
   - Comment count in video metadata may be stale (not explicitly refreshed here)
   - Would need to refresh video data to update comment count

### Key Code Sections:

```typescript:78-104:components/video/comment-section.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!newComment.trim() || !user) return

  try {
    setIsSubmitting(true)
    
    // API CALL
    await apiClient.postComment(videoId, newComment.trim())

    toast({
      title: "Success",
      description: "Comment posted successfully",
    })

    // IMMEDIATE UI UPDATE
    setNewComment("")
    
    // REFRESH COMMENTS LIST
    await fetchComments()  // Refetches from API
  } catch (error) {
    // Error handling
  }
}
```

### Comment Loading:

```typescript:50-76:components/video/comment-section.tsx
const fetchComments = async () => {
  try {
    setIsLoading(true)
    const response = await apiClient.getComments(videoId, 1, 20)
    if (response.success) {
      setComments(response.comments || [])  // Updates UI
      setHasMore(totalLoaded < response.count)
    }
  } finally {
    setIsLoading(false)
  }
}
```

---

## 💬 **4. Reply Updates**

### Implementation Pattern: **Optimistic Update + API Refresh**

**Location**: `components/video/comment-section.tsx` - `handleReplySubmit()` function

### How It Works:

```typescript
const handleReplySubmit = async (e: React.FormEvent) => {
  // 1. OPTIMISTIC UPDATE - Add reply immediately
  const optimisticReply: Reply = {
    reply_id: `temp-${Date.now()}`,
    reply: replyTextToPost,
    // ... other fields
  }
  setShowReplies(true)
  setReplies([...replies, optimisticReply])  // ✅ Shows instantly!
  setReplyText("")  // Clear input
  
  // 2. API CALL
  await apiClient.postReply(comment.comment_id, replyTextToPost)
  
  // 3. REFRESH REPLIES - Get actual reply data
  await fetchReplies()  // Replaces optimistic reply with real one
}
```

### Flow:

1. **User submits reply**
   - Creates temporary reply object with `temp-${Date.now()}` ID
   - `setReplies([...replies, optimisticReply])` → Reply appears instantly
   - `setReplyText("")` → Input clears
   - User sees immediate feedback ✅

2. **API call**
   - `apiClient.postReply()` posts to backend
   
3. **Refresh replies**
   - `fetchReplies()` fetches all replies from API
   - Temporary reply is replaced with real reply (with actual ID)
   
4. **Error handling**
   - If API fails, remove optimistic reply:
   ```typescript
   setReplies(replies.filter(r => !r.reply_id.startsWith('temp-')))
   ```

### Key Code Sections:

```typescript:240-295:components/video/comment-section.tsx
const handleReplySubmit = async (e: React.FormEvent) => {
  try {
    setIsSubmittingReply(true)
    
    // OPTIMISTIC UPDATE - Create temporary reply
    const optimisticReply: Reply = {
      reply_id: `temp-${Date.now()}`,
      replied_by: userData?.uid || "",
      reply_by_username: userData?.username || "",
      replied_to: comment.comment_id,
      replied_at: new Date().toISOString(),
      reply: replyTextToPost,
    }
    
    // Show reply immediately
    setShowReplies(true)
    setReplies([...replies, optimisticReply])
    setReplyText("")
    setShowReplyInput(false)
    
    // API CALL
    await apiClient.postReply(comment.comment_id, replyTextToPost)

    // REFRESH - Get actual reply data
    await fetchReplies()  // Replaces temp reply with real one
    
    // Notify parent to refresh comments count
    if (onReplyAdded) {
      onReplyAdded()  // Calls fetchComments() to update comment.reply_count
    }
  } catch (error) {
    // ROLLBACK on error
    setReplies(replies.filter(r => !r.reply_id.startsWith('temp-')))
  }
}
```

---

## 👀 **5. Video Views**

### Implementation Pattern: **Backend-Handled (No Frontend Tracking)**

**Location**: Views are **NOT explicitly tracked** in the frontend code

### How It Works:

1. **Views are tracked by the backend** when `GET /videos/{videoId}` is called
2. **Frontend only displays** the view count from the API response
3. **No instant update** - view count updates when page refreshes or video data is refetched

### Display:

```typescript:778:app/watch/[videoId]/page.tsx
<span>{(video.videoViews || video.video_views || 0).toLocaleString()} views</span>
```

### Current Behavior:

- Views are incremented on backend when video is loaded
- Frontend displays the count from initial API response
- Count doesn't update during the session (would need to refetch video data)

### Potential Enhancement:

To make views update instantly (if needed):

```typescript
// Could add optimistic increment
const handleViewTrack = () => {
  setVideo({
    ...video,
    video_views: (video.video_views || 0) + 1
  })
}

// Then track view when video starts playing
useEffect(() => {
  if (videoRef.current && !hasTrackedView) {
    videoRef.current.addEventListener('play', handleViewTrack)
    setHasTrackedView(true)
  }
}, [])
```

---

## 🔄 **Update Pattern Summary**

| Feature | Pattern | Instant Update | API Sync | Error Handling |
|---------|---------|----------------|----------|----------------|
| **Following** | Optimistic + Refresh | ✅ Yes | ✅ Yes | ✅ Rollback |
| **Like/Dislike** | Optimistic + Refresh | ✅ Yes | ✅ Yes | ⚠️ Keep optimistic |
| **Comments** | Refresh Only | ⚠️ After API | ✅ Yes | ✅ Error toast |
| **Replies** | Optimistic + Refresh | ✅ Yes | ✅ Yes | ✅ Remove temp |
| **Views** | Backend Only | ❌ No | ❌ N/A | ❌ N/A |

---

## 🏗️ **Architecture: State Management**

### State Variables:

```typescript
// Main video data
const [video, setVideo] = useState<any>(null)

// Interaction states
const [isFollowing, setIsFollowing] = useState(false)
const [isLiked, setIsLiked] = useState(false)
const [isDisliked, setIsDisliked] = useState(false)

// Comments (in CommentSection component)
const [comments, setComments] = useState<Comment[]>([])
const [replies, setReplies] = useState<Reply[]>([])
```

### How React Makes Updates "Instant":

1. **State update triggers re-render**
   ```typescript
   setIsFollowing(true)  // React re-renders component immediately
   ```

2. **UI reflects new state**
   ```tsx
   <Button>{isFollowing ? "Following" : "Follow"}</Button>
   // Button text changes instantly when state updates
   ```

3. **API call happens asynchronously**
   ```typescript
   await apiClient.followUser(username)  // Happens in background
   ```

---

## 📡 **API Calls Used**

### Initial Load:
- `GET /videos/{videoId}` - Gets video data, streaming URL, vote status, follow status
- `POST /videos/list` - Gets video metadata and related videos
- `GET /users/{username}` - Gets creator profile data (if authenticated)

### Updates:
- `POST /social/users/follow/{username}` - Follow user
- `POST /social/users/unfollow/{username}` - Unfollow user
- `POST /social/videos/upvote/{videoId}` - Upvote video
- `POST /social/videos/downvote/{videoId}` - Downvote video
- `POST /social/videos/comments/{videoId}` - Post comment
- `GET /social/videos/comments/{videoId}` - Get comments
- `POST /social/videos/comments/{commentId}/replies` - Post reply
- `GET /social/videos/comments/{commentId}/replies` - Get replies

---

## ⚡ **Why Updates Feel "Instant"**

1. **Optimistic Updates** - UI changes before API responds
2. **Fast API Calls** - Backend responds quickly (<200ms typically)
3. **React State Management** - Immediate re-renders on state change
4. **No Page Refresh** - Single Page Application (SPA) behavior

### Timeline Example (Follow Button):

```
0ms:    User clicks "Follow" button
1ms:    setIsFollowing(true) → Button shows "Following" ✅
2ms:    API call starts (async)
150ms:  API responds successfully
151ms:  getUserByUsername() called
200ms:  setVideoCreator() → Follower count updates
```

**User Perception**: Update appears instant (1ms) even though API takes 150ms

---

## 🔍 **Limitations & Notes**

### Current Limitations:

1. **No Real-Time Updates**
   - Updates from other users don't appear until page refresh
   - Would need WebSockets/SSE for real-time sync

2. **Comment Count Not Refreshed**
   - Video comment count doesn't update after posting comment
   - Would need to refetch video data

3. **Views Not Updated in UI**
   - View count only updates on page refresh
   - Could add optimistic increment if needed

4. **No Conflict Resolution**
   - If two users interact simultaneously, last write wins
   - No optimistic UI conflict handling

### Potential Improvements:

1. **WebSocket Integration** - Real-time updates across users
2. **Periodic Refresh** - Poll for updates every N seconds
3. **Server-Sent Events (SSE)** - Push updates from server
4. **Optimistic Comment Count** - Increment comment count on post
5. **Optimistic View Tracking** - Increment views immediately

---

## 📝 **Code References**

- **Main Page**: `app/watch/[videoId]/page.tsx`
- **Comment Section**: `components/video/comment-section.tsx`
- **Video Player**: `components/video/video-player.tsx`
- **API Client**: `lib/api-client.ts`

---

## 🎯 **Key Takeaways**

1. **Optimistic Updates** make UI feel instant (follow, likes, replies)
2. **API Refresh** ensures data accuracy after mutations
3. **React State** triggers immediate UI updates
4. **No Real-Time** - updates are user-action driven, not live
5. **Error Handling** includes rollback for critical operations

The "instant" feel comes from updating the UI optimistically before waiting for the API response, combined with fast backend responses.
