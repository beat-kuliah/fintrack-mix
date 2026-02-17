'use client'

import { Wallet, ArrowLeftRight, Target, TrendingUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  type: 'transactions' | 'budgets' | 'wallets' | 'goals' | 'reports'
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

const defaultIcons = {
  transactions: <ArrowLeftRight className="w-12 h-12" />,
  budgets: <Target className="w-12 h-12" />,
  wallets: <Wallet className="w-12 h-12" />,
  goals: <TrendingUp className="w-12 h-12" />,
  reports: <Sparkles className="w-12 h-12" />,
}

export default function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const displayIcon = icon || defaultIcons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12 sm:py-16 lg:py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-600/20 flex items-center justify-center text-primary-600 dark:text-primary-400"
      >
        {displayIcon}
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg sm:text-xl font-bold text-light-800 dark:text-dark-100 mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm sm:text-base text-light-500 dark:text-dark-500 mb-6 max-w-md mx-auto px-4"
      >
        {description}
      </motion.p>

      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}
