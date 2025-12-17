import { NextRequest, NextResponse } from 'next/server'
import { getWorkersApiKey } from '@/lib/storage'

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
    const WORKERS_BASE_URL = 'https://black-paper-83cf.hiffi.workers.dev'
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

    // Smart progressive chunk sizing for optimal startup
    if (rangeHeader) {
      // Parse the range request
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/)
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1])
        const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : undefined
        
        if (!end) {
          // Progressive chunk sizing based on position
          let chunkSize: number
          
          if (start === 0) {
            // First chunk: Small for instant playback (512KB)
            chunkSize = 512 * 1024
            console.log(`[hiffi] Initial chunk: bytes=${start}-${start + chunkSize} (512KB) - fast start`)
          } else if (start < 4 * 1024 * 1024) {
            // Next 4MB: Medium chunks (1MB) - build buffer quickly
            chunkSize = 1 * 1024 * 1024
            console.log(`[hiffi] Early buffer: bytes=${start}-${start + chunkSize} (1MB)`)
          } else {
            // After 4MB: Large chunks (2MB) - sustained buffering
            chunkSize = 2 * 1024 * 1024
            console.log(`[hiffi] Progressive load: bytes=${start}-${start + chunkSize} (2MB)`)
          }
          
          headers['Range'] = `bytes=${start}-${start + chunkSize}`
        } else {
          // Explicit range - honor it
          headers['Range'] = rangeHeader
          console.log(`[hiffi] Explicit range: ${rangeHeader}`)
        }
      } else {
        headers['Range'] = rangeHeader
      }
    } else {
      // No range header - return first 512KB for instant start
      const INSTANT_START_SIZE = 512 * 1024 // 512KB
      headers['Range'] = `bytes=0-${INSTANT_START_SIZE}`
      console.log(`[hiffi] Instant start: requesting first 512KB`)
    }

    // Fetch video from Workers with Range support
    // Use keep-alive connection pooling for better performance
    const response = await fetch(videoUrl, {
      headers,
      // Don't follow redirects automatically - let Workers handle it
      redirect: 'follow',
      // Use keep-alive for connection reuse
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

