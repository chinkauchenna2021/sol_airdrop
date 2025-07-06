'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'

interface GrowthData {
  date: string
  users: number
  active: number
}

export function UserGrowthChart() {
  const [data, setData] = useState<GrowthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGrowthData()
  }, [])

  const fetchGrowthData = async () => {
    try {
      const res = await fetch('/api/analytics/user-growth')
      if (res.ok) {
        const growthData = await res.json()
        setData(growthData)
      }
    } catch (error) {
      console.error('Failed to fetch growth data:', error)
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p className="text-white text-sm font-medium">{format(new Date(label), 'MMM d, yyyy')}</p>
          <div className="space-y-1 mt-2">
            <p className="text-solana-purple text-sm">Total: {payload[0].value}</p>
            <p className="text-solana-green text-sm">Active: {payload[1].value}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9945FF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#9945FF" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14F195" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#14F195" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
          />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#9945FF"
            fillOpacity={1}
            fill="url(#colorUsers)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="active"
            stroke="#14F195"
            fillOpacity={1}
            fill="url(#colorActive)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}