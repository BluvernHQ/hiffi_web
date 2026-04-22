# Playlists API

Owner-only playlist module.

- All endpoints require authentication.
- A user can only access playlists where `owner_uid` is their own UID.
- Playlist creation requires one initial `video_id`.

Base route: `/playlists`

## Endpoints

### `POST /playlists/create`

Create a new playlist with one required initial video.

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

Success response (`200`):

```json
{
  "success": true,
  "data": [
    {
      "playlist_id": "uuid",
      "owner_uid": "user_uid",
      "title": "My Favorites",
      "description": "optional",
      "created_at": "2026-04-20T10:00:00Z",
      "updated_at": "2026-04-20T10:30:00Z"
    }
  ]
}
```

---

### `GET /playlists/{playlistID}`

Get one owned playlist with ordered items.

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
        "video_id": "video_123",
        "position": 1,
        "added_at": "2026-04-20T10:00:00Z"
      }
    ]
  }
}
```

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

## Common Errors

- `401 Unauthorized` - missing/invalid auth token.
- `404 Not Found` - playlist/video not found, or playlist not owned by user.
- `400 Bad Request` - missing/invalid body fields.
- `500 Internal Server Error` - database or server failure.
