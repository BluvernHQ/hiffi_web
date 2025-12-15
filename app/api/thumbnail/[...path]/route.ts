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
    console.log('[API] Fetching thumbnail from Workers:', workersUrl)

    // Prepare headers
    const headers: HeadersInit = {}
    if (API_KEY) {
      headers['x-api-key'] = API_KEY
      console.log('[API] Adding x-api-key header to Workers request for thumbnail')
    } else {
      console.warn('[API] No API key available for thumbnail request - request may fail')
    }

    // Fetch from Workers with the required header
    const response = await fetch(workersUrl, {
      headers,
    })

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
          error: 'Failed to fetch thumbnail',
          details: response.status === 401 ? 'Unauthorized - check WORKERS_API_KEY environment variable' : errorText.substring(0, 200)
        },
        { status: response.status }
      )
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Stream the image response instead of loading into memory
    // This improves performance and prevents delays
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[API] Error fetching thumbnail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

