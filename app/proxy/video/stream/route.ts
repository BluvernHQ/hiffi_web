import { NextRequest, NextResponse } from 'next/server'
import { getWorkersApiKey } from '@/lib/storage'
import { WORKERS_BASE_URL } from '@/lib/config'

/**
 * Video streaming proxy that supports Range requests for proper video playback
 * This allows the browser to stream videos instead of downloading the entire file
 * 
 * Path: /proxy/video/stream (not /api/video/stream to avoid conflict with backend API)
 */

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}

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

    // Pass through the Range header exactly as the browser sent it.
    // This allows the browser to manage its own buffer and MOOV atom discovery
    // without the proxy bottlenecking the requests into small chunks.
    if (rangeHeader) {
      headers['Range'] = rangeHeader
      console.log(`[hiffi] Proxying Range request: ${rangeHeader}`)
    } else {
      console.log(`[hiffi] No range header, requesting full stream pass-through`)
    }

    // Fetch video from Workers with streaming support
    const response = await fetch(videoUrl, {
      headers,
      redirect: 'follow',
      keepalive: true,
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

    // Log successful chunk delivery
    if (contentLength) {
      const sizeKB = parseInt(contentLength) / 1024
      const sizeMB = sizeKB / 1024
      if (sizeMB >= 1) {
        console.log(`[hiffi] Serving ${sizeMB.toFixed(2)}MB chunk (status: ${response.status})`)
      } else {
        console.log(`[hiffi] Serving ${sizeKB.toFixed(0)}KB chunk (status: ${response.status})`)
      }
    }

    // Prepare response headers
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Connection': 'keep-alive', // Enable connection pooling
      // CORS headers for video playback
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
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

