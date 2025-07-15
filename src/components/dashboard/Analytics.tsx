import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { 
  BarChart3, TrendingUp, PieChart, Activity, Calendar,
  Users, Heart, MessageCircle, Repeat, Eye, Target,
  Zap, Star, ArrowUpRight, ArrowDownRight, Minus,
  Clock, Award, Coins, Twitter, RefreshCw, Download,
  Filter, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart as RechartsPie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart,
  Pie
} from 'recharts'
// Using native Date methods instead of date-fns

interface AnalyticsData {
  pointsOverTime: Array<{
    date: string
    points: number
    cumulative: number
  }>
  engagementBreakdown: Array<{
    type: string
    count: number
    points: number
    color: string
  }>
  weeklyActivity: Array<{
    day: string
    engagements: number
    points: number
  }>
  achievements: Array<{
    date: string
    name: string
    points: number
  }>
  twitterMetrics: {
    totalEngagements: number
    avgEngagementsPerDay: number
    bestDay: string
    topEngagementType: string
    growthRate: number
  }
  leaderboardPosition: {
    current: number
    previous: number
    percentile: number
  }
  predictions: {
    nextLevelDays: number
    projectedMonthlyPoints: number
    trendDirection: 'up' | 'down' | 'stable'
  }
}

interface AnalyticsProps {
  userId: string
}

