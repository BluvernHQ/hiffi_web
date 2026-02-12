import { NextRequest, NextResponse } from 'next/server'
import { getWorkersApiKey, WORKERS_BASE_URL } from '@/lib/storage'

/**
 * Generic image proxy that fetches images from Workers with x-api-key header
 * This allows the browser to display images that require authentication using
 * native <img> tags, benefiting from browser-level caching and avoiding memory leaks
 * from Object URLs.
 * 
 * Path: /proxy/image/[...path]
 * Example: /proxy/image/thumbnails/abc.jpg
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // Handle both sync (Next.js < 15) and async (Next.js 15+) params
    const resolvedParams = await Promise.resolve(params)
    // Reconstruct the path from the catch-all parameter
    const imagePath = resolvedParams.path.join('/')

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Image path is required' },
        { status: 400 }
      )
    }

    // Construct the Workers URL with original query parameters
    const searchParams = request.nextUrl.searchParams.toString()
    // Ensure imagePath doesn't start with a slash to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    const workersUrl = `${WORKERS_BASE_URL}/${cleanPath}${searchParams ? '?' + searchParams : ''}`
    
    console.log(`[hiffi] Image proxy: Fetching from Workers URL: ${workersUrl}`)
    
    // Get the API key for Workers authentication
    const apiKey = getWorkersApiKey()
    if (!apiKey) {
      console.error('[hiffi] Image proxy: API key not configured')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Fetch image from Workers with x-api-key header
    const response = await fetch(workersUrl, {
      headers: {
        'x-api-key': apiKey,
      },
      // Don't cache failed responses
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details')
      console.error(`[hiffi] Workers returned error for image: ${response.status} ${response.statusText}`, {
        url: workersUrl,
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText.substring(0, 200), // First 200 chars of error
      })
      return NextResponse.json(
        { 
          error: `Failed to fetch image: ${response.statusText}`,
          url: workersUrl,
          status: response.status
        },
        { status: response.status }
      )
    }

    // Get the image data as a blob
    const imageBlob = await response.blob()
    
    // Get content type from Workers response
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    console.log(`[hiffi] Image proxy: Successfully fetched image (${imageBlob.size} bytes, ${contentType})`)
    
    // Return the image with appropriate headers
    return new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Enable long-term browser caching for images
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('[hiffi] Image proxy error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { error: 'Failed to fetch image', details: error.message },
      { status: 500 }
    )
  }
}

