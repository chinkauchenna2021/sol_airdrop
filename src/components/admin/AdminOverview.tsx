// 'use client'

// import { useState, useEffect } from 'react'
// import { motion } from 'framer-motion'
// import { 
//   Users, Coins, TrendingUp, TrendingDown, Activity, 
//   Shield, AlertTriangle, CheckCircle2, Clock, Star,
//   Twitter, Wallet, Gift, BarChart3, Eye, ArrowUp,
//   ArrowDown, RefreshCw, Download, Calendar, Zap
// } from 'lucide-react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress'
// import { 
//   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
//   ResponsiveContainer, AreaChart, Area, BarChart, Bar,
//   PieChart, Pie, Cell
// } from 'recharts'

// interface AdminStats {
//   totalUsers: number
//   activeUsers: number
//   totalPoints: number
//   totalClaims: number
//   pendingClaims: number
//   totalDistributed: number
//   totalEngagements: number
//   newUsersToday: number
//   claimsEnabled: boolean
//   maintenanceMode: boolean
//   systemHealth: 'healthy' | 'warning' | 'critical'
//   revenue24h?: number
//   claimRate24h?: number
//   engagementRate?: number
//   averageUserLevel?: number
// }

// interface ChartData {
//   name: string
//   users: number
//   claims: number
//   engagement: number
//   revenue?: number
//   [key: string]: any
// }

// interface RecentActivity {
//   id: string
//   type: 'user_join' | 'claim' | 'twitter_connect' | 'admin_action'
//   description: string
//   timestamp: Date
//   userId?: string
//   amount?: number
//   status: 'success' | 'warning' | 'error'
// }

// interface TopUser {
//   id: string
//   walletAddress: string
//   twitterUsername?: string
//   totalPoints: number
//   level: number
//   rank: number
//   twitterFollowers?: number
// }

// export function AdminOverview({ 
//   stats, 
//   onRefresh 
// }: { 
//   stats: AdminStats | null
//   onRefresh: () => void
// }) {
//   const [chartData, setChartData] = useState<ChartData[]>([])
//   const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
//   const [topUsers, setTopUsers] = useState<TopUser[]>([])
//   const [loading, setLoading] = useState(false)
//   const [timeRange, setTimeRange] = useState('7d')

//   useEffect(() => {
//     fetchChartData()
//     fetchRecentActivity()
//     fetchTopUsers()
//   }, [timeRange])

//   const fetchChartData = async () => {
//     try {
//       const res = await fetch(`/api/admin/analytics/overview?range=${timeRange}`)
//       if (res.ok) {
//         const data = await res.json()
//         setChartData(data.chartData || [])
//       }
//     } catch (error) {
//       console.error('Failed to fetch chart data:', error)
//     }
//   }

//   const fetchRecentActivity = async () => {
//     try {
//       const res = await fetch('/api/admin/activity/recent?limit=10')
//       if (res.ok) {
//         const data = await res.json()
//         setRecentActivity(data.activities || [])
//       }
//     } catch (error) {
//       console.error('Failed to fetch recent activity:', error)
//     }
//   }

//   const fetchTopUsers = async () => {
//     try {
//       const res = await fetch('/api/admin/users/top?limit=5')
//       if (res.ok) {
//         const data = await res.json()
//         setTopUsers(data.users || [])
//       }
//     } catch (error) {
//       console.error('Failed to fetch top users:', error)
//     }
//   }

//   const getSystemHealthColor = () => {
//     if (!stats) return 'text-gray-400'
//     switch (stats.systemHealth) {
//       case 'healthy': return 'text-green-400'
//       case 'warning': return 'text-yellow-400'
//       case 'critical': return 'text-red-400'
//       default: return 'text-gray-400'
//     }
//   }

//   const getActivityIcon = (type: string) => {
//     switch (type) {
//       case 'user_join': return <Users className="w-4 h-4 text-blue-400" />
//       case 'claim': return <Coins className="w-4 h-4 text-green-400" />
//       case 'twitter_connect': return <Twitter className="w-4 h-4 text-blue-400" />
//       case 'admin_action': return <Shield className="w-4 h-4 text-purple-400" />
//       default: return <Activity className="w-4 h-4 text-gray-400" />
//     }
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'success': return 'text-green-400'
//       case 'warning': return 'text-yellow-400'
//       case 'error': return 'text-red-400'
//       default: return 'text-gray-400'
//     }
//   }

//   const formatNumber = (num: number) => {
//     if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
//     if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
//     return num.toString()
//   }

