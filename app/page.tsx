'use client'

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowRight, Layers, Palette, Zap, SquareKanban } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
            <SquareKanban className="h-8 w-8 text-primary rotate-90 hover:rotate-0 transition-all duration-300" />
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
            <h1 className="text-5xl md:text-9xl font-special mb-6 text-white">
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
      <section className="container mx-auto px-6 py-32 bg-gradient-to-b from-background to-[#005bff] from-75% to-100% rounded-3xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-semibold mb-4">
              Three Lanes. That's it.
            </h2>
            <p className="text-2xl text-muted-foreground">
              To do, doing, and it's done.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16 relative mt-24">
            {/* To Do */}
            <div className="relative group">
              <div className="">
                <img src="/mesh-shape.png" alt="To Do" className="w-auto h-40 mx-auto" />
                <h3 className="text-3xl font-bold tracking-wider text-center mt-8">To Do</h3>
                <p className="text-center text-xl text-muted-foreground mt-4">
                  Your backlog of tasks waiting to be started. Simple and organized.
                </p>
              </div>
            </div>

            {/* Doing */}
            <div className="relative group">
              <div className="">
                <img src="/mesh-shape-3.png" alt="To Do" className="w-auto h-40 mx-auto" />
                <h3 className="text-3xl font-bold tracking-wider text-center mt-8">Doing</h3>
                <p className="text-center text-xl text-muted-foreground mt-4">
                  Active work in progress. Stay focused on what matters now.
                </p>
              </div>
            </div>

            {/* Done */}
            <div className="relative group">
              <div className="">
                <img src="/mesh-shape-4.png" alt="To Do" className="w-auto h-40 mx-auto" />
                <h3 className="text-3xl font-bold tracking-wider text-center mt-8">Done</h3>
                <p className="text-center text-xl text-muted-foreground mt-4">
                  Completed tasks. Feel the satisfaction of progress.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-2xl text-muted-foreground mb-6">
              No overwhelming workflows. No complicated boards. Just three lanes to keep you flowing.
            </p>
            <p className="text-white/90 text-8xl font-special font-semibold mt-8">Your tasks are waiting, lets get them done.</p>
            <Button size="lg" onClick={() => openAuth('signup')} className="text-lg px-8 mt-16">
              Try It Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div >
      </section >

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
      </section >

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

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg">
                What makes ThreeLanes different from other kanban tools?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                ThreeLanes focuses on simplicity. No overwhelming features, no complex workflows.
                Just three essential lanes (To Do, Doing, Done) to keep you focused and productive.
                We believe less is more when it comes to task management.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg">
                Can I customize the board columns?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                ThreeLanes is designed around the classic three-column workflow (To Do, Doing, Done).
                This simplicity is the backbone of ThreeLanes, it helps you focus without getting lost in configuration.
                However, you can create multiple boards and use custom categories to organise tasks your way.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg">
                How do I add categories to my tasks?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                When creating or editing a task, you can select or create a custom category .
                Categories help you visually organise and filter your tasks. You can also delete categories
                if you no longer need them, don't worry, your existing tasks won't be affected.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-lg">
                Can I collaborate with my team?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                ThreeLanes is designed for personal productivity. Each user has their own boards
                and tasks. We're focused on making the best individual task management experience possible.
                Team collaboration features may be considered in the future based on user feedback.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-lg">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Your data is stored securely using Supabase, an enterprise-grade database platform.
                All connections are encrypted, and your tasks are private to your account. We take your privacy
                seriously and will never share your data with third parties.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 ThreeLanes. Kanban without the clutter.</p>
        </div>
      </footer >

      {/* Auth Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogTitle className="sr-only">
            {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </DialogTitle>
          <AuthForm initialMode={authMode} />
        </DialogContent>
      </Dialog >
    </div >
  )
}
