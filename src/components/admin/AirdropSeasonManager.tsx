'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, Pause, Settings, Users, Coins, 
  Calendar, TrendingUp, AlertCircle 
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AirdropSeason {
  id: string
  name: string
  status: 'ACTIVE' | 'CLAIMING' | 'ENDED'
  totalAllocation: number
  startDate: string
  endDate?: string
  claimingStartedAt?: string
  _count: {
    claims: number
  }
}

export const AirdropSeasonManager = () => {
  const [seasons, setSeasons] = useState<AirdropSeason[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSeasons()
  }, [])

  const fetchSeasons = async () => {
    try {
      const res = await fetch('/api/admin/airdrop-seasons')
      if (res.ok) {
        const data = await res.json()
        setSeasons(data.seasons)
      }
    } catch (error) {
      console.error('Failed to fetch seasons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeasonAction = async (action: string, seasonId?: string) => {
    try {
      const res = await fetch('/api/admin/airdrop-season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, seasonId })
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(result.message)
        fetchSeasons()
      } else {
        toast.error(result.error || 'Action failed')
      }
    } catch (error) {
      console.error('Season action error:', error)
      toast.error('Failed to perform action')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-500/20'
      case 'CLAIMING': return 'text-blue-400 bg-blue-500/20'
      case 'ENDED': return 'text-gray-400 bg-gray-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  if (loading) {
    return <div className="text-white">Loading seasons...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Airdrop Season Management</h2>
        <button
          onClick={() => handleSeasonAction('create_season')}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Create New Season
        </button>
      </div>

      <div className="grid gap-6">
        {seasons.map((season) => (
          <motion.div
            key={season.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{season.name}</h3>
                <p className="text-gray-400">
                  Started: {new Date(season.startDate).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(season.status)}`}>
                {season.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-400 text-sm">Total Allocation</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {(season.totalAllocation / 1000000).toFixed(1)}M
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-sm">Claims</span>
                </div>
                <p className="text-xl font-bold text-white">{season._count.claims}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400 text-sm">Status</span>
                </div>
                <p className="text-xl font-bold text-white">{season.status}</p>
              </div>
            </div>

            <div className="flex gap-3">
              {season.status === 'ACTIVE' && (
                <button
                  onClick={() => handleSeasonAction('start_claiming', season.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Claiming Phase
                </button>
              )}
              
              {season.status === 'CLAIMING' && (
                <button
                  onClick={() => handleSeasonAction('end_season', season.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  End Season
                </button>
              )}

              <button
                onClick={() => {/* Navigate to season details */}}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Manage
              </button>
            </div>

            {season.status === 'CLAIMING' && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold">Claiming Active</span>
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  Users can now claim their airdrops with $4 SOL payment
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}