export function AnalyticsComponent({ userId }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [activeChart, setActiveChart] = useState<string>('points')
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({})
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true })

  useEffect(() => {
    fetchAnalytics()
  }, [userId, timeRange])

  useEffect(() => {
    if (data && isInView) {
      // Animate numbers
      const values = {
        totalEngagements: data.twitterMetrics.totalEngagements,
        avgEngagements: data.twitterMetrics.avgEngagementsPerDay,
        growthRate: data.twitterMetrics.growthRate,
        leaderboardPosition: data.leaderboardPosition.current
      }
      
      Object.entries(values).forEach(([key, targetValue]) => {
        let currentValue = 0
        const increment = targetValue / 60 // 60 frames for 1 second
        const timer = setInterval(() => {
          currentValue += increment
          if (currentValue >= targetValue) {
            currentValue = targetValue
            clearInterval(timer)
          }
          setAnimatedValues(prev => ({ ...prev, [key]: currentValue }))
        }, 16) // ~60fps
      })
    }
  }, [data, isInView])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analytics/user?timeRange=${timeRange}`)
      if (res.ok) {
        const analyticsData = await res.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/95 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-2xl"
        >
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300 text-sm">
                {entry.name}: <span className="text-white font-semibold">{entry.value}</span>
              </span>
            </div>
          ))}
        </motion.div>
      )
    }
    return null
  }

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="w-4 h-4 text-green-400" />
    if (value < 0) return <ArrowDownRight className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-400'
    if (value < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No analytics data available</h3>
        <p className="text-gray-500">Start engaging with the platform to see your analytics!</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-400 mt-2">Track your progress and engagement metrics</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex gap-1 bg-black/20 backdrop-blur-xl rounded-xl p-1">
            {[
              { id: '7d', name: '7 Days' },
              { id: '30d', name: '30 Days' },
              { id: '90d', name: '90 Days' }
            ].map((range) => (
              <motion.button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {range.name}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAnalytics}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 relative overflow-hidden"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-4 right-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl"
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Total Engagements</h3>
                <p className="text-blue-400 text-sm">All time</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-blue-400">
                {Math.floor(animatedValues.totalEngagements || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                {getGrowthIcon(data.twitterMetrics.growthRate)}
                <span className={`text-sm font-medium ${getGrowthColor(data.twitterMetrics.growthRate)}`}>
                  {Math.abs(data.twitterMetrics.growthRate).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 relative overflow-hidden"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-4 right-4 w-16 h-16 bg-green-500/20 rounded-full blur-xl"
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Daily Average</h3>
                <p className="text-green-400 text-sm">Engagements</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {Math.floor(animatedValues.avgEngagements || 0)}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 relative overflow-hidden"
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-4 right-4 w-16 h-16 bg-purple-500/20 rounded-full blur-xl"
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Rank</h3>
                <p className="text-purple-400 text-sm">Leaderboard</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-purple-400">
                #{Math.floor(animatedValues.leaderboardPosition || 0)}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Top {data.leaderboardPosition.percentile}%</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 relative overflow-hidden"
        >
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-4 right-4 w-16 h-16 bg-yellow-500/20 rounded-full blur-xl"
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Target className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Next Level</h3>
                <p className="text-yellow-400 text-sm">Projection</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {data.predictions.nextLevelDays} days
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart Navigation */}
      <div className="flex gap-2 bg-black/20 backdrop-blur-xl rounded-2xl p-1">
        {[
          { id: 'points', name: 'Points Over Time', icon: Coins },
          { id: 'engagement', name: 'Engagement Types', icon: Heart },
          { id: 'activity', name: 'Weekly Activity', icon: Calendar },
          { id: 'radar', name: 'Performance Radar', icon: Target }
        ].map((chart) => {
          const Icon = chart.icon
          return (
            <motion.button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                activeChart === chart.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden lg:inline">{chart.name}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Primary Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 p-8 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10"
        >
          <AnimatePresence mode="wait">
            {activeChart === 'points' && (
              <motion.div
                key="points"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Coins className="w-6 h-6 text-yellow-400" />
                  Points Over Time
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.pointsOverTime}>
                      <defs>
                        <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9945FF" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#9945FF" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14F195" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#14F195" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="points"
                        stroke="#9945FF"
                        fill="url(#pointsGradient)"
                        strokeWidth={3}
                        name="Daily Points"
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#14F195"
                        strokeWidth={3}
                        dot={{ fill: '#14F195', r: 4 }}
                        name="Cumulative"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeChart === 'engagement' && (
              <motion.div
                key="engagement"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Heart className="w-6 h-6 text-pink-400" />
                  Engagement Breakdown
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={data.engagementBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={60}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {data.engagementBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {data.engagementBreakdown.map((item, index) => (
                    <motion.div
                      key={item.type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <div className="text-white font-medium">{item.type}</div>
                        <div className="text-gray-400 text-sm">{item.count} times</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeChart === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-400" />
                  Weekly Activity Pattern
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklyActivity}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="engagements"
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                        name="Engagements"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeChart === 'radar' && (
              <motion.div
                key="radar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6 text-purple-400" />
                  Performance Radar
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { metric: 'Consistency', value: 85, fullMark: 100 },
                      { metric: 'Engagement', value: 75, fullMark: 100 },
                      { metric: 'Growth', value: 90, fullMark: 100 },
                      { metric: 'Activity', value: 80, fullMark: 100 },
                      { metric: 'Social', value: 70, fullMark: 100 },
                      { metric: 'Achievements', value: 60, fullMark: 100 }
                    ]}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#9945FF"
                        fill="#9945FF"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        dot={{ fill: '#9945FF', r: 4 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Side Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Best Performing Day */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
          >
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-green-400" />
              Best Day
            </h4>
            <div className="text-2xl font-bold text-green-400 mb-2">
              {data.twitterMetrics.bestDay}
            </div>
            <p className="text-gray-400 text-sm">Most active engagement day</p>
          </motion.div>

          {/* Top Engagement Type */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
          >
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Top Activity
            </h4>
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {data.twitterMetrics.topEngagementType}
            </div>
            <p className="text-gray-400 text-sm">Most frequent engagement</p>
          </motion.div>

          {/* Predictions */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
          >
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Predictions
            </h4>
            <div className="space-y-3">
              <div>
                <div className="text-lg font-bold text-purple-400">
                  {data.predictions.projectedMonthlyPoints.toLocaleString()} points
                </div>
                <div className="text-gray-400 text-sm">Projected this month</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm font-medium ${getGrowthColor(data.predictions.trendDirection === 'up' ? 1 : data.predictions.trendDirection === 'down' ? -1 : 0)}`}>
                  Trend: {data.predictions.trendDirection.toUpperCase()}
                </div>
                {getGrowthIcon(data.predictions.trendDirection === 'up' ? 1 : data.predictions.trendDirection === 'down' ? -1 : 0)}
              </div>
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
          >
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Recent Achievements
            </h4>
            <div className="space-y-3">
              {data.achievements.slice(0, 3).map((achievement, index) => (
                <motion.div
                  key={achievement.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                >
                  <div>
                    <div className="text-white text-sm font-medium truncate">
                      {achievement.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(achievement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-yellow-400 text-sm font-bold">
                    +{achievement.points}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export Analytics Report
        </motion.button>
      </motion.div>
    </div>
  )
}