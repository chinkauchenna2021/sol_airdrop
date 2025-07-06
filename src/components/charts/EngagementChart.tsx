'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface EngagementData {
  date: string
  likes: number
  retweets: number
  comments: number
  total: number
}

interface EngagementChartProps {
  userId: string
  days?: number
}

export function EngagementChart({ userId, days = 7 }: EngagementChartProps) {
  const [data, setData] = useState<EngagementData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEngagementData()
  }, [userId, days])

  const fetchEngagementData = async () => {
    try {
      const res = await fetch(`/api/analytics/engagement?userId=${userId}&days=${days}`)
      if (res.ok) {
        const engagementData = await res.json()
        setData(engagementData)
      }
    } catch (error) {
      console.error('Failed to fetch engagement data:', error)
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
          <p className="text-white text-sm font-medium">{format(new Date(label), 'MMM d')}</p>
          <div className="space-y-1 mt-2">
            <p className="text-red-400 text-sm">Likes: {payload[0].value}</p>
            <p className="text-green-400 text-sm">Retweets: {payload[1].value}</p>
            <p className="text-blue-400 text-sm">Comments: {payload[2].value}</p>
            <p className="text-solana-purple text-sm font-medium">Total: {payload[3].value}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
          />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="likes"
            stroke="#EF4444"
            strokeWidth={2}
            dot={{ fill: '#EF4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="retweets"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="comments"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#9945FF"
            strokeWidth={3}
            dot={{ fill: '#9945FF', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}