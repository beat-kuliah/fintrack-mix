'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, Plus } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Transactions',
    href: '/dashboard/transactions',
    icon: <ArrowLeftRight className="w-5 h-5" />,
  },
  {
    name: 'Wallets',
    href: '/dashboard/wallets',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    name: 'Budgeting',
    href: '/dashboard/budgeting',
    icon: <CreditCard className="w-5 h-5" />,
  },
]

interface BottomNavProps {
  onAddClick?: () => void
}

export default function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname()
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <button
          onClick={() => {
            if (onAddClick) {
              onAddClick()
            } else {
              setIsAddMenuOpen(!isAddMenuOpen)
            }
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40 hover:shadow-xl hover:shadow-primary-500/50 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
          aria-label="Add transaction"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass border-t border-light-200 dark:border-dark-800 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 flex-1 h-full
                  transition-all duration-300 relative
                  ${active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-light-500 dark:text-dark-500'
                  }
                `}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-b-full" />
                )}
                <span className={`
                  transition-transform duration-300
                  ${active ? 'scale-110' : 'scale-100'}
                `}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Add padding to main content on mobile to account for bottom nav */}
      <style jsx global>{`
        @media (max-width: 1023px) {
          main {
            padding-bottom: 5rem !important;
          }
        }
      `}</style>
    </>
  )
}
