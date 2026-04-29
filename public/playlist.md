# Playlists API

Owner-only playlist module.

- All endpoints require authentication.
- A user can only access playlists where `owner_uid` is their own UID.
- Playlist creation requires one initial `video_id`.

Base route: `/playlists`

Pagination for playlist `GET` endpoints follows the same style as `Events/Videos/Videos.go`:

- Query params: `limit`, `offset`
- Response fields: `limit`, `offset`, `count`

## Quick Route List

- `GET /playlists/curated`
- `GET /playlists/curated/{playlistID}`
- `POST /playlists/create`
- `GET /playlists/list/self`
- `GET /playlists/{playlistID}`
- `PUT /playlists/{playlistID}`
- `DELETE /playlists/{playlistID}`
- `POST /playlists/{playlistID}/items/add`
- `DELETE /playlists/{playlistID}/items/{videoID}`
- `PUT /playlists/{playlistID}/items/reorder`

## Endpoints

### `GET /playlists/curated`

List all playlists created by admin users, ordered by `updated_at DESC`.
This endpoint is public and does not require authentication.

Query params:

- `limit` (optional, default `20`, max `100`)
- `offset` (optional, default `0`)

---

### `GET /playlists/curated/{playlistID}`

Get one curated (admin-owned) playlist with ordered items.
This endpoint is public and does not require authentication.

Query params (for items pagination):

- `limit` (optional, default `20`, max `100`)
- `offset` (optional, default `0`)

---

### `POST /playlists/create`

Create a new playlist with one required initial video.
`video_id` must exist in `videos`.

Request body:

```json
{
  "title": "My Favorites",
  "description": "optional description",
  "video_id": "video_123"
}
```

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "playlist_id": "uuid",
    "title": "My Favorites",
    "description": "optional description",
    "video_id": "video_123"
  }
}
```

---

### `GET /playlists/list/self`

List all playlists owned by the authenticated user, ordered by `updated_at DESC`.

Query params:

- `limit` (optional, default `20`, max `100`)
- `offset` (optional, default `0`)

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "playlist_id": "uuid",
        "owner_uid": "user_uid",
        "title": "My Favorites",
        "description": "optional",
        "created_at": "2026-04-20T10:00:00Z",
        "updated_at": "2026-04-20T10:30:00Z"
      }
    ],
    "limit": 20,
    "offset": 0,
    "count": 1
  }
}
```

---

### `GET /playlists/{playlistID}`

Get one owned playlist with ordered items.

Query params (for items pagination):

- `limit` (optional, default `20`, max `100`)
- `offset` (optional, default `0`)

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "playlist": {
      "playlist_id": "uuid",
      "owner_uid": "user_uid",
      "title": "My Favorites",
      "description": "optional",
      "created_at": "2026-04-20T10:00:00Z",
      "updated_at": "2026-04-20T10:30:00Z"
    },
    "items": [
      {
        "position": 1,
        "added_at": "2026-04-20T10:00:00Z",
        "video": {
          "video_id": "video_123",
          "video_url": "videos/video_123/original.mp4",
          "video_thumbnail": "thumbnails/videos/video_123.jpg",
          "video_title": "My video",
          "video_description": "description",
          "video_tags": ["tag1"],
          "video_views": 0,
          "video_upvotes": 0,
          "video_downvotes": 0,
          "video_comments": 0,
          "user_uid": "user_uid",
          "user_username": "username",
          "original_profile": "1080p",
          "profiles": ["1080p", "720p"],
          "hidden": false,
          "created_at": "2026-04-20T10:00:00Z",
          "updated_at": "2026-04-20T10:00:00Z"
        }
      }
    ],
    "limit": 20,
    "offset": 0,
    "count": 1
  }
}
```

`count` is the number of `items` returned in this response page.

---

### `PUT /playlists/{playlistID}`

Update playlist metadata.

Request body (one or both fields):

```json
{
  "title": "New title",
  "description": "New description"
}
```

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

---

### `DELETE /playlists/{playlistID}`

Delete owned playlist.

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

### `POST /playlists/{playlistID}/items/add`

Add a video to the end of playlist.

Request body:

```json
{
  "video_id": "video_456"
}
```

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "added": true
  }
}
```

---

### `DELETE /playlists/{playlistID}/items/{videoID}`

Remove a video from playlist. Remaining positions are compacted to `1..n`.

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "removed": true
  }
}
```

---

### `PUT /playlists/{playlistID}/items/reorder`

Reorder all playlist items. `video_ids` must contain all current playlist items exactly once.

Request body:

```json
{
  "video_ids": ["video_456", "video_123", "video_789"]
}
```

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "reordered": true
  }
}
```

## Common Errors

- `401 Unauthorized` - missing/invalid auth token.
- `404 Not Found` - playlist/video not found, or playlist not owned by user.
- `400 Bad Request` - missing/invalid body fields.
- `500 Internal Server Error` - database or server failure.
