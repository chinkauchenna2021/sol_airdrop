// components/charts/TokenDistribution.tsx - UPDATE your existing component
'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

interface DistributionData {
  name: string
  value: number
  percentage: number
  tokens?: number // NEW: Token allocation per user
  userCount?: number // NEW: Number of users in this category
  color?: string // NEW: Color for better visual consistency
}

export function TokenDistribution() {
  const [data, setData] = useState<DistributionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showActivityView, setShowActivityView] = useState(false)

  useEffect(() => {
    fetchDistributionData()
  }, [])

  const fetchDistributionData = async () => {
    try {
      // TRY: New activity-based endpoint first
      const res = await fetch('/api/analytics/token-distribution')
      if (res.ok) {
        const distributionData = await res.json()
        
        // Check if we have activity-based data
        if (distributionData.activityDistribution && distributionData.activityDistribution.length > 0) {
          setData(distributionData.activityDistribution)
          setShowActivityView(true)
        } else {
          // FALLBACK: Use your existing data structure
          setData([
            { name: 'Airdrop Pool', value: 40000000, percentage: 40, color: '#9945FF' },
            { name: 'Community Rewards', value: 25000000, percentage: 25, color: '#14F195' },
            { name: 'Team', value: 15000000, percentage: 15, color: '#FF6B6B' },
            { name: 'Liquidity', value: 10000000, percentage: 10, color: '#4ECDC4' },
            { name: 'Marketing', value: 5000000, percentage: 5, color: '#45B7D1' },
            { name: 'Reserve', value: 5000000, percentage: 5, color: '#FFA07A' },
          ])
        }
      } else {
        // FALLBACK: Your existing data
        setData([
          { name: 'Airdrop Pool', value: 40000000, percentage: 40, color: '#9945FF' },
          { name: 'Community Rewards', value: 25000000, percentage: 25, color: '#14F195' },
          { name: 'Team', value: 15000000, percentage: 15, color: '#FF6B6B' },
          { name: 'Liquidity', value: 10000000, percentage: 10, color: '#4ECDC4' },
          { name: 'Marketing', value: 5000000, percentage: 5, color: '#45B7D1' },
          { name: 'Reserve', value: 5000000, percentage: 5, color: '#FFA07A' },
        ])
      }
    } catch (error) {
      console.error('Failed to fetch distribution data:', error)
      // FALLBACK: Your existing data structure
      setData([
        { name: 'Airdrop Pool', value: 40000000, percentage: 40, color: '#9945FF' },
        { name: 'Community Rewards', value: 25000000, percentage: 25, color: '#14F195' },
        { name: 'Team', value: 15000000, percentage: 15, color: '#FF6B6B' },
        { name: 'Liquidity', value: 10000000, percentage: 10, color: '#4ECDC4' },
        { name: 'Marketing', value: 5000000, percentage: 5, color: '#45B7D1' },
        { name: 'Reserve', value: 5000000, percentage: 5, color: '#FFA07A' },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  // ENHANCED: Tooltip with activity data
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-solana-green text-sm">
            {data.value.toLocaleString()} tokens
          </p>
          <p className="text-gray-400 text-sm">{data.percentage}%</p>
          {/* NEW: Activity-specific information */}
          {data.tokens && (
            <>
              <p className="text-blue-400 text-sm">
                {data.tokens.toLocaleString()} tokens per user
              </p>
              <p className="text-purple-400 text-sm">
                {data.userCount} users
              </p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  // PRESERVE: Your existing CustomLabel function
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180)
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {(percent * 100).toFixed(0)}%
      </text>
    )
  }

  return (
    <div className="space-y-6">
      {/* NEW: Activity allocation summary (only shows if we have activity data) */}
      {showActivityView && data.some(item => item.tokens && item.tokens > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white/5 rounded-xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-3">Activity-Based Token Allocation</h3>
          <div className="grid grid-cols-3 gap-4">
            {data.filter(item => item.tokens && item.tokens > 0).map((item, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-4 h-4 rounded mx-auto mb-2" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-white font-semibold">{item.tokens?.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{item.name}</div>
                <div className="text-xs text-gray-500">{item.userCount} users</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
            <div className="text-center text-sm text-gray-300">
              Token allocation based on Twitter activity: HIGH (1000+ followers) • MEDIUM (500+ followers) • LOW (baseline)
            </div>
          </div>
        </motion.div>
      )}

      {/* PRESERVE: Your existing chart structure */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* NEW: Activity breakdown (only shows if we have activity data) */}
      {showActivityView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {data.filter(item => item.tokens && item.tokens > 0).map((item, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-white">{item.name}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tokens/User:</span>
                  <span className="text-white font-medium">{item.tokens?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Users:</span>
                  <span className="text-white font-medium">{item.userCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-medium">{item.value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
} 