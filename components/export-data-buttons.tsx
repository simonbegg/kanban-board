'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, FileJson, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

interface ExportDataButtonsProps {
  boardId?: string
  boardTitle?: string
  variant?: 'dropdown' | 'buttons'
}

export function ExportDataButtons({ 
  boardId, 
  boardTitle,
  variant = 'dropdown' 
}: ExportDataButtonsProps) {
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<'board_csv' | 'account_json' | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    downloadUrl?: string
    token?: string
    error?: string
  } | null>(null)

  const handleExport = async (type: 'board_csv' | 'account_json') => {
    setLoading(true)
    setExportType(type)
    setResult(null)

    try {
      const body: any = { type }
      if (type === 'board_csv' && boardId) {
        body.boardId = boardId
      }

      const response = await fetch('/api/export/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create export')
      }

      setResult({
        success: true,
        downloadUrl: data.downloadUrl,
        token: data.token
      })

      // Auto-download after a short delay
      if (data.downloadUrl) {
        setTimeout(() => {
          window.location.href = data.downloadUrl
        }, 1000)
      }
    } catch (err) {
      setResult({
        success: false,
        error: (err as Error).message
      })
    } finally {
      setLoading(false)
    }
  }

  const renderExportStatus = () => {
    if (!result) return null

    if (result.success) {
      return (
        <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            Export ready! Your download should start automatically.
            {result.downloadUrl && (
              <Button 
                variant="link" 
                className="ml-2 p-0 h-auto text-green-700 dark:text-green-300"
                onClick={() => window.location.href = result.downloadUrl!}
              >
                Click here if it doesn't start
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? 'Exporting...' : 'Export Data'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {boardId && (
              <DropdownMenuItem onClick={() => handleExport('board_csv')} disabled={loading}>
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Export Board as CSV</span>
                  <span className="text-xs text-muted-foreground">
                    {boardTitle || 'Current board'}
                  </span>
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleExport('account_json')} disabled={loading}>
              <FileJson className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Export Full Account</span>
                <span className="text-xs text-muted-foreground">
                  All boards, tasks & data (JSON)
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {renderExportStatus()}
      </div>
    )
  }

  // Buttons variant
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        {boardId && (
          <Button
            variant="outline"
            onClick={() => handleExport('board_csv')}
            disabled={loading && exportType === 'board_csv'}
            className="gap-2"
          >
            {loading && exportType === 'board_csv' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export Board as CSV
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => handleExport('account_json')}
          disabled={loading && exportType === 'account_json'}
          className="gap-2"
        >
          {loading && exportType === 'account_json' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileJson className="w-4 h-4" />
          )}
          Export Full Account (JSON)
        </Button>
      </div>
      {renderExportStatus()}
    </div>
  )
}
