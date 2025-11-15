'use client'

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UserMenu } from "@/components/auth/user-menu"
import { ProManagementPanel } from "@/components/admin/pro-management"
import { AdminBoardsPanel } from "@/components/admin/admin-boards"
import { Shield, Users, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'boards'>('users')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    // Check if user is admin
    if (user) {
      const adminEmails = [
        'simon@teamtwobees.com',
        'simon@threelanes.app',
        'admin@threelanes.app',
        // Add your admin emails here
      ]
      
      const userEmail = user.email?.toLowerCase()
      const isUserAdmin = userEmail && adminEmails.some(email => 
        userEmail === email.toLowerCase() || userEmail.endsWith('@threelanes.app') || userEmail.endsWith('@teamtwobees.com')
      )
      
      setIsAdmin(isUserAdmin)
      setCheckingAdmin(false)
      
      if (!isUserAdmin) {
        router.push('/board')
      }
    }
  }, [user, loading, router])

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-display tracking-wider font-semibold">ThreeLanes Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/board')}
            >
              Back to Board
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage user plans, monitor usage, and access support data
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('boards')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'boards'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                All Boards
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'users' && <ProManagementPanel />}
          {activeTab === 'boards' && <AdminBoardsPanel />}
        </div>
      </main>
    </div>
  )
}
