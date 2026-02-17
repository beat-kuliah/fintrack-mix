'use client'

import { motion } from 'framer-motion'
import { Trophy, Star, Target, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react'

export type AchievementType = 
  | 'first-transaction'
  | 'budget-master'
  | 'savings-champion'
  | 'streak-7'
  | 'streak-30'
  | 'goal-achieved'

interface Achievement {
  id: AchievementType
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

const achievements: Record<AchievementType, Achievement> = {
  'first-transaction': {
    id: 'first-transaction',
    name: 'First Step',
    description: 'Added your first transaction',
    icon: <CheckCircle2 className="w-6 h-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
  },
  'budget-master': {
    id: 'budget-master',
    name: 'Budget Master',
    description: 'Stayed within budget for a month',
    icon: <Target className="w-6 h-6" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-500/20',
  },
  'savings-champion': {
    id: 'savings-champion',
    name: 'Savings Champion',
    description: 'Saved more than 20% of income',
    icon: <Wallet className="w-6 h-6" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-500/20',
  },
  'streak-7': {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7 day streak of tracking',
    icon: <Star className="w-6 h-6" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
  },
  'streak-30': {
    id: 'streak-30',
    name: 'Month Master',
    description: '30 day streak of tracking',
    icon: <Trophy className="w-6 h-6" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-500/20',
  },
  'goal-achieved': {
    id: 'goal-achieved',
    name: 'Goal Achiever',
    description: 'Achieved a financial goal',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-500/20',
  },
}

interface AchievementBadgeProps {
  achievement: AchievementType
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  animated?: boolean
}

export default function AchievementBadge({
  achievement,
  size = 'md',
  showTooltip = false,
  animated = false,
}: AchievementBadgeProps) {
  const achievementData = achievements[achievement]
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const badge = (
    <motion.div
      initial={animated ? { scale: 0, rotate: -180 } : {}}
      animate={animated ? { scale: 1, rotate: 0 } : {}}
      transition={{ duration: 0.5, type: 'spring' }}
      className={`
        ${sizeClasses[size]}
        ${achievementData.bgColor}
        rounded-full flex items-center justify-center
        ${achievementData.color}
        shadow-lg
        ${animated ? 'hover:scale-110' : ''}
        transition-all duration-300
      `}
    >
      {achievementData.icon}
    </motion.div>
  )

  if (showTooltip) {
    return (
      <div className="relative group">
        {badge}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="glass rounded-lg p-2 shadow-lg min-w-[150px]">
            <p className="text-xs font-semibold text-light-800 dark:text-dark-100">
              {achievementData.name}
            </p>
            <p className="text-xs text-light-600 dark:text-dark-400">
              {achievementData.description}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return badge
}

export { achievements }
