import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

/**
 * Download export file via token
 * GET /api/export/download/:token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Validate and mark token as used
    const { data: isValid, error: validationError } = await supabase
      .rpc('use_export_token', { p_token: token })

    if (validationError) {
      console.error('Error validating token:', validationError)
      return NextResponse.json(
        { error: 'Failed to validate token' },
        { status: 500 }
      )
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used token' },
        { status: 410 } // 410 Gone
      )
    }

    // Get token details
    const { data: exportToken, error: fetchError } = await supabase
      .from('export_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !exportToken) {
      console.error('Error fetching export token:', fetchError)
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      )
    }

    // Verify export is ready
    if (exportToken.status !== 'used') {
      return NextResponse.json(
        { error: 'Export is not ready yet' },
        { status: 202 } // 202 Accepted (processing)
      )
    }

    if (!exportToken.file_url) {
      return NextResponse.json(
        { error: 'Export file not found' },
        { status: 404 }
      )
    }

    // Parse data URI or fetch from storage
    let fileContent: string
    let contentType: string
    let filename: string

    if (exportToken.file_url.startsWith('data:')) {
      // Data URI format
      const match = exportToken.file_url.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) {
        return NextResponse.json(
          { error: 'Invalid file data' },
          { status: 500 }
        )
      }

      contentType = match[1]
      fileContent = Buffer.from(match[2], 'base64').toString('utf-8')
    } else {
      // TODO: Fetch from S3/storage
      return NextResponse.json(
        { error: 'Storage-based exports not yet implemented' },
        { status: 501 }
      )
    }

    // Determine filename
    if (exportToken.export_type === 'board_csv') {
      filename = `board-${exportToken.board_id}-export.csv`
    } else {
      filename = `threelanes-account-export.json`
    }

    // Return file as download
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (err) {
    console.error('Error in export download:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
