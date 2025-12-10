# Digital Ocean Spaces Configuration

## URLs and Endpoints

### Digital Ocean Spaces Base URL
```
https://blr1.digitaloceanspaces.com/dev.hiffi
```

**Details:**
- **Region**: `blr1` (Bangalore, India)
- **Bucket Name**: `dev.hiffi`
- **Endpoint Format**: `https://[region].digitaloceanspaces.com/[bucket-name]`

### API Base URL
```
https://beta.hiffi.com/api
```

## Storage Paths

### Video Files
- **Path**: `videos/{bridge_id}`
- **Access**: Pre-signed URLs (PUT method for uploads)
- **Example**: `https://blr1.digitaloceanspaces.com/dev.hiffi/videos/{bridge_id}`

### Thumbnail Files
- **Path**: `thumbnails/videos/{bridge_id}.jpg`
- **Access**: Public-read (no signed URLs needed)
- **Example**: `https://blr1.digitaloceanspaces.com/dev.hiffi/thumbnails/videos/{bridge_id}.jpg`

## Access Keys

**Note**: The actual Digital Ocean **Access Key ID** and **Secret Access Key** are NOT stored in the frontend codebase. They are managed server-side by the backend API.

### What the Frontend Receives:
- **Pre-signed URLs** from the backend API (`/videos/upload` endpoint)
- These URLs include:
  - Access Key ID in the URL parameters: `DO8014FH7W3MULW8FFP8` (visible in pre-signed URLs)
  - Signed headers and signature (server-generated)
  - Expiration time (typically 1200 seconds = 20 minutes)

### Where Keys Are Stored:
- **Backend API**: The secret keys are stored server-side
- **Frontend**: Only receives pre-signed URLs, never the secret keys

## Upload Flow

1. **Create Upload Bridge** (POST `/videos/upload`)
   - Backend generates pre-signed URLs using server-side credentials
   - Returns `gateway_url` and `gateway_url_thumbnail`

2. **Upload Video** (PUT to `gateway_url`)
   - Frontend uploads video file directly to Digital Ocean Spaces
   - Uses the pre-signed URL provided by backend

3. **Upload Thumbnail** (PUT to `gateway_url_thumbnail`)
   - Frontend uploads thumbnail image directly to Digital Ocean Spaces
   - Uses the pre-signed URL provided by backend

4. **Acknowledge Upload** (POST `/videos/upload/ack/{bridge_id}`)
   - Notifies backend that uploads are complete

## Configuration Files

### Frontend Files:
- `lib/storage.ts` - Contains `SPACES_BASE_URL` constant
- `lib/api-client.ts` - Contains API base URL and upload methods

### Backend Files:
- Server-side configuration (not in this repo)
- Contains actual Digital Ocean credentials
- Generates pre-signed URLs for secure uploads

## Security Notes

1. **Never expose Secret Access Keys** in frontend code
2. **Use pre-signed URLs** for temporary upload access
3. **Set expiration times** on pre-signed URLs (20 minutes typical)
4. **Bucket permissions** should be configured properly:
   - Videos: Private with pre-signed URL access
   - Thumbnails: Public-read for easy access

## Example Pre-signed URL Structure

```
https://blr1.digitaloceanspaces.com/dev.hiffi/videos/{bridge_id}?
  X-Amz-Algorithm=AWS4-HMAC-SHA256&
  X-Amz-Credential=DO8014FH7W3MULW8FFP8/{date}/{region}/s3/aws4_request&
  X-Amz-Date={timestamp}&
  X-Amz-Expires=1200&
  X-Amz-SignedHeaders=host&
  x-id=PutObject&
  X-Amz-Signature={signature}
```

## To Get Full Credentials

If you need the actual **Access Key ID** and **Secret Access Key**, you need to:

1. **Check the backend server** environment variables or config files
2. **Check Digital Ocean dashboard** → API → Spaces Keys
3. **Ask the backend developer** who set up the integration

The frontend codebase intentionally does NOT contain these credentials for security reasons.

