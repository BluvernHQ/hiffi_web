import { NextRequest, NextResponse } from 'next/server'
import { getWorkersApiKey } from '@/lib/storage'
import { WORKERS_BASE_URL } from '@/lib/config'

/**
 * Video streaming proxy that supports Range requests for proper video playback
 * This allows the browser to stream videos instead of downloading the entire file
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoUrl = searchParams.get('url')

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate that the URL is from Workers (security check)
    if (!videoUrl.startsWith(WORKERS_BASE_URL)) {
      return NextResponse.json(
        { error: 'Invalid video URL' },
        { status: 400 }
      )
    }

    // Get the API key for Workers authentication
    const apiKey = getWorkersApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Get Range header from request (for video seeking/streaming)
    const rangeHeader = request.headers.get('range')
    
    // Prepare headers for Workers request
    const headers: HeadersInit = {
      'x-api-key': apiKey,
    }

    // If client requested a range, forward it to Workers
    if (rangeHeader) {
      headers['Range'] = rangeHeader
    }

    // Fetch video from Workers with Range support
    const response = await fetch(videoUrl, {
      headers,
      // Don't follow redirects automatically - let Workers handle it
      redirect: 'follow',
    })

    if (!response.ok) {
      console.error(`[hiffi] Workers returned error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch video: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get the response body as a stream
    const stream = response.body
    if (!stream) {
      return NextResponse.json(
        { error: 'No response body' },
        { status: 500 }
      )
    }

    // Get content type from Workers response
    const contentType = response.headers.get('content-type') || 'video/mp4'
    
    // Get content length (if available)
    const contentLength = response.headers.get('content-length')
    
    // Get content range (if partial content)
    const contentRange = response.headers.get('content-range')

    // Prepare response headers
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    }

    // If we got a partial content response, forward the range headers
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
    }

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    // Return streaming response
    return new NextResponse(stream, {
      status: response.status, // 200 or 206 (Partial Content)
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error('[hiffi] Video streaming error:', error)
    return NextResponse.json(
      { error: 'Failed to stream video', details: error.message },
      { status: 500 }
    )
  }
}

