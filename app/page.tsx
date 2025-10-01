'use client'

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowRight, Layers, Palette, Zap, Circle, PlayCircle, CheckCircle2 } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    if (user && !loading) {
      router.push('/board')
    }
  }, [user, loading, router])

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setAuthDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <span className="text-2xl font-display tracking-wider font-semibold">ThreeLanes</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => openAuth('signin')}>
              Sign In
            </Button>
            <Button onClick={() => openAuth('signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[calc(100vh-5rem)] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/hero-flow.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 relative z-10 w-full">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-9xl font-bold mb-6 text-white">
              Kanban without the Clutter
            </h1>
            <p className="text-xl md:text-3xl text-white/90 mb-12 max-w-2xl mx-auto">
              Focus on what matters. Three lanes to organize your work. No complexity, just clarity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => openAuth('signup')} className="text-lg px-8">
                Start for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => openAuth('signin')} className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Lanes Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Three Lanes. That's it.
            </h2>
            <p className="text-xl text-muted-foreground">
              To do, doing, and it's done.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Arrow between columns on desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/3 -translate-y-1/2 translate-x-1/2 text-muted-foreground/30">
              <ArrowRight className="h-8 w-8" />
            </div>
            <div className="hidden md:block absolute top-1/2 left-2/3 -translate-y-1/2 translate-x-1/2 text-muted-foreground/30">
              <ArrowRight className="h-8 w-8" />
            </div>

            {/* To Do */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border-2 border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/50 transition-all">
                <div className="flex items-center justify-center mb-6">
                  <Circle className="h-16 w-16 text-blue-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-center mb-4">To Do</h3>
                <p className="text-center text-muted-foreground">
                  Your backlog of tasks waiting to be started. Simple and organized.
                </p>
              </div>
            </div>

            {/* Doing */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border-2 border-primary/50 rounded-2xl p-8 hover:border-primary transition-all shadow-lg shadow-primary/10">
                <div className="flex items-center justify-center mb-6">
                  <PlayCircle className="h-16 w-16 text-primary" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-center mb-4">Doing</h3>
                <p className="text-center text-muted-foreground">
                  Active work in progress. Stay focused on what matters now.
                </p>
              </div>
            </div>

            {/* Done */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border-2 border-emerald-500/30 rounded-2xl p-8 hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-center mb-4">Done</h3>
                <p className="text-center text-muted-foreground">
                  Completed tasks. Feel the satisfaction of progress.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg text-muted-foreground mb-6">
              No overwhelming workflows. No complicated boards. Just three lanes to keep you flowing.
            </p>
            <Button size="lg" onClick={() => openAuth('signup')} className="text-lg px-8">
              Try It Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 mt-16 py-20 bg-muted/30 rounded-3xl">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Simple. Powerful. Focused.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Three Lanes</h3>
              <p className="text-muted-foreground">
                To Do, In Progress, Done. The classic workflow that actually works.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Categories</h3>
              <p className="text-muted-foreground">
                Define your own categories with custom colors. Make it yours.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag & Drop</h3>
              <p className="text-muted-foreground">
                Intuitive drag and drop. Move tasks effortlessly between lanes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to declutter your workflow?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join today and experience kanban the way it should be.
          </p>
          <Button size="lg" onClick={() => openAuth('signup')} className="text-lg px-8">
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 ThreeLanes. Kanban without the clutter.</p>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogTitle className="sr-only">
            {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </DialogTitle>
          <AuthForm initialMode={authMode} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
