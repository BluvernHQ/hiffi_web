import { NextRequest, NextResponse } from 'next/server'

const WORKERS_BASE_URL = "https://black-paper-83cf.hiffi.workers.dev"
const API_KEY = process.env.WORKERS_API_KEY || process.env.NEXT_PUBLIC_WORKERS_API_KEY || ""

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join('/')
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Check if API key is set
    if (!API_KEY) {
      console.warn('[API] WORKERS_API_KEY is not set in environment variables')
    }

    // Construct the Workers URL
    const workersUrl = `${WORKERS_BASE_URL}/${path}`
    console.log('[API] Fetching video from Workers:', workersUrl)

    // Get range header for video streaming
    const range = request.headers.get('range')

    // Prepare headers
    const headers: HeadersInit = {}
    if (API_KEY) {
      headers['x-api-key'] = API_KEY
      console.log('[API] Adding x-api-key header to Workers request')
    } else {
      console.warn('[API] No API key available - request may fail')
    }

    // Add range header if present (for video seeking)
    if (range) {
      headers['range'] = range
      console.log('[API] Forwarding range header:', range)
    }

    // Fetch from Workers with the required header
    const response = await fetch(workersUrl, {
      headers,
    })
    
    console.log('[API] Workers response status:', response.status, 'has body:', !!response.body)

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      console.error('[API] Workers API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200),
        url: workersUrl,
        hasApiKey: !!API_KEY,
      })
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch video',
          details: response.status === 401 ? 'Unauthorized - check WORKERS_API_KEY environment variable' : errorText.substring(0, 200)
        },
        { status: response.status }
      )
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'video/mp4'
    
    // Get content range if present (for partial content responses)
    const contentRange = response.headers.get('content-range')
    const contentLength = response.headers.get('content-length')
    const acceptRanges = response.headers.get('accept-ranges')

    // Build response headers
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    }

    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
    }
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }
    if (acceptRanges) {
      responseHeaders['Accept-Ranges'] = acceptRanges
    }

    // Return appropriate status code for range requests
    const status = range && response.status === 206 ? 206 : 200

    // Stream the video response instead of loading into memory
    // This prevents timeouts for large videos
    return new NextResponse(response.body, {
      status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('[API] Error fetching video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

