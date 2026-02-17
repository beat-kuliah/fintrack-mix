'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { Wallet, Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 bg-mesh noise flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-500 mx-auto mb-4"></div>
            <Wallet className="w-6 h-6 text-primary-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-light-600 dark:text-dark-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 bg-mesh noise transition-colors duration-300">
      <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header - Only show on mobile */}
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-light-200 dark:border-dark-800 transition-colors duration-300 h-14">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex-shrink-0 p-2 rounded-lg text-light-700 dark:text-dark-300 hover:bg-light-100/50 dark:hover:bg-white/5 active:bg-light-200/50 dark:active:bg-white/10 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 pb-20 lg:pb-8 sm:pb-12 animate-fade-in">
          {children}
        </main>

        {/* Footer */}
        <footer className="hidden lg:block px-4 sm:px-6 py-4 border-t border-light-200 dark:border-dark-800">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <p className="text-xs text-light-500 dark:text-dark-500">
              © 2024 FinTrack. Made with 💙 for Gen Z
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onAddClick={() => setShowAddMenu(true)} />
    </div>
  )
}

