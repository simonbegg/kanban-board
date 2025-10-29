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

      <section className="container py-32 mx-auto">
        <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center">No overwhelming workflows.</h3>
        <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mt-4">No complicated boards.</h3>
        <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mt-4">Just three lanes to keep you flowing.</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-16 mt-16">
          <div>
            <p className="text-2xl font-bold text-center">To-do</p>
            <p className="text-center text-xl text-muted-foreground mt-4">Your backlog of tasks waiting to be started. Simple and organized.</p>
            <div className="p-8 bg-background rounded-2xl border-border border-2 border-dashed space-y-4">
              <div id="card-1" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>

                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
              <div id="card-2" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>
                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
              <div id="card-3" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>

                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold text-center">Doing</p>
            <p className="text-center text-xl text-muted-foreground mt-4">Active work in progress. Stay focused on what matters now.</p>
            <div className="p-8 bg-background rounded-2xl border-border border-2 border-dashed space-y-4">
              <div id="card-1" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border py-4 shadow-sm transition-all duration-200 cursor-grab hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>

                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
              <div id="card-2" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>
                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
              <div id="card-3" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>

                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold text-center">Done</p>
            <p className="text-center text-xl text-muted-foreground mt-4">Completed tasks. Feel the satisfaction of progress.</p>
            <div className="p-8 bg-background rounded-2xl border-border border-2 border-dashed space-y-4">
              <div id="card-1" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>

                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
              <div id="card-2" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab hover:py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>
                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
              <div id="card-3" className="p-4 group bg-card text-card-foreground flex flex-col rounded-xl border cursor-grab hover:py-4 shadow-sm transition-all duration-200 hover:shadow-lg group">
                <div className="">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground text-base leading-tight">My task</h4>
                    </div>

                  </div>
                </div>
                <div className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">this is my task</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-xs border">Marketing</span>
                    <span className="text-xs text-muted-foreground ml-auto">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-center text-8xl font-special font-semibold mt-8">Your tasks are waiting, lets get them done.</p>
          <div className="flex mt-16 mx-auto justify-center">
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
