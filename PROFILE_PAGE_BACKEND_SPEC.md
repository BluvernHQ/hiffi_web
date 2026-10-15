# Profile Page & Edit — Backend Spec

**Audience:** Backend developers  
**Frontend surfaces:** `/profile/{username}`, `/profile/{username}/edit`  
**Frontend sources of truth:**
- `components/profile/edit-artist-profile-form.tsx`
- `components/profile/profile-inventory-view.tsx` / `profile-personal-view.tsx` / `profile-member-view.tsx`
- `lib/artist-index/map-user-profile-to-artist.ts`
- `lib/api-client.ts` (`getUserByUsername`, `updateSelfUser`, `getProfilePhotoUploadUrl`, `verifyEmailUpdate`)

---

## 1. Goal

Support the new Artist Index–style profile page and full-page editor. The frontend already reads/writes most profile fields via existing user endpoints. The main gap is **banner image** (display + upload). Social / bio / streaming fields must be persisted and returned on `GET /users/{username}`.

---

## 2. User model — required fields

Return these on `GET /users/{username}` (and on successful `PUT /users/self`). Prefer snake_case keys as listed; frontend also tolerates a few aliases (noted below).

### 2.1 Identity & display

| Field | Type | Required | Notes |
|---|---|---|---|
| `uid` | string | yes | Stable user id |
| `username` | string | yes | Immutable via profile edit |
| `name` | string | yes | Display name |
| `role` | `"user" \| "creator" \| "admin"` | yes | Drives creator vs member UI |
| `email` | string | own profile only | Public reveal is separate |
| `bio` | string | no | Max **2000** chars (frontend) |
| `location` | string | no | Free text, often `"City, ST"` |
| `profile_picture` | string \| null | no | Workers path or absolute URL |
| **`banner_image`** | string \| null | no | **Cover/banner.** Workers path or absolute URL. Alias accepted by FE: `cover_image` |
| `genre` | string \| string[] | no | Read-only in edit UI for now |
| `created_at` | ISO string | yes | “Joined” date |
| `updated_at` | ISO string | yes | Cache bust / SEO |

### 2.2 Stats (read-only)

| Field | Type | Notes |
|---|---|---|
| `followers` | number | Also accept `follower_count` |
| `following` | number | Count of people this user follows |
| `total_videos` | number | Profile video tab / stats |

### 2.3 Social & streaming (editable)

Persisted on the **user** record and echoed on GET. Frontend sends **diff-only** on save.

| Field | Type | Section in edit UI |
|---|---|---|
| `instagram` | string | Social Profiles |
| `youtube` | string | Streaming Platforms |
| `tiktok` | string | Social Profiles |
| `facebook` | string | Social Profiles |
| `spotify` | string | Streaming Platforms |
| `apple_music` | string | Streaming Platforms |
| `soundcloud` | string | Streaming Platforms |
| `website` | string | Streaming Platforms |

**Aliases accepted when reading (do not need to write both):**
- `instagram` ↔ `instagram_url`
- `youtube` ↔ `youtube_url`
- `tiktok` ↔ `tiktok_url`
- `facebook` ↔ `facebook_url`
- `spotify` ↔ `spotify_url`
- `apple_music` ↔ `appleMusic`
- `banner_image` ↔ `cover_image` (display only; **write `banner_image`**)

Empty string on PUT should clear the field.

### 2.4 Sibling fields on GET response (not inside `user`)

| Field | Type | Notes |
|---|---|---|
| `following` | boolean | Whether the **viewer** follows this user |
| `in_inventory` | boolean | Username has an Artist Index inventory listing |

Example shape:

```json
{
  "success": true,
  "data": {
    "user": { "...full user model..." },
    "following": false,
    "in_inventory": true
  }
}
```

---

## 3. Endpoints the profile UI uses today

### 3.1 Load profile

`GET /users/{username}`  
Auth: required (JWT)

Must return the expanded user model in §2, including `banner_image`, socials, bio, location.

### 3.2 Update profile fields

`PUT /users/self`  
Auth: required

**Request body (all optional, diff-only from frontend):**

```json
{
  "name": "Artist Name",
  "email": "new@email.com",
  "bio": "Up to 2000 characters",
  "location": "Atlanta, GA",
  "website": "https://example.com",
  "instagram": "https://instagram.com/handle",
  "youtube": "https://youtube.com/@handle",
  "tiktok": "https://tiktok.com/@handle",
  "facebook": "https://facebook.com/page",
  "spotify": "https://open.spotify.com/artist/...",
  "apple_music": "https://music.apple.com/...",
  "soundcloud": "https://soundcloud.com/...",
  "profile_picture": "users/{uid}/profile.jpg",
  "banner_image": "users/{uid}/banner.jpg"
}
```

**Rules:**
- Username is **not** updatable here
- Persist and return every field above
- Email change may return OTP challenge: `{ "success": true, "data": { "id": "...", "message": "..." } }` then complete via `POST /users/self/verify-update`
- Clearing: accept `""` for optional string fields (including `profile_picture` and `banner_image`)

### 3.3 Verify email change

`POST /users/self/verify-update`

```json
{ "id": "otp-id", "otp": "123456" }
```

### 3.4 Profile picture upload (existing)

1. `POST /users/profile-photo/upload` → `{ gateway_url, path }`
2. Client `PUT`s binary JPG to `gateway_url`
3. `PUT /users/self` with `{ "profile_picture": "<path>" }`

Constraints (frontend): JPG only, max 10MB.

---

## 4. Banner image — required backend work

