'use client'

import { Coins } from 'lucide-react'
import { motion } from 'framer-motion'

interface PointsDisplayProps {
  points: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  animated?: boolean
}

export function PointsDisplay({ 
  points, 
  size = 'md', 
  showIcon = true,
  animated = true 
}: PointsDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const Component = animated ? motion.div : 'div'
  const animationProps = animated ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.3 }
  } : {}

  return (
    <Component
      {...animationProps}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm"
    >
      {showIcon && (
        <Coins className={`${iconSizes[size]} text-solana-green`} />
      )}
      <span className={`font-bold text-white ${sizeClasses[size]}`}>
        {points.toLocaleString()}
      </span>
    </Component>
  )
}