'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Image from 'next/image'

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    walletAddress: string
    twitterUsername?: string
    twitterImage?: string
    totalPoints: number
  }
  change: number
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserAddress?: string
}

export function LeaderboardTable({ entries, currentUserAddress }: LeaderboardTableProps) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank.toString()
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-4 text-gray-400 font-medium">Rank</th>
            <th className="text-left py-4 px-4 text-gray-400 font-medium">User</th>
            <th className="text-right py-4 px-4 text-gray-400 font-medium">Points</th>
            <th className="text-center py-4 px-4 text-gray-400 font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentUser = entry.user.walletAddress === currentUserAddress
            
            return (
              <tr
                key={entry.user.id}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                  isCurrentUser ? 'bg-solana-purple/10' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <span className="text-2xl">{getRankDisplay(entry.rank)}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {entry.user.twitterImage ? (
                      <Image
                        src={entry.user.twitterImage}
                        alt={entry.user.twitterUsername || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-solana-purple to-solana-green" />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {entry.user.twitterUsername || 
                         `${entry.user.walletAddress.slice(0, 6)}...${entry.user.walletAddress.slice(-4)}`}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {entry.user.walletAddress.slice(0, 6)}...{entry.user.walletAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-solana-green font-bold text-lg">
                    {entry.user.totalPoints.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {getChangeIcon(entry.change)}
                    {entry.change !== 0 && (
                      <span className={`text-sm font-medium ${
                        entry.change > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {Math.abs(entry.change)}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}