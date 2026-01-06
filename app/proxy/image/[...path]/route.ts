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
    const workersUrl = `${WORKERS_BASE_URL}/${imagePath}${searchParams ? '?' + searchParams : ''}`
    
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
      // Cache the response from Workers to improve performance
      next: { revalidate: 3600 } // Revalidate every hour
    })

    if (!response.ok) {
      console.error(`[hiffi] Workers returned error for image: ${response.status} ${response.statusText} URL: ${workersUrl}`)
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get the image data as a blob
    const imageBlob = await response.blob()
    
    // Get content type from Workers response
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
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
    console.error('[hiffi] Image proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image', details: error.message },
      { status: 500 }
    )
  }
}