//   const calculateGrowth = (current: number, previous: number) => {
//     if (previous === 0) return 0
//     return (
//     <div className="space-y-6">
//       {/* Header Actions */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <div className={`flex items-center gap-2 ${getSystemHealthColor()}`}>
//             <div className={`w-3 h-3 rounded-full ${
//               stats.systemHealth === 'healthy' ? 'bg-green-400' :
//               stats.systemHealth === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
//             }`} />
//             <span className="font-medium capitalize">{stats.systemHealth}</span>
//           </div>
          
//           {stats.maintenanceMode && (
//             <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
//               Maintenance Mode
//             </Badge>
//           )}
          
//           <Badge className={stats.claimsEnabled ? 
//             'bg-green-500/20 text-green-400 border-green-500/30' : 
//             'bg-red-500/20 text-red-400 border-red-500/30'
//           }>
//             Claims {stats.claimsEnabled ? 'Enabled' : 'Disabled'}
//           </Badge>
//         </div>

//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setTimeRange('24h')}
//               className={timeRange === '24h' ? 'bg-blue-600' : ''}
//             >
//               24H
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setTimeRange('7d')}
//               className={timeRange === '7d' ? 'bg-blue-600' : ''}
//             >
//               7D
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setTimeRange('30d')}
//               className={timeRange === '30d' ? 'bg-blue-600' : ''}
//             >
//               30D
//             </Button>
//           </div>
          
//           <Button variant="outline" size="sm" onClick={onRefresh}>
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Refresh
//           </Button>
          
//           <Button variant="outline" size="sm">
//             <Download className="w-4 h-4 mr-2" />
//             Export
//           </Button>
//         </div>
//       </div>

//       {/* Key Metrics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//         >
//           <Card className="border-white/10 bg-white/5">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm font-medium">Total Users</p>
//                   <p className="text-3xl font-bold text-white mt-2">
//                     {formatNumber(stats.totalUsers)}
//                   </p>
//                   <div className="flex items-center gap-1 mt-2">
//                     <ArrowUp className="w-4 h-4 text-green-400" />
//                     <span className="text-green-400 text-sm">+{stats.newUsersToday} today</span>
//                   </div>
//                 </div>
//                 <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
//                   <Users className="w-6 h-6 text-blue-400" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//         >
//           <Card className="border-white/10 bg-white/5">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm font-medium">Active Users</p>
//                   <p className="text-3xl font-bold text-white mt-2">
//                     {formatNumber(stats.activeUsers)}
//                   </p>
//                   <div className="flex items-center gap-1 mt-2">
//                     <div className="text-gray-400 text-sm">
//                       {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
//                     </div>
//                   </div>
//                 </div>
//                 <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
//                   <Activity className="w-6 h-6 text-green-400" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//         >
//           <Card className="border-white/10 bg-white/5">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm font-medium">Total Claims</p>
//                   <p className="text-3xl font-bold text-white mt-2">
//                     {formatNumber(stats.totalClaims)}
//                   </p>
//                   <div className="flex items-center gap-1 mt-2">
//                     <Clock className="w-4 h-4 text-yellow-400" />
//                     <span className="text-yellow-400 text-sm">{stats.pendingClaims} pending</span>
//                   </div>
//                 </div>
//                 <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
//                   <Coins className="w-6 h-6 text-purple-400" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//         >
//           <Card className="border-white/10 bg-white/5">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-400 text-sm font-medium">Tokens Distributed</p>
//                   <p className="text-3xl font-bold text-white mt-2">
//                     {formatNumber(stats.totalDistributed)}
//                   </p>
//                   <div className="flex items-center gap-1 mt-2">
//                     <TrendingUp className="w-4 h-4 text-green-400" />
//                     <span className="text-green-400 text-sm">CONNECT</span>
//                   </div>
//                 </div>
//                 <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
//                   <Gift className="w-6 h-6 text-yellow-400" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* User Growth Chart */}
//         <Card className="border-white/10 bg-white/5">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <TrendingUp className="w-5 h-5" />
//               User Growth
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={300}>
//               <AreaChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//                 <XAxis dataKey="name" stroke="#9CA3AF" />
//                 <YAxis stroke="#9CA3AF" />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: '#1F2937',
//                     border: '1px solid #374151',
//                     borderRadius: '8px'
//                   }}
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="users"
//                   stroke="#3B82F6"
//                   fill="url(#userGradient)"
//                   strokeWidth={2}
//                 />
//                 <defs>
//                   <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
//                     <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//               </AreaChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>

