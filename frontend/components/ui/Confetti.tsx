'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  color: string
  delay: number
  duration: number
}

const colors = [
  '#3b82f6', // primary blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
]

export default function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (trigger) {
      // Generate random particles
      const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 1.5,
      }))
      setParticles(newParticles)

      // Call onComplete after animation
      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                rotate: 0,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                y: `${particle.y + 110}vh`,
                x: `${particle.x + (Math.random() - 0.5) * 20}vw`,
                rotate: 360 + Math.random() * 360,
                scale: [1, 1.2, 0.8, 0],
                opacity: [1, 1, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: particle.color,
                boxShadow: `0 0 6px ${particle.color}`,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
