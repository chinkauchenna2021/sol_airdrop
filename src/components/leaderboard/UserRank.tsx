'use client'

import { Trophy, Medal, Award } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserRankProps {
  rank: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function UserRank({ rank, size = 'md', showLabel = true }: UserRankProps) {
  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />
    return <Award className="w-5 h-5 text-solana-purple" />
  }

  const getRankColor = () => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600'
    if (rank === 2) return 'from-gray-300 to-gray-500'
    if (rank === 3) return 'from-orange-400 to-orange-600'
    return 'from-solana-purple to-solana-purple/70'
  }

  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-3'
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 rounded-lg bg-gradient-to-r ${getRankColor()} ${sizeClasses[size]}`}
    >
      {getRankIcon()}
      <span className="font-bold text-white">
        {showLabel && 'Rank'} #{rank}
      </span>
    </motion.div>
  )
}