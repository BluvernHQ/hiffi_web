# Videos API Documentation

This document provides comprehensive API documentation for the Videos endpoints in the Hifi backend.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Video Model](#video-model)
- [Endpoints](#endpoints)
  - [Upload Video](#1-upload-video)
  - [Upload Acknowledgment](#2-upload-acknowledgment)
  - [Get Video](#3-get-video)
  - [Delete Video](#4-delete-video)
  - [List Videos](#5-list-videos)
  - [List Self Videos](#6-list-self-videos)
- [Error Responses](#error-responses)

---

## Overview

The Videos API provides endpoints for uploading, retrieving, deleting, and listing videos. The system supports video uploads with a two-phase process (upload initiation and acknowledgment) and deterministic random pagination for listing videos.

**Base Path:** `/videos`

---

## Authentication

Most endpoints require authentication via JWT token. The token should be included in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The token is validated using the `Auth.GetClaims` function, which extracts and validates the JWT claims from the request.

**Note:** The `GetVideo` endpoint does not require authentication, but authenticated users will receive additional information (upvote/downvote status).

---

## Video Model

The Video object contains the following fields:

```json
{
  "id": 1,
  "video_id": "string",
  "video_url": "string",
  "video_thumbnail": "string",
  "video_title": "string",
  "video_description": "string",
  "video_tags": ["tag1", "tag2"],
  "video_views": 0,
  "video_upvotes": 0,
  "video_downvotes": 0,
  "video_comments": 0,
  "user_uid": "string",
  "user_username": "string",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Field Descriptions:**
- `id`: Internal database ID (integer, not included in JSON responses)
- `video_id`: Unique video identifier (string, 64-character hex)
- `video_url`: Storage path for the video file (string)
- `video_thumbnail`: Storage path for the video thumbnail (string)
- `video_title`: Title of the video (string)
- `video_description`: Description of the video (string)
- `video_tags`: Array of tags associated with the video (array of strings)
- `video_views`: Number of views (integer)
- `video_upvotes`: Number of upvotes (integer)
- `video_downvotes`: Number of downvotes (integer)
- `video_comments`: Number of comments (integer)
- `user_uid`: UID of the user who uploaded the video (string)
- `user_username`: Username of the user who uploaded the video (string)
- `created_at`: Video creation timestamp (ISO 8601)
- `updated_at`: Last update timestamp (ISO 8601)

---

## Endpoints

### 1. Upload Video

Initiates a video upload by creating a bridge/placeholder in the database and generating presigned URLs for uploading the video and thumbnail files.

**Endpoint:** `POST /videos/upload`

**Authentication:** Required

**Request Body:**
```json
{
  "video_title": "My Video Title",
  "video_description": "Description of my video",
  "video_tags": ["tag1", "tag2", "tag3"],
  "video_views": 0,
  "video_upvotes": 0,
  "video_downvotes": 0,
  "video_comments": 0
}
```

**Request Example:**
```http
POST /videos/upload
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "video_title": "Amazing Video",
  "video_description": "This is an amazing video",
  "video_tags": ["gaming", "funny", "entertainment"]
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "bridge created",
  "bridge_id": "abc123def456...",
  "gateway_url": "https://storage.example.com/presigned-upload-url",
  "gateway_url_thumbnail": "https://storage.example.com/presigned-upload-url-thumbnail"
}
```

**Response Fields:**
- `bridge_id`: Unique video ID (use this in the upload acknowledgment endpoint)
- `gateway_url`: Presigned URL for uploading the video file (valid for 20 minutes)
- `gateway_url_thumbnail`: Presigned URL for uploading the thumbnail image (valid for 20 minutes)

**Error Responses:**
- `400 Bad Request`: Failed to decode video
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: User not found
- `500 Internal Server Error`: 
  - Failed to fetch user
  - Failed to insert video on upload
  - Failed to generate presigned upload URL

**Notes:**
- The video is initially stored in the `video_on_upload` table
- After uploading files to the presigned URLs, call the Upload Acknowledgment endpoint
- Presigned URLs expire after 20 minutes
- The `bridge_id` is generated using a hash of user UID, timestamp, and UUID

---

### 2. Upload Acknowledgment

Confirms that video and thumbnail files have been successfully uploaded. Moves the video from `video_on_upload` to the main `videos` table and makes it publicly available.

**Endpoint:** `POST /videos/upload/ack/{videoID}`

**Authentication:** Required

**URL Parameters:**
- `videoID` (string, required): The bridge_id returned from the Upload endpoint

**Request Example:**
```http
POST /videos/upload/ack/abc123def456...
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "video uploaded"
}
```

**Error Responses:**
- `400 Bad Request`: Video ID is required
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: You do not own this video
- `404 Not Found`: 
  - Video file not found
  - Thumbnail file not found
  - Video not found in upload queue
- `500 Internal Server Error`: 
  - Failed to fetch video
  - Failed to delete video on upload
  - Failed to insert video
  - Failed to update user
  - Failed to update ACL

**Notes:**
- Verifies that both video and thumbnail files exist in storage
- Only the video owner can acknowledge their own upload
- Updates the user's `total_videos` count
- Updates file ACLs to make videos publicly accessible
- The video becomes publicly available after successful acknowledgment

---

### 3. Get Video

Retrieves video information and generates a presigned URL for viewing the video.

**Endpoint:** `GET /videos/{videoID}`

**Authentication:** Optional (provides additional information if authenticated)

**URL Parameters:**
- `videoID` (string, required): The video ID to retrieve

**Request Example:**
```http
GET /videos/abc123def456...
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "video_url": "https://black-paper-83cf.hiffi.workers.dev/videos/abc123...",
  "upvoted": false,
  "downvoted": false
}
```

**Response Fields:**
- `video_url`: Workers URL for accessing the video (format: `https://black-paper-83cf.hiffi.workers.dev/videos/{videoID}`)
- `upvoted`: Whether the authenticated user has upvoted this video (boolean, only if authenticated)
- `downvoted`: Whether the authenticated user has downvoted this video (boolean, only if authenticated)
- `put_view_error`: Error message if view tracking failed (optional, only if error occurred)

**Error Responses:**
- `400 Bad Request`: Video ID is required
- `404 Not Found`: Video not found
- `500 Internal Server Error`: Failed to fetch video

**Notes:**
- The `video_url` points to a Cloudflare Workers endpoint
- When requesting the video from the Workers URL, include the header: `x-api-key: SECRET_KEY`
- The video URL does not expire (unlike presigned URLs)

**Notes:**
- The endpoint automatically tracks a view when accessed
- The `video_url` uses a Cloudflare Workers endpoint that does not expire
- **Important**: When requesting the video from the Workers URL, include the header: `x-api-key: SECRET_KEY`
- If not authenticated, `upvoted` and `downvoted` will be `false`
- View tracking errors are included in the response but don't fail the request

---

### 4. Delete Video

Deletes a video from the system. Only the video owner can delete their own videos.

**Endpoint:** `DELETE /videos/delete/{videoID}`

**Authentication:** Required

**URL Parameters:**
- `videoID` (string, required): The video ID to delete

**Request Example:**
```http
DELETE /videos/delete/abc123def456...
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "video deleted"
}
```

**Error Responses:**
- `400 Bad Request`: Video ID is required
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: You do not own this video
- `404 Not Found`: Video not found
- `500 Internal Server Error`: 
  - Failed to fetch video
  - Failed to delete video

**Notes:**
- Deletes the video from the `videos` table
- Updates the user's `total_videos` count (decrements by 1)
- The video file and thumbnail remain in storage (consider adding cleanup if needed)

---

### 5. List Videos

Retrieves a paginated list of all videos using deterministic random pagination (stable shuffle). The results appear in a pseudo-random order that is consistent across pagination requests.

**Endpoint:** `POST /videos/list`

**Authentication:** Not required

**Request Body:**
```json
{
  "page": 1,
  "limit": 20,
  "seed": "my_custom_seed"
}
```

**Request Example:**
```http
POST /videos/list
Content-Type: application/json

{
  "page": 1,
  "limit": 10,
  "seed": "my_custom_seed"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "videos": [
    {
      "video_id": "abc123...",
      "video_url": "videos/abc123...",
      "video_thumbnail": "thumbnails/videos/abc123....jpg",
      "video_title": "Amazing Video",
      "video_description": "This is amazing",
      "video_tags": ["gaming", "funny"],
      "video_views": 150,
      "video_upvotes": 42,
      "video_downvotes": 2,
      "video_comments": 10,
      "user_uid": "user123...",
      "user_username": "johndoe",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "offset": 0,
  "count": 10,
  "seed": "my_custom_seed"
}
```

**Request Body Parameters:**
- `page` (integer, optional): Page number (starts at 1)
  - Default: `1`
  - Must be greater than 0
- `limit` (integer, optional): Number of videos per page
  - Default: `20`
  - Maximum: `100`
  - Must be greater than 0
- `seed` (string, optional): Seed for deterministic random pagination
  - If not provided, uses default seed: `"hifi_videos_shuffle_2024"`
  - Different seeds produce different shuffle orders
  - Same seed always produces the same order (stable shuffle)

**Error Responses:**
- `400 Bad Request`: 
  - Failed to read request body
  - Invalid request body
- `500 Internal Server Error`: 
  - Failed to fetch videos
  - Failed to iterate videos

**Notes:**
- Results use **deterministic random pagination** (stable shuffle) - the order appears random but is consistent across requests
- The `seed` parameter controls the shuffle order - same seed = same order, different seed = different order
- If no seed is provided, a default seed is used (`"hifi_videos_shuffle_2024"`)
- This ensures safe pagination: requesting page 1, then page 2 with the same seed will show different videos without duplicates or gaps
- The shuffle order is stable and will remain the same for all pagination requests using the same seed
- The response includes the `seed` value used (either provided or default) for reference
- Invalid `page` or `limit` values are adjusted to defaults

---

### 6. List Self Videos

Retrieves a paginated list of videos uploaded by the authenticated user, using deterministic random pagination.

**Endpoint:** `POST /videos/list/self`

**Authentication:** Required

**Request Body:**
```json
{
  "page": 1,
  "limit": 20,
  "seed": "my_custom_seed"
}
```

**Request Example:**
```http
POST /videos/list/self
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "page": 1,
  "limit": 10,
  "seed": "my_custom_seed"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "videos": [
    {
      "video_id": "abc123...",
      "video_url": "videos/abc123...",
      "video_thumbnail": "thumbnails/videos/abc123....jpg",
      "video_title": "My Video",
      "video_description": "My description",
      "video_tags": ["personal"],
      "video_views": 50,
      "video_upvotes": 10,
      "video_downvotes": 0,
      "video_comments": 5,
      "user_uid": "user123...",
      "user_username": "johndoe",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "offset": 0,
  "count": 10,
  "seed": "my_custom_seed"
}
```

**Request Body Parameters:**
- `page` (integer, optional): Page number (starts at 1)
  - Default: `1`
  - Must be greater than 0
- `limit` (integer, optional): Number of videos per page
  - Default: `20`
  - Maximum: `100`
  - Must be greater than 0
- `seed` (string, optional): Seed for deterministic random pagination
  - If not provided, uses default seed: `"hifi_videos_self_shuffle_2024"`
  - Different seeds produce different shuffle orders
  - Same seed always produces the same order (stable shuffle)

**Error Responses:**
- `400 Bad Request`: 
  - Failed to read request body
  - Invalid request body
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: 
  - Failed to fetch videos
  - Failed to iterate videos

**Notes:**
- Returns only videos uploaded by the authenticated user
- Uses the same deterministic random pagination as `ListVideo`
- Default seed is different from `ListVideo` (`"hifi_videos_self_shuffle_2024"`)
- All other pagination behavior is the same as `ListVideo`

---

## Error Responses

All error responses follow a consistent format:

```json
{
  "status": "error",
  "message": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400 Bad Request`: Invalid request parameters or body
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions (e.g., trying to delete another user's video)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side errors

---

## Implementation Notes

### Video Upload Flow

1. **Upload Initiation** (`POST /videos/upload`):
   - Creates a record in `video_on_upload` table
   - Generates presigned URLs for video and thumbnail upload
   - Returns bridge_id and upload URLs

2. **File Upload**:
   - Client uploads video file to `gateway_url`
   - Client uploads thumbnail image to `gateway_url_thumbnail`
   - Both uploads must complete within 20 minutes

3. **Upload Acknowledgment** (`POST /videos/upload/ack/{videoID}`):
   - Verifies files exist in storage
   - Moves video from `video_on_upload` to `videos` table
   - Updates file ACLs for public access
   - Updates user's video count

### Deterministic Random Pagination

Both `ListVideo` and `ListVideoSelf` use deterministic random pagination (stable shuffle):
- Uses PostgreSQL's `hashtext()` function with a seed
- Same seed produces the same order across requests
- Different seeds produce different orders
- Prevents duplicates and gaps during pagination
- Order appears random but is deterministic
- This ensures safe pagination: requesting page 1, then page 2 with the same seed will show different videos without duplicates or gaps

### File Storage

- Videos are stored in S3-compatible storage
- Video files: `videos/{videoID}`
- Thumbnails: `thumbnails/videos/{videoID}.jpg`
- Presigned URLs are used for secure upload/download
- URLs expire after 20 minutes

---

## Changelog

- Initial API documentation created
- Removed Vector Search endpoint (Qdrant integration removed)
- List endpoints now use deterministic random pagination exclusively

