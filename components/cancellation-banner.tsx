'use client'

// This component previously displayed grace-period and enforcement banners
// tied to a complex cancellation flow that has been removed in the MVP.
// It is retained as a no-op stub so existing imports don't break.

interface CancellationBannerProps {
  userId: string
  onUndoClick?: () => void
  onResolveClick?: () => void
  onExportClick?: () => void
}

export function CancellationBanner(_props: CancellationBannerProps) {
  return null
}
