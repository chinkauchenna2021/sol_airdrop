'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DistributionData {
  name: string
  value: number
  percentage: number
}

const COLORS = ['#9945FF', '#14F195', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']

export function TokenDistribution() {
  const [data, setData] = useState<DistributionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDistributionData()
  }, [])

  const fetchDistributionData = async () => {
    try {
      const res = await fetch('/api/analytics/token-distribution')
      if (res.ok) {
        const distributionData = await res.json()
        setData(distributionData)
      }
    } catch (error) {
      console.error('Failed to fetch distribution data:', error)
      // Use mock data as fallback
      setData([
        { name: 'Airdrop Pool', value: 40000000, percentage: 40 },
        { name: 'Community Rewards', value: 25000000, percentage: 25 },
        { name: 'Team', value: 15000000, percentage: 15 },
        { name: 'Liquidity', value: 10000000, percentage: 10 },
        { name: 'Marketing', value: 5000000, percentage: 5 },
        { name: 'Reserve', value: 5000000, percentage: 5 },
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-solana-green text-sm">
            {payload[0].value.toLocaleString()} tokens
          </p>
          <p className="text-gray-400 text-sm">{payload[0].payload.percentage}%</p>
        </div>
      )
    }
    return null
  }

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
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="ml-8">
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-300 text-sm">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}