### 4.1 Why

Creator profiles render a full-bleed hero from `artist.banner_image` (`ArtistDetailHero`). Mapping reads:

```
user.banner_image ?? user.cover_image ?? user.coverUrl
```

Inventory listings already have `banner_image` on `PublicInventoryProfile`. Hiffi user profiles need the same field on the **user** model so non-inventory creators (and inventory users without a linked inventory banner) still show a cover.

Edit UI currently shows **“Banner upload is coming soon”**. Once upload APIs exist, frontend will mirror the avatar flow.

### 4.2 Storage field

| Field | Type | Description |
|---|---|---|
| `banner_image` | string \| null | Relative Workers path **or** absolute HTTPS URL |

Recommended path pattern (mirror profile photo): `users/{uid}/banner.jpg`

### 4.3 Upload endpoint (new — mirror profile photo)

**`POST /users/banner-photo/upload`** (name can match existing conventions)

Auth: required

**Response:**

```json
{
  "success": true,
  "data": {
    "gateway_url": "https://...presigned-put...",
    "path": "users/{uid}/banner.jpg",
    "message": "Upload URL generated"
  }
}
```

**Then:**
1. Client uploads binary to `gateway_url` (same as profile photo)
2. Client calls `PUT /users/self` with `{ "banner_image": "<path>" }`

### 4.4 Clear banner

`PUT /users/self` with `{ "banner_image": "" }` → store null / empty; GET returns null/omit.

### 4.5 Constraints (recommended)

| Rule | Value |
|---|---|
| Formats | JPG (align with profile photo; PNG/WebP optional if Workers supports) |
| Max size | 10MB |
| Aspect ratio | ~**3:1** wide (hero uses full-bleed `object-cover`) |
| Suggested min width | 1500px |

### 4.6 Display priority (frontend)

For creator profiles:

1. Inventory `banner_image` (when `in_inventory` and inventory has one)
2. Else user `banner_image` / `cover_image`
3. Else gradient fallback (no image)

For member profiles: if `banner_image` (or `coverUrl`) is set, show it; else generated default banner.

### 4.7 Inventory sync (optional but recommended)

When a claimed inventory artist updates `banner_image` on their Hiffi user, either:

- Keep inventory `banner_image` as source of truth and sync user ↔ inventory, **or**
- Prefer user `banner_image` on `/profile/{username}` and keep inventory banner for Artist Index pages

Document which wins so FE mapping stays consistent.

---

## 5. Example GET response (target)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "uid": "abc123",
      "username": "lilatlanta",
      "name": "Lil Atlanta",
      "role": "creator",
      "email": "artist@example.com",
      "bio": "Atlanta-based artist.",
      "location": "Atlanta, GA",
      "genre": "Rap / Hip-Hop",
      "profile_picture": "users/abc123/profile.jpg",
      "banner_image": "users/abc123/banner.jpg",
      "website": "https://lilatlanta.com",
      "instagram": "https://instagram.com/lilatlanta",
      "youtube": "https://youtube.com/@lilatlanta",
      "tiktok": "https://tiktok.com/@lilatlanta",
      "facebook": "https://facebook.com/lilatlanta",
      "spotify": "https://open.spotify.com/artist/...",
      "apple_music": "https://music.apple.com/...",
      "soundcloud": "https://soundcloud.com/lilatlanta",
      "followers": 1200,
      "following": 80,
      "total_videos": 24,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2026-03-20T14:22:00Z"
    },
    "following": false,
    "in_inventory": true
  }
}
```

---

## 6. Validation

| Field | Rule |
|---|---|
| `name` | Non-empty after trim; length per existing name rules |
| `bio` | ≤ 2000 characters |
| `email` | Valid email; OTP flow on change |
| Social / streaming URLs | Prefer full `https://` URLs; store as provided |
| `username` | Reject updates on `PUT /users/self` |
| `profile_picture` / `banner_image` | Path owned by authenticated user, or allowed absolute URL |

---

## 7. Related endpoints (already used; no change required unless broken)

| Method | Endpoint | Use |
|---|---|---|
| `GET` | `/videos/list/{username}` | Profile videos grid |
| `POST` | `/social/users/follow/{username}` | Follow |
| `POST` | `/social/users/unfollow/{username}` | Unfollow |
| `POST` | `/users/profile-photo/upload` | Avatar presign |
| `POST` | `/users/self/verify-update` | Email OTP |

---

## 8. Backend checklist

- [ ] Persist `bio`, `location`, `website`, and all social/streaming fields on user
- [ ] Return those fields on `GET /users/{username}`
- [ ] Accept them on `PUT /users/self` (diff-only, empty string clears)
- [ ] Add **`banner_image`** column / field on user
- [ ] Return `banner_image` on GET
- [ ] Accept `banner_image` on `PUT /users/self`
- [ ] Add **`POST /users/banner-photo/upload`** (presigned URL + path), mirroring profile photo
- [ ] Ensure Workers/CDN serves banner paths the same way as profile pictures
- [ ] Keep returning `following` + `in_inventory` siblings on GET
- [ ] Document inventory vs user banner precedence if both exist

---

## 9. Frontend follow-up (after backend ships)

1. Wire banner picker in `EditArtistProfileForm` (replace “Coming soon”)
2. Call banner upload → `updateSelfUser({ banner_image: path })`
3. Pass `currentBannerImage` into the edit form and show live preview
4. Stop relying solely on inventory for creator covers

---

## Changelog

- Initial spec for new profile page + edit sections, including banner image upload/display requirements
