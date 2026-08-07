import { NextRequest, NextResponse } from 'next/server'
import { getWorkersApiKey, getWorkersBaseUrl } from '@/lib/storage'

/**
 * Profile picture proxy that fetches images from Workers with x-api-key header
 * This allows the browser to display profile pictures that require authentication
 * 
 * Path: /proxy/profile-picture/[...path]
 * Example: /proxy/profile-picture/ProfileProto/users/319cbd9f5ed9920263c51304497f5e1b.jpg
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // Handle both sync (Next.js < 15) and async (Next.js 15+) params
    const resolvedParams = await Promise.resolve(params)
    // Reconstruct the path from the catch-all parameter
    const profilePicturePath = resolvedParams.path.join('/')

    if (!profilePicturePath) {
      return NextResponse.json(
        { error: 'Profile picture path is required' },
        { status: 400 }
      )
    }

    // Construct the Workers URL with original query parameters
    const searchParams = request.nextUrl.searchParams.toString()
    const workersUrl = `${getWorkersBaseUrl()}/${profilePicturePath}${searchParams ? '?' + searchParams : ''}`
    
    console.log(`[hiffi] Profile picture proxy: fetching from Workers: ${workersUrl}`)

    // Get the API key for Workers authentication
    const apiKey = getWorkersApiKey()
    if (!apiKey) {
      console.error('[hiffi] Profile picture proxy: API key not configured')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Fetch image from Workers with x-api-key header.
    // Short revalidate so ranking pages can reuse the same avatar without refetching every paint.
    const response = await fetch(workersUrl, {
      headers: {
        'x-api-key': apiKey,
      },
      next: { revalidate: 3600 },
    })
    
    console.log(`[hiffi] Profile picture proxy: Workers response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      console.error(`[hiffi] Workers returned error for profile picture: ${response.status} ${response.statusText}`)
      console.error(`[hiffi] Workers URL that failed: ${workersUrl}`)
      // Try to get error details
      try {
        const errorText = await response.text()
        console.error(`[hiffi] Workers error response: ${errorText.substring(0, 200)}`)
      } catch (e) {
        // Ignore error reading response
      }
      return NextResponse.json(
        { error: `Failed to fetch profile picture: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get the image data as a blob
    const imageBlob = await response.blob()
    console.log(`[hiffi] Profile picture proxy: Successfully fetched image, size: ${imageBlob.size} bytes`)
    
    // Get content type from Workers response
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Browser + CDN cache: avatars are keyed by uid path; allow reuse on ranking "load more".
    return new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    })
  } catch (error: any) {
    console.error('[hiffi] Profile picture proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile picture', details: error.message },
      { status: 500 }
    )
  }
}
