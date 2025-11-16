import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container mx-auto px-6 text-center text-muted-foreground">
        <p>&copy; 2025 ThreeLanes. Kanban without the clutter.</p>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/refund-policy" className="hover:text-foreground transition-colors">
            Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
