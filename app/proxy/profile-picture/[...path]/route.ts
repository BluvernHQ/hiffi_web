import { NextRequest, NextResponse } from 'next/server'
import { getWorkersApiKey, WORKERS_BASE_URL } from '@/lib/storage'

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

    // Construct the Workers URL
    const workersUrl = `${WORKERS_BASE_URL}/${profilePicturePath}`

    // Get the API key for Workers authentication
    const apiKey = getWorkersApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Fetch image from Workers with x-api-key header
    // Don't cache to ensure fresh images after profile picture updates
    const response = await fetch(workersUrl, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store', // Don't cache profile pictures
    })

    if (!response.ok) {
      console.error(`[hiffi] Workers returned error for profile picture: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch profile picture: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get the image data as a blob
    const imageBlob = await response.blob()
    
    // Get content type from Workers response
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Return the image with appropriate headers
    // Use no-cache for profile pictures to ensure fresh images after updates
    return new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache profile pictures
        'Pragma': 'no-cache',
        'Expires': '0',
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
