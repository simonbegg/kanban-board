import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'
import {
  generateBoardCSV,
  generateAccountJSON,
  estimateExportSize
} from '@/lib/export/export-generators'
import { logSubscriptionEvent } from '@/lib/subscription/subscription-helpers'

/**
 * Request data export (CSV or JSON)
 * POST /api/export/request
 * Body: { type: 'board_csv' | 'account_json', boardId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { type, boardId } = await request.json()

    // Validate export type
    if (!type || !['board_csv', 'account_json'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid export type. Must be "board_csv" or "account_json"' },
        { status: 400 }
      )
    }

    // Validate board ownership if boardId provided
    if (type === 'board_csv') {
      if (!boardId) {
        return NextResponse.json(
          { error: 'boardId is required for board_csv export' },
          { status: 400 }
        )
      }

      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('user_id')
        .eq('id', boardId)
        .maybeSingle()

      if (boardError) {
        console.error('Error fetching board:', boardError)
        return NextResponse.json(
          { error: 'Failed to verify board access' },
          { status: 500 }
        )
      }

      if (!board) {
        return NextResponse.json(
          { error: 'Board not found' },
          { status: 404 }
        )
      }

      if (board.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to export this board' },
          { status: 403 }
        )
      }
    }

    // Estimate export size
    const { taskCount, shouldQueue } = await estimateExportSize(user.id, type, boardId, supabase)

    // Generate token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_export_token')

    if (tokenError || !tokenData) {
      console.error('Error generating token:', tokenError)
      return NextResponse.json(
        { error: 'Failed to generate export token' },
        { status: 500 }
      )
    }

    const token = tokenData as string
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    if (shouldQueue) {
      // Large export - queue for background processing
      
      const { error: insertError } = await supabase
        .from('export_tokens')
        .insert({
          user_id: user.id,
          token,
          export_type: type,
          board_id: boardId || null,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })

      if (insertError) {
        console.error('Error creating export token:', insertError)
        return NextResponse.json(
          { error: 'Failed to create export request' },
          { status: 500 }
        )
      }

      // Log event
      await logSubscriptionEvent(
        user.id,
        'export_requested',
        { type, board_id: boardId, task_count: taskCount, queued: true },
        user.id
      )

      // TODO: Queue background job to generate export

      return NextResponse.json({
        success: true,
        token,
        estimatedTime: '5-10 minutes',
        taskCount,
        message: "We're preparing your export. You'll receive an email when it's ready."
      })

    } else {
      // Small export - generate immediately
      
      let fileContent: string
      let filename: string

      if (type === 'board_csv') {
        fileContent = await generateBoardCSV(boardId!, supabase)
        filename = `board-${boardId}-export.csv`
      } else {
        fileContent = await generateAccountJSON(user.id, supabase)
        filename = `threelanes-account-export.json`
      }

      // For simplicity, store content directly in file_url field as data URI
      // In production, upload to S3/storage and store URL
      const dataUri = `data:${type === 'board_csv' ? 'text/csv' : 'application/json'};base64,${Buffer.from(fileContent).toString('base64')}`

      const { error: insertError } = await supabase
        .from('export_tokens')
        .insert({
          user_id: user.id,
          token,
          export_type: type,
          board_id: boardId || null,
          file_url: dataUri,
          status: 'ready',
          expires_at: expiresAt.toISOString()
        })

      if (insertError) {
        console.error('Error creating export token:', insertError)
        return NextResponse.json(
          { error: 'Failed to create export' },
          { status: 500 }
        )
      }

      // Log event
      await logSubscriptionEvent(
        user.id,
        'export_ready',
        { type, board_id: boardId, task_count: taskCount },
        user.id
      )

      return NextResponse.json({
        success: true,
        token,
        downloadUrl: `/api/export/download/${token}`,
        expiresAt: expiresAt.toISOString(),
        taskCount,
        filename
      })
    }

  } catch (err) {
    console.error('Error in export request:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: (err as Error).message },
      { status: 500 }
    )
  }
}