//         {/* Claims Activity Chart */}
//         <Card className="border-white/10 bg-white/5">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <BarChart3 className="w-5 h-5" />
//               Claims Activity
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//                 <XAxis dataKey="name" stroke="#9CA3AF" />
//                 <YAxis stroke="#9CA3AF" />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: '#1F2937',
//                     border: '1px solid #374151',
//                     borderRadius: '8px'
//                   }}
//                 />
//                 <Bar dataKey="claims" fill="#10B981" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Bottom Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Recent Activity */}
//         <Card className="border-white/10 bg-white/5 lg:col-span-2">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Activity className="w-5 h-5" />
//               Recent Activity
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {recentActivity.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-400">No recent activity</p>
//                 </div>
//               ) : (
//                 recentActivity.map((activity, index) => (
//                   <motion.div
//                     key={activity.id}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                     className="flex items-center gap-4 p-3 rounded-lg bg-white/5"
//                   >
//                     <div className="flex-shrink-0">
//                       {getActivityIcon(activity.type)}
//                     </div>
                    
//                     <div className="flex-1 min-w-0">
//                       <p className="text-white text-sm">
//                         {activity.description}
//                       </p>
//                       <div className="flex items-center gap-2 mt-1">
//                         <span className="text-xs text-gray-400">
//                           {new Date(activity.timestamp).toLocaleTimeString()}
//                         </span>
//                         {activity.amount && (
//                           <span className="text-xs text-green-400">
//                             +{activity.amount} CONNECT
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     <div className={`w-2 h-2 rounded-full ${
//                       activity.status === 'success' ? 'bg-green-400' :
//                       activity.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
//                     }`} />
//                   </motion.div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Top Users */}
//         <Card className="border-white/10 bg-white/5">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Star className="w-5 h-5" />
//               Top Users
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {topUsers.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-400 text-sm">No users found</p>
//                 </div>
//               ) : (
//                 topUsers.map((user, index) => (
//                   <motion.div
//                     key={user.id}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                     className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="flex-shrink-0">
//                         <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 w-8 h-8 rounded-full flex items-center justify-center p-0">
//                           #{user.rank}
//                         </Badge>
//                       </div>
                      
//                       <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
//                         <span className="text-white text-sm font-bold">
//                           {user.walletAddress.slice(0, 2).toUpperCase()}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2">
//                         <p className="text-white text-sm font-medium truncate">
//                           {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-4)}
//                         </p>
//                       </div>
                      
//                       {user.twitterUsername && (
//                         <div className="flex items-center gap-1 mt-1">
//                           <Twitter className="w-3 h-3 text-blue-400" />
//                           <span className="text-gray-400 text-xs">@{user.twitterUsername}</span>
//                         </div>
//                       )}
                      
//                       <div className="flex items-center gap-2 mt-1">
//                         <span className="text-green-400 text-xs font-semibold">
//                           {formatNumber(user.totalPoints)} pts
//                         </span>
//                         <span className="text-gray-400 text-xs">Level {user.level}</span>
//                       </div>
//                     </div>

//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
//                     >
//                       <Eye className="w-4 h-4" />
//                     </Button>
//                   </motion.div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Additional Metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="border-white/10 bg-white/5">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-400 text-xs">Twitter Engagements</p>
//                 <p className="text-xl font-bold text-white">{formatNumber(stats.totalEngagements)}</p>
//               </div>
//               <Twitter className="w-8 h-8 text-blue-400" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-white/10 bg-white/5">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-400 text-xs">Avg User Level</p>
//                 <p className="text-xl font-bold text-white">{stats.averageUserLevel?.toFixed(1) || '0'}</p>
//               </div>
//               <TrendingUp className="w-8 h-8 text-green-400" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-white/10 bg-white/5">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-400 text-xs">Engagement Rate</p>
//                 <p className="text-xl font-bold text-white">{stats.engagementRate?.toFixed(1) || '0'}%</p>
//               </div>
//               <Activity className="w-8 h-8 text-purple-400" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-white/10 bg-white/5">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-400 text-xs">Claim Rate (24h)</p>
//                 <p className="text-xl font-bold text-white">{stats.claimRate24h?.toFixed(1) || '0'}%</p>
//               </div>
//               <Zap className="w-8 h-8 text-yellow-400" />
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )(current - previous) / previous) * 100
//   }

//   if (!stats) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <div className="flex flex-col items-center space-y-4">
//           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//           <p className="text-gray-400">Loading overview...</p>
//         </div>
//       </div>
//     )
//   }

//   return (