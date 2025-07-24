// 'use client'

// import React, { useState, useEffect, useRef } from 'react'
// import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
// import { 
//   Wallet, Twitter, Trophy, TrendingUp, Users, Coins, 
//   Star, Activity, Target, Gift, Zap, ArrowUpRight,
//   CheckCircle, Circle, Calendar, Award, Copy, Check,
//   Eye, Heart, MessageCircle, Repeat, UserPlus, Share2,
//   ExternalLink, Crown, Medal, Clock, BarChart3, Flame,
//   DollarSign, AlertTriangle, Shield
// } from 'lucide-react'
// import toast from 'react-hot-toast'

// // Keep your existing DashboardData interface (no changes needed)
// interface DashboardData {
//   user: {
//     id: string
//     walletAddress: string
//     totalPoints: number
//     rank: number
//     level: number
//     streak: number
//     twitterUsername?: string
//     twitterFollowers: number
//     twitterActivity: 'HIGH' | 'MEDIUM' | 'LOW'
//     referralCode: string
//     totalEarnedTokens?: number
//     lastLoginReward?: string
//   }
//   stats: {
//     todayPoints: number
//     weeklyPoints: number
//     totalEngagements: number
//     referralCount: number
//     tokenAllocation: number
//     dailyEarningStatus?: {
//       canClaim: boolean
//       currentStreak: number
//       totalEarned: number
//       nextClaimIn: number
//     }
//   }
//   recentActivity: Array<{
//     id: string
//     action: string
//     points: number
//     createdAt: string
//   }>
//   achievements: Array<{
//     id: string
//     title: string
//     description: string
//     icon: string
//     unlocked: boolean
//     progress: number
//   }>
//   referrals: {
//     totalReferrals: number
//     activeReferrals: number
//     totalEarned: number
//     recentReferrals: Array<{
//       id: string
//       walletAddress: string
//       twitterUsername?: string
//       points: number
//       completed: boolean
//       createdAt: string
//     }>
//   }
// }

// export default function EnhancedDashboard() {
//   const [data, setData] = useState<DashboardData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [activeTab, setActiveTab] = useState('overview')
//   const [showClaim, setShowClaim] = useState(false)
//   const [copied, setCopied] = useState(false)
//   const [claiming, setClaiming] = useState(false)
//   const [tasks, setTasks] = useState<any>([])
//   const [achievements, setAchievements] = useState<any>([])
//   const [rewards, setRewards] = useState<any>([])
//   const containerRef = useRef(null)
  
//   const { scrollYProgress } = useScroll({
//     target: containerRef,
//     offset: ["start start", "end end"]
//   })

//   const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
//   const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])

//   useEffect(() => {
//     fetchDashboardData()
//     const interval = setInterval(fetchDashboardData, 30000)
//     return () => clearInterval(interval)
//   }, [])

//   // Fetch additional data
//   const fetchTasksData = async () => {
//     try {
//       const res = await fetch('/api/tasks')
//       if (res.ok) {
//         const tasksData = await res.json()
//         setTasks(tasksData.tasks || [])
//       }
//     } catch (error) {
//       console.error('Failed to fetch tasks:', error)
//       // Fallback to default tasks
//       setTasks([
//         { id: '1', title: 'Connect Twitter Account', description: 'Link your Twitter account to start earning points', points: 50, completed: !!data?.user.twitterUsername, icon: 'twitter' },
//         { id: '2', title: 'Connect Wallet', description: 'Connect your Solana wallet to receive rewards', points: 25, completed: !!data?.user.walletAddress, icon: 'wallet' },
//         { id: '3', title: 'Like 5 Tweets', description: 'Like 5 different tweets to earn engagement points', points: 30, completed: false, icon: 'heart' },
//         { id: '4', title: 'Share Platform', description: 'Share our platform on Twitter to earn bonus points', points: 100, completed: false, icon: 'share' }
//       ])
//     }
//   }

//   const fetchAchievementsData = async () => {
//     try {
//       const res = await fetch('/api/achievements')
//       if (res.ok) {
//         const achievementsData = await res.json()
//         setAchievements(achievementsData.achievements || [])
//       }
//     } catch (error) {
//       console.error('Failed to fetch achievements:', error)
//       // Use achievements from main data as fallback
//       if (data?.achievements) {
//         setAchievements(data.achievements as any)
//       }
//     }
//   }

//   const fetchRewardsData = async () => {
//     try {
//       const res = await fetch('/api/rewards')
//       if (res.ok) {
//         const rewardsData = await res.json()
//         setRewards(rewardsData.rewards || [])
//       }
//     } catch (error) {
//       console.error('Failed to fetch rewards:', error)
//       // Fallback to default rewards
//       setRewards([
//         { id: '1', name: 'Bronze Badge', description: 'Reach 100 points', cost: 100, available: (data?.user.totalPoints || 0) >= 100 },
//         { id: '2', name: 'Silver Badge', description: 'Reach 500 points', cost: 500, available: (data?.user.totalPoints || 0) >= 500 },
//         { id: '3', name: 'CONNECT Tokens', description: 'Exchange points for tokens', cost: 50, available: true }
//       ])
//     }
//   }

//   // Fetch all data on component mount and when activeTab changes
//   useEffect(() => {
//     if (data) {
//       if (activeTab === 'tasks') {
//         fetchTasksData()
//       } else if (activeTab === 'rewards') {
//         fetchAchievementsData()
//         fetchRewardsData()
//       }
//     }
//   }, [activeTab, data])
  

//   useEffect(() => {
//     fetchDashboardData()
//     const interval = setInterval(fetchDashboardData, 30000)
//     return () => clearInterval(interval)
//   }, [])

//   const fetchDashboardData = async () => {
//     try {
//       const res = await fetch('/api/user/dashboard')
//       if (res.ok) {
//         const dashboardData = await res.json()
//         console.log('Dashboard data loaded:', dashboardData)
//         setData(dashboardData)
//       } else {
//         console.error('Failed to fetch dashboard data:', res.status)
//         // Fallback to mock data for development
//         setData(getMockData())
//       }
//     } catch (error) {
//       console.error('Failed to load dashboard:', error)
//       // Fallback to mock data for development
//       setData(getMockData())
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Mock data function for fallback
//   const getMockData = (): DashboardData => ({
//     user: {
//       id: 'user_123',
//       walletAddress: 'ABC123...XYZ789',
//       totalPoints: 1250,
//       rank: 42,
//       level: 5,
//       streak: 7,
//       twitterUsername: 'cryptouser',
//       twitterFollowers: 1500,
//       twitterActivity: 'HIGH',
//       referralCode: 'REF123ABC',
//       totalEarnedTokens: 125,
//       lastLoginReward: new Date().toISOString()
//     },
//     stats: {
//       todayPoints: 45,
//       weeklyPoints: 280,
//       totalEngagements: 87,
//       referralCount: 12,
//       tokenAllocation: 4000,
//       dailyEarningStatus: {
//         canClaim: true,
//         currentStreak: 5,
//         totalEarned: 125,
//         nextClaimIn: 0
//       }
//     },
//     recentActivity: [
//       { id: '1', action: 'Completed daily login', points: 5, createdAt: new Date().toISOString() },
//       { id: '2', action: 'Liked 5 tweets', points: 25, createdAt: new Date(Date.now() - 86400000).toISOString() },
//       { id: '3', action: 'Referred new user', points: 100, createdAt: new Date(Date.now() - 172800000).toISOString() },
//       { id: '4', action: 'Connected Twitter', points: 50, createdAt: new Date(Date.now() - 259200000).toISOString() },
//       { id: '5', action: 'First wallet connection', points: 25, createdAt: new Date(Date.now() - 345600000).toISOString() }
//     ],
//     achievements: [
//       { id: '1', title: 'First Steps', description: 'Complete your first task', icon: '🚀', unlocked: true, progress: 100 },
//       { id: '2', title: 'Social Butterfly', description: 'Connect Twitter account', icon: '🐦', unlocked: true, progress: 100 },
//       { id: '3', title: 'Engagement Master', description: 'Complete 10 tasks', icon: '💪', unlocked: false, progress: 60 },
//       { id: '4', title: 'Top Performer', description: 'Reach top 100', icon: '🏆', unlocked: false, progress: 25 }
//     ],
//     referrals: {
//       totalReferrals: 12,
//       activeReferrals: 8,
//       totalEarned: 360,
//       recentReferrals: [
//         { id: '1', walletAddress: 'DEF456...UVW012', twitterUsername: 'newuser1', points: 30, completed: true, createdAt: new Date().toISOString() },
//         { id: '2', walletAddress: 'GHI789...RST345', points: 30, completed: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
//         { id: '3', walletAddress: 'JKL012...OPQ678', twitterUsername: 'cryptofan', points: 30, completed: false, createdAt: new Date(Date.now() - 172800000).toISOString() }
//       ]
//     }
//   })

//   // Utility functions
//   const generateReferralLink = () => {
//     if (!data?.user.referralCode) return ''
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
//     return `${baseUrl}?ref=${data.user.referralCode}`
//   }

//   const copyReferralLink = async () => {
//     const link = generateReferralLink()
//     try {
//       await navigator.clipboard.writeText(link)
//       setCopied(true)
//       toast.success('Referral link copied to clipboard!')
//       setTimeout(() => setCopied(false), 2000)
//     } catch (error) {
//       toast.error('Failed to copy referral link')
//     }
//   }

//   const shareReferralLink = async () => {
//     const link = generateReferralLink()
//     const shareData = {
//       title: 'Join the Solana Airdrop Platform',
//       text: 'Earn rewards by engaging with our community!',
//       url: link
//     }

//     if (navigator.share) {
//       try {
//         await navigator.share(shareData)
//       } catch (error) {
//         copyReferralLink()
//       }
//     } else {
//       copyReferralLink()
//     }
//   }

//   const handleDailyClaim = async () => {
//     setClaiming(true)
//     try {
//       const res = await fetch('/api/earning/daily-claim', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       })

//       const result = await res.json()

//       if (res.ok) {
//         toast.success(`Claimed ${result.tokens || 5} CONNECT tokens! 🎉`)
        
//         // Refresh dashboard data to get updated stats
//         await fetchDashboardData()
//       } else {
//         toast.error(result.error || 'Failed to claim daily reward')
//       }
//     } catch (error) {
//       console.error('Daily claim error:', error)
//       toast.error('Failed to claim daily reward')
//     } finally {
//       setClaiming(false)
//     }
//   }

//   const handleTaskComplete = async (taskId: string, points: number) => {
//     try {
//       const res = await fetch('/api/tasks/checkin', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ taskId })
//       })

//       const result = await res.json()

//       if (res.ok) {
//         toast.success(`Task completed! +${result.points || points} points`)
        
//         // Refresh dashboard data to get updated stats
//         await fetchDashboardData()
//       } else {
//         toast.error(result.error || 'Failed to complete task')
//       }
//     } catch (error) {
//       console.error('Task completion error:', error)
//       toast.error('Failed to complete task')
//     }
//   }

//   const handleRewardClaim = async (rewardId: string) => {
//     try {
//       const res = await fetch('/api/airdrop/claim', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ rewardId })
//       })

//       const result = await res.json()

//       if (res.ok) {
//         toast.success('Reward claimed successfully!')
        
//         // Refresh dashboard data to get updated stats
//         await fetchDashboardData()
//       } else {
//         toast.error(result.error || 'Failed to claim reward')
//       }
//     } catch (error) {
//       console.error('Reward claim error:', error)
//       toast.error('Failed to claim reward')
//     }
//   }

//   const handleAirdropClaim = async () => {
//     try {
//       const res = await fetch('/api/airdrop/claim', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       })

//       const result = await res.json()

//       if (res.ok) {
//         toast.success(`Successfully claimed ${result.tokens} CONNECT tokens!`)
//         setShowClaim(false)
        
//         // Refresh dashboard data to get updated stats
//         await fetchDashboardData()
//       } else {
//         toast.error(result.error || 'Failed to claim airdrop')
//       }
//     } catch (error) {
//       console.error('Airdrop claim error:', error)
//       toast.error('Failed to claim airdrop')
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
//         <div className="flex items-center space-x-4">
//           <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
//           <span className="text-white text-xl">Loading Dashboard...</span>
//         </div>
//       </div>
//     )
//   }

//   if (!data) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Dashboard</h2>
//           <button 
//             onClick={fetchDashboardData}
//             className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     )
//   }

//   const formatNextClaim = (hours: number) => {
//     if (hours <= 0) return 'Available now!'
//     if (hours < 1) return `${Math.ceil(hours * 60)} minutes`
//     return `${Math.floor(hours)} hours ${Math.ceil((hours % 1) * 60)} minutes`
//   }

//   return (
//     <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
//       {/* Background Animation */}
//       <motion.div
//         style={{ y: backgroundY }}
//         className="absolute inset-0 opacity-30"
//       >
//         <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
//         <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
//         <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
//       </motion.div>

//       {/* Header */}
//       <motion.header
//         style={{ opacity: headerOpacity }}
//         className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10"
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-white">Dashboard</h1>
//               <p className="text-gray-400 mt-1">Welcome back, {data.user.twitterUsername || 'User'}</p>
//             </div>
            
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg">
//                 <Trophy className="w-5 h-5 text-yellow-400" />
//                 <span className="text-white font-semibold">Rank #{data.user.rank}</span>
//               </div>
              
//               <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg">
//                 <Coins className="w-5 h-5 text-green-400" />
//                 <span className="text-white font-semibold">{data.user.totalPoints.toLocaleString()} Points</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.header>

//       {/* Main Content */}
//       <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Navigation Tabs */}
//         <div className="flex items-center space-x-1 mb-8 bg-white/5 rounded-xl p-1 overflow-x-auto">
//           {[
//             { id: 'overview', label: 'Overview', icon: BarChart3 },
//             { id: 'earning', label: 'Daily Earning', icon: Coins },
//             { id: 'tasks', label: 'Tasks', icon: Target },
//             { id: 'rewards', label: 'Rewards', icon: Gift },
//             { id: 'referrals', label: 'Referrals', icon: Users },
//             { id: 'analytics', label: 'Analytics', icon: TrendingUp }
//           ].map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => {
//                 console.log(`Switching to ${tab.id} tab`) // Debug log
//                 setActiveTab(tab.id)
//               }}
//               className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium whitespace-nowrap ${
//                 activeTab === tab.id
//                   ? 'bg-purple-600 text-white shadow-lg'
//                   : 'text-gray-400 hover:text-white hover:bg-white/10'
//               }`}
//             >
//               <tab.icon className="w-5 h-5" />
//               <span>{tab.label}</span>
//             </button>
//           ))}
//         </div>

//         {/* Tab Content */}
//         <AnimatePresence mode="wait">
//           {activeTab === 'overview' && (
//             <motion.div
//               key="overview"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-8"
//             >
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 <div className="lg:col-span-2 space-y-6">
//                   {/* Daily Earning Card */}
//                   <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
//                     <div className="flex items-center justify-between mb-6">
//                       <div className="flex items-center gap-3">
//                         <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
//                           <Coins className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h3 className="text-xl font-bold text-white">Daily Earning</h3>
//                           <p className="text-gray-400">Login to earn 5 CONNECT daily</p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-2xl font-bold text-green-400">{data.stats.dailyEarningStatus?.totalEarned || 0}</p>
//                         <p className="text-gray-400 text-sm">Total Earned</p>
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4 mb-6">
//                       <div className="bg-white/5 rounded-xl p-4">
//                         <div className="flex items-center gap-2 mb-2">
//                           <Flame className="w-5 h-5 text-orange-400" />
//                           <span className="text-white font-semibold">Current Streak</span>
//                         </div>
//                         <p className="text-2xl font-bold text-orange-400">{data.stats.dailyEarningStatus?.currentStreak || 0}</p>
//                         <p className="text-gray-400 text-sm">days in a row</p>
//                       </div>
                      
//                       <div className="bg-white/5 rounded-xl p-4">
//                         <div className="flex items-center gap-2 mb-2">
//                           <Clock className="w-5 h-5 text-blue-400" />
//                           <span className="text-white font-semibold">Next Claim</span>
//                         </div>
//                         <p className="text-blue-400 font-semibold">
//                           {formatNextClaim(data.stats.dailyEarningStatus?.nextClaimIn || 0)}
//                         </p>
//                       </div>
//                     </div>

//                     <button
//                       onClick={handleDailyClaim}
//                       disabled={!data.stats.dailyEarningStatus?.canClaim || claiming}
//                       className={`w-full py-4 rounded-xl font-semibold transition-all ${
//                         data.stats.dailyEarningStatus?.canClaim
//                           ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
//                           : 'bg-gray-700 text-gray-400 cursor-not-allowed'
//                       }`}
//                     >
//                       {claiming ? (
//                         <div className="flex items-center justify-center gap-2">
//                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                           Claiming...
//                         </div>
//                       ) : data.stats.dailyEarningStatus?.canClaim ? (
//                         'Claim 5 CONNECT Tokens'
//                       ) : (
//                         `Available in ${formatNextClaim(data.stats.dailyEarningStatus?.nextClaimIn || 0)}`
//                       )}
//                     </button>
//                   </div>

//                   {/* Recent Activity */}
//                   <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
//                     <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
//                     <div className="space-y-3">
//                       {data.recentActivity.slice(0, 5).map((activity) => (
//                         <div key={activity.id} className="flex justify-between items-center py-2">
//                           <div>
//                             <p className="text-white font-medium">{activity.action}</p>
//                             <p className="text-gray-400 text-sm">
//                               {new Date(activity.createdAt).toLocaleDateString()}
//                             </p>
//                           </div>
//                           <span className="text-green-400 font-semibold">+{activity.points}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Sidebar */}
//                 <div className="space-y-6">
//                   {/* Quick Stats */}
//                   <div className="bg-white/5 rounded-2xl p-6">
//                     <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
//                     <div className="space-y-4">
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Today's Points</span>
//                         <span className="text-white font-semibold">{data.stats.todayPoints}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">This Week</span>
//                         <span className="text-white font-semibold">{data.stats.weeklyPoints}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Referrals</span>
//                         <span className="text-white font-semibold">{data.stats.referralCount}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Engagements</span>
//                         <span className="text-white font-semibold">{data.stats.totalEngagements}</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Referral Card */}
//                   <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
//                     <h3 className="text-xl font-bold text-white mb-4">Referral Program</h3>
//                     <p className="text-gray-300 mb-4">Earn 3 CONNECT tokens for each successful referral!</p>
//                     <button
//                       onClick={copyReferralLink}
//                       className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
//                     >
//                       {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
//                       {copied ? 'Copied!' : 'Copy Referral Link'}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {activeTab === 'earning' && (
//             <motion.div
//               key="earning"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-8"
//             >
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {/* Daily Earning Card */}
//                 <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
//                   <div className="flex items-center justify-between mb-6">
//                     <div className="flex items-center gap-3">
//                       <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
//                         <Coins className="w-6 h-6 text-white" />
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold text-white">Daily Earning</h3>
//                         <p className="text-gray-400">Login to earn 5 CONNECT daily</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-2xl font-bold text-green-400">{data.stats.dailyEarningStatus?.totalEarned || 0}</p>
//                       <p className="text-gray-400 text-sm">Total Earned</p>
//                     </div>
//                   </div>

//                   <button
//                     onClick={handleDailyClaim}
//                     disabled={!data.stats.dailyEarningStatus?.canClaim || claiming}
//                     className={`w-full py-4 rounded-xl font-semibold transition-all ${
//                       data.stats.dailyEarningStatus?.canClaim
//                         ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
//                         : 'bg-gray-700 text-gray-400 cursor-not-allowed'
//                     }`}
//                   >
//                     {claiming ? 'Claiming...' : data.stats.dailyEarningStatus?.canClaim ? 'Claim 5 CONNECT Tokens' : 'Already Claimed'}
//                   </button>
//                 </div>
                
//                 {/* Earning History */}
//                 <div className="bg-white/5 rounded-2xl p-6">
//                   <h3 className="text-xl font-bold text-white mb-4">Earning History</h3>
//                   <div className="space-y-3">
//                     {data.recentActivity.slice(0, 5).map((activity) => (
//                       <div key={activity.id} className="flex justify-between items-center py-2">
//                         <div>
//                           <p className="text-white font-medium">{activity.action}</p>
//                           <p className="text-gray-400 text-sm">
//                             {new Date(activity.createdAt).toLocaleDateString()}
//                           </p>
//                         </div>
//                         <span className="text-green-400 font-semibold">+{activity.points}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {activeTab === 'tasks' && (
//             <motion.div
//               key="tasks"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-8"
//             >
//               {/* Tasks Header */}
//               <div className="text-center">
//                 <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
//                   <Target className="w-8 h-8 text-purple-400" />
//                   Tasks & Challenges
//                 </h2>
//                 <p className="text-gray-400">Complete tasks to earn points and unlock rewards</p>
//               </div>

//               {/* Task Stats */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div className="bg-white/5 rounded-xl p-6">
//                   <Target className="w-8 h-8 text-blue-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-2">Available Tasks</h4>
//                   <p className="text-3xl font-bold text-blue-400">8</p>
//                 </div>
                
//                 <div className="bg-white/5 rounded-xl p-6">
//                   <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-2">Completed</h4>
//                   <p className="text-3xl font-bold text-green-400">5</p>
//                 </div>
                
//                 <div className="bg-white/5 rounded-xl p-6">
//                   <Coins className="w-8 h-8 text-yellow-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-2">Points Earned</h4>
//                   <p className="text-3xl font-bold text-yellow-400">205</p>
//                 </div>
//               </div>

//               {/* Tasks List */}
//               <div className="space-y-4">
//                 <h3 className="text-xl font-bold text-white">Available Tasks</h3>
                
//                 {(tasks.length > 0 ? tasks : [
//                   { id: '1', title: 'Connect Twitter Account', description: 'Link your Twitter account to start earning points', points: 50, completed: !!data?.user.twitterUsername, icon: 'twitter' },
//                   { id: '2', title: 'Connect Wallet', description: 'Connect your Solana wallet to receive rewards', points: 25, completed: !!data?.user.walletAddress, icon: 'wallet' },
//                   { id: '3', title: 'Like 5 Tweets', description: 'Like 5 different tweets to earn engagement points', points: 30, completed: false, icon: 'heart' },
//                   { id: '4', title: 'Share Platform', description: 'Share our platform on Twitter to earn bonus points', points: 100, completed: false, icon: 'share' }
//                 ]).map((task:any) => {
//                   const getTaskIcon = (iconName: string) => {
//                     const iconMap: Record<string, any> = {
//                       twitter: Twitter,
//                       wallet: Wallet,
//                       heart: Heart,
//                       share: Share2
//                     }
//                     return iconMap[iconName] || Target
//                   }
                  
//                   const IconComponent = getTaskIcon(task.icon)
                  
//                   return (
//                     <div
//                       key={task.id}
//                       className="bg-white/5 rounded-xl p-6 border border-white/10"
//                     >
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-4 flex-1">
//                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
//                             task.completed ? 'bg-green-500/20' : 'bg-purple-500/20'
//                           }`}>
//                             {task.completed ? (
//                               <CheckCircle className="w-6 h-6 text-green-400" />
//                             ) : (
//                               <IconComponent className="w-6 h-6 text-purple-400" />
//                             )}
//                           </div>
                          
//                           <div className="flex-1">
//                             <div className="flex items-center gap-3 mb-2">
//                               <h4 className="text-lg font-semibold text-white">{task.title}</h4>
//                               <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
//                                 +{task.points} pts
//                               </span>
//                             </div>
//                             <p className="text-gray-400">{task.description}</p>
//                           </div>
//                         </div>
                        
//                         <div className="ml-4">
//                           {task.completed ? (
//                             <div className="px-6 py-2 bg-green-500/20 text-green-300 rounded-lg font-medium">
//                               Completed
//                             </div>
//                           ) : (
//                             <button
//                               onClick={() => handleTaskComplete(task.id, task.points)}
//                               className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
//                             >
//                               Complete
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             </motion.div>
//           )}

//           {activeTab === 'rewards' && (
//             <motion.div
//               key="rewards"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-8"
//             >
//               {/* Rewards Header */}
//               <div className="text-center">
//                 <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
//                   <Gift className="w-8 h-8 text-purple-400" />
//                   Rewards & Achievements
//                 </h2>
//                 <p className="text-gray-400">Unlock achievements and claim rewards</p>
//               </div>

//               {/* Stats Overview */}
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                 <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
//                   <Trophy className="w-8 h-8 text-yellow-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-2">Achievements</h4>
//                   <p className="text-3xl font-bold text-yellow-400">
//                     {data.achievements.filter(a => a.unlocked).length}/{data.achievements.length}
//                   </p>
//                 </div>
                
//                 <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
//                   <Star className="w-8 h-8 text-blue-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-2">Achievement Points</h4>
//                   <p className="text-3xl font-bold text-blue-400">275</p>
//                 </div>
                
//                 <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
//                   <Award className="w-8 h-8 text-purple-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-2">Current Rank</h4>
//                   <p className="text-3xl font-bold text-purple-400">#{data.user.rank}</p>
//                 </div>
                
//                 <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
//                   <Coins className="w-8 h-8 text-green-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-2">Token Allocation</h4>
//                   <p className="text-3xl font-bold text-green-400">{data.stats.tokenAllocation}</p>
//                 </div>
//               </div>

//               {/* Achievements */}
//               <div className="space-y-6">
//                 <h3 className="text-2xl font-bold text-white flex items-center gap-3">
//                   <Trophy className="w-7 h-7 text-yellow-400" />
//                   Achievements
//                 </h3>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {(achievements.length > 0 ? achievements : data?.achievements || []).map((achievement: any) => (
//                     <div
//                       key={achievement.id}
//                       className={`p-6 rounded-xl border ${
//                         achievement.unlocked 
//                           ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
//                           : 'bg-white/5 border-white/10'
//                       }`}
//                     >
//                       <div className="flex items-start gap-4">
//                         <div className={`text-4xl ${achievement.unlocked ? 'grayscale-0' : 'grayscale'}`}>
//                           {achievement.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h4 className={`font-semibold mb-2 ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
//                             {achievement.title}
//                           </h4>
//                           <p className="text-gray-300 text-sm mb-3">{achievement.description}</p>
                          
//                           {achievement.unlocked ? (
//                             <div className="flex items-center gap-3">
//                               <span className="text-yellow-400 font-semibold">Unlocked!</span>
//                             </div>
//                           ) : (
//                             <div>
//                               <div className="flex justify-between text-sm text-gray-400 mb-2">
//                                 <span>Progress</span>
//                                 <span>{achievement.progress}%</span>
//                               </div>
//                               <div className="w-full bg-gray-700 rounded-full h-2">
//                                 <div 
//                                   className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
//                                   style={{ width: `${achievement.progress}%` }}
//                                 />
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                         {achievement.unlocked && (
//                           <CheckCircle className="w-6 h-6 text-yellow-400" />
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Available Rewards */}
//               <div className="space-y-6">
//                 <h3 className="text-2xl font-bold text-white flex items-center gap-3">
//                   <Gift className="w-7 h-7 text-purple-400" />
//                   Available Rewards
//                 </h3>
                
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   {[
//                     { id: '1', name: 'Bronze Badge', description: 'Reach 100 points', cost: 100, available: data.user.totalPoints >= 100 },
//                     { id: '2', name: 'Silver Badge', description: 'Reach 500 points', cost: 500, available: data.user.totalPoints >= 500 },
//                     { id: '3', name: 'CONNECT Tokens', description: 'Exchange points for tokens', cost: 50, available: true }
//                   ].map((reward) => (
//                     <div key={reward.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
//                       <div className="text-center">
//                         <h4 className="text-lg font-semibold text-white mb-2">{reward.name}</h4>
//                         <p className="text-gray-400 text-sm mb-4">{reward.description}</p>
//                         <div className="mb-4">
//                           <span className="text-2xl font-bold text-purple-400">{reward.cost}</span>
//                           <span className="text-gray-400 ml-1">points</span>
//                         </div>
                        
//                         <button
//                           onClick={() => handleRewardClaim(reward.id)}
//                           disabled={!reward.available}
//                           className={`w-full py-3 rounded-lg font-medium transition-colors ${
//                             reward.available
//                               ? 'bg-purple-600 hover:bg-purple-700 text-white'
//                               : 'bg-gray-700 text-gray-400 cursor-not-allowed'
//                           }`}
//                         >
//                           {reward.available ? 'Claim Reward' : 'Not Available'}
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {activeTab === 'referrals' && (
//             <motion.div
//               key="referrals"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-8"
//             >
//               {/* Enhanced Referrals Tab Content */}
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {/* Referral Stats */}
//                 <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
//                   <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
//                     <UserPlus className="w-6 h-6 text-blue-400" />
//                     Referral Program
//                   </h3>
                  
//                   <div className="grid grid-cols-2 gap-4 mb-6">
//                     <div className="bg-white/5 rounded-xl p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <Users className="w-4 h-4 text-blue-400" />
//                         <span className="text-gray-400 text-sm">Total Referrals</span>
//                       </div>
//                       <p className="text-2xl font-bold text-white">{data.referrals.totalReferrals}</p>
//                     </div>
                    
//                     <div className="bg-white/5 rounded-xl p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <Coins className="w-4 h-4 text-green-400" />
//                         <span className="text-gray-400 text-sm">Tokens Earned</span>
//                       </div>
//                       <p className="text-2xl font-bold text-green-400">{data.referrals.totalEarned}</p>
//                     </div>
//                   </div>
                  
//                   <div className="space-y-4">
//                     <div>
//                       <label className="text-white text-sm font-medium block mb-2">Your Referral Link</label>
//                       <div className="flex items-center space-x-2">
//                         <input
//                           type="text"
//                           value={generateReferralLink()}
//                           readOnly
//                           className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
//                         />
//                         <button
//                           onClick={copyReferralLink}
//                           className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
//                         >
//                           {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
//                         </button>
//                         <button
//                           onClick={shareReferralLink}
//                           className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
//                         >
//                           <Share2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </div>
                    
//                     <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
//                       <div className="flex items-center gap-2 text-green-400 mb-2">
//                         <Gift className="w-4 h-4" />
//                         <span className="font-semibold">Referral Rewards</span>
//                       </div>
//                       <p className="text-gray-300 text-sm">
//                         Earn <span className="text-green-400 font-semibold">3 CONNECT tokens</span> for each successful referral!
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Recent Referrals */}
//                 <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
//                   <h3 className="text-xl font-bold text-white mb-6">Recent Referrals</h3>
                  
//                   {data.referrals.recentReferrals.length > 0 ? (
//                     <div className="space-y-4">
//                       {data.referrals.recentReferrals.map((referral, index) => (
//                         <motion.div
//                           key={referral.id}
//                           initial={{ opacity: 0, x: -20 }}
//                           animate={{ opacity: 1, x: 0 }}
//                           transition={{ delay: 0.1 * index }}
//                           className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
//                         >
//                           <div className="flex items-center space-x-3">
//                             <div className="p-2 bg-blue-500/20 rounded-lg">
//                               <UserPlus className="w-4 h-4 text-blue-400" />
//                             </div>
//                             <div>
//                               <p className="text-white font-medium">
//                                 {referral.twitterUsername || `${referral.walletAddress.slice(0, 6)}...${referral.walletAddress.slice(-4)}`}
//                               </p>
//                               <p className="text-gray-400 text-sm">
//                                 {referral.completed ? 'Active user' : 'Pending verification'}
//                               </p>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <div className="text-green-400 font-semibold">+{referral.points}</div>
//                             <div className="text-gray-500 text-sm">
//                               {new Date(referral.createdAt).toLocaleDateString()}
//                             </div>
//                           </div>
//                         </motion.div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center py-12">
//                       <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
//                       <h4 className="text-xl font-semibold text-gray-400 mb-2">No referrals yet</h4>
//                       <p className="text-gray-500">Start sharing your referral link to earn bonus tokens!</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {activeTab === 'analytics' && (
//             <motion.div
//               key="analytics"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-8"
//             >
//               {/* Analytics Header */}
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-3xl font-bold text-white flex items-center gap-3">
//                     <BarChart3 className="w-8 h-8 text-blue-400" />
//                     Analytics Dashboard
//                   </h2>
//                   <p className="text-gray-400 mt-2">Track your performance and engagement</p>
//                 </div>
                
//                 <div className="flex gap-2">
//                   {(['7d', '30d', '90d'] as const).map((period) => (
//                     <button
//                       key={period}
//                       className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white"
//                     >
//                       {period}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Key Metrics */}
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                 <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
//                   <div className="flex items-center justify-between mb-3">
//                     <TrendingUp className="w-6 h-6 text-blue-400" />
//                     <span className="text-sm px-2 py-1 rounded bg-green-500/20 text-green-400">
//                       +12%
//                     </span>
//                   </div>
//                   <h4 className="text-white font-semibold mb-1">Total Points</h4>
//                   <p className="text-3xl font-bold text-blue-400">{data.user.totalPoints.toLocaleString()}</p>
//                 </div>

//                 <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
//                   <Activity className="w-6 h-6 text-green-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-1">Daily Average</h4>
//                   <p className="text-3xl font-bold text-green-400">45</p>
//                 </div>

//                 <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
//                   <Users className="w-6 h-6 text-purple-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-1">Engagements</h4>
//                   <p className="text-3xl font-bold text-purple-400">{data.stats.totalEngagements}</p>
//                 </div>

//                 <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
//                   <Trophy className="w-6 h-6 text-yellow-400 mb-3" />
//                   <h4 className="text-white font-semibold mb-1">Referrals</h4>
//                   <p className="text-3xl font-bold text-yellow-400">{data.stats.referralCount}</p>
//                 </div>
//               </div>

//               {/* Chart Placeholder */}
//               <div className="bg-white/5 rounded-2xl p-6">
//                 <h3 className="text-xl font-bold text-white mb-6">Points Over Time</h3>
//                 <div className="h-64 flex items-end justify-between gap-2">
//                   {[45, 78, 92, 65, 134, 87, 156].map((height, index) => (
//                     <div key={index} className="flex-1 flex flex-col items-center">
//                       <div 
//                         className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-300 hover:opacity-80"
//                         style={{ height: `${(height / 156) * 200}px` }}
//                       />
//                       <span className="text-gray-400 text-xs mt-2">
//                         {15 + index}/1
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Recent Activity */}
//               <div className="bg-white/5 rounded-2xl p-6">
//                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
//                   <Clock className="w-6 h-6 text-blue-400" />
//                   Recent Activity
//                 </h3>
//                 <div className="space-y-4">
//                   {data.recentActivity.slice(0, 5).map((activity) => (
//                     <div key={activity.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
//                           <Activity className="w-4 h-4 text-blue-400" />
//                         </div>
//                         <div>
//                           <p className="text-white font-medium">{activity.action}</p>
//                           <p className="text-gray-400 text-sm">
//                             {new Date(activity.createdAt).toLocaleDateString()}
//                           </p>
//                         </div>
//                       </div>
//                       <span className="text-green-400 font-semibold">+{activity.points}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>

//       {/* Claim Modal */}
//       <AnimatePresence>
//         {showClaim && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//             onClick={() => setShowClaim(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-gray-900 p-8 rounded-3xl border border-white/10 max-w-md w-full"
//             >
//               <h3 className="text-2xl font-bold text-white mb-4">Claim Your Tokens</h3>
//               <p className="text-gray-400 mb-6">
//                 You're about to claim {data.stats.tokenAllocation?.toLocaleString() || 0} tokens based on your{' '}
//                 {data.user.twitterActivity?.toLowerCase()} activity level.
//               </p>
//               <div className="flex gap-4">
//                 <button
//                   onClick={() => setShowClaim(false)}
//                   className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleAirdropClaim}
//                   className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-shadow"
//                 >
//                   Confirm Claim
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }


















'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Twitter, Trophy, TrendingUp, Users, Coins, 
  Star, Activity, Target, Gift, Zap, ArrowUpRight,
  CheckCircle, Circle, Calendar, Award, Copy, Check,
  Eye, Heart, MessageCircle, Repeat, UserPlus, Share2,
  ExternalLink, Crown, Medal, Clock, BarChart3, Flame,
  DollarSign, AlertTriangle, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

// Keep your existing DashboardData interface (no changes needed)
export interface DashboardData {
  user: {
    id: string
    walletAddress: string
    totalPoints: number
    rank: number
    level: number
    streak: number
    twitterUsername?: string
    twitterFollowers: number
    twitterActivity: 'HIGH' | 'MEDIUM' | 'LOW'
    referralCode: string
    totalEarnedTokens?: number
    lastLoginReward?: string
  }
  stats: {
    todayPoints: number
    weeklyPoints: number
    totalEngagements: number
    referralCount: number
    tokenAllocation: number
    dailyEarningStatus?: {
      canClaim: boolean
      currentStreak: number
      totalEarned: number
      nextClaimIn: number
    }
  }
  recentActivity: Array<{
    id: string
    action: string
    points: number
    createdAt: string
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    unlocked: boolean
    progress: number
  }>
  referrals: {
    totalReferrals: number
    activeReferrals: number
    totalEarned: number
    recentReferrals: Array<{
      id: string
      walletAddress: string
      twitterUsername?: string
      points: number
      completed: boolean
      createdAt: string
    }>
  }
}

export default function EnhancedDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showClaim, setShowClaim] = useState(false)
  const [copied, setCopied] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [tasks, setTasks] = useState<any>([])
  const [achievements, setAchievements] = useState<any>([])
  const [rewards, setRewards] = useState<any>([])
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch main dashboard data with daily earning status
  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data and daily earning status in parallel
      const [dashboardRes, earningRes] = await Promise.all([
        fetch('/api/user/dashboard'),
        fetch('/api/earning/status').catch(() => null) // Don't fail if this endpoint doesn't exist yet
      ])
      
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        console.log('Dashboard data loaded:', dashboardData)
        
        // Add daily earning status if available
        if (earningRes?.ok) {
          const earningData = await earningRes.json()
          dashboardData.stats.dailyEarningStatus = earningData
        } else {
          // Fallback daily earning status
          dashboardData.stats.dailyEarningStatus = {
            canClaim: true,
            currentStreak: dashboardData.user.streak || 0,
            totalEarned: dashboardData.user.totalEarnedTokens || 0,
            nextClaimIn: 0
          }
        }
        
        setData(dashboardData)
      } else {
        console.error('Failed to fetch dashboard data:', dashboardRes.status)
        // Don't use fallback anymore - show error instead
        throw new Error('Failed to load dashboard')
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch additional data for specific tabs
  const fetchTasksData = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const tasksData = await res.json()
        setTasks(tasksData.tasks || tasksData || [])
      } else {
        // Create default tasks based on user status
        const defaultTasks = [
          { 
            id: 'connect-twitter', 
            title: 'Connect Twitter Account', 
            description: 'Link your Twitter account to start earning points', 
            points: 50, 
            completed: !!data?.user.twitterUsername, 
            type: 'SOCIAL_TWITTER',
            requirements: { action: 'CONNECT' }
          },
          { 
            id: 'connect-wallet', 
            title: 'Connect Wallet', 
            description: 'Connect your Solana wallet to receive rewards', 
            points: 25, 
            completed: !!data?.user.walletAddress, 
            type: 'WALLET_CONNECT',
            requirements: { action: 'CONNECT' }
          },
          { 
            id: 'daily-checkin', 
            title: 'Daily Check-in', 
            description: 'Check in daily to maintain your streak', 
            points: 5, 
            completed: false, 
            type: 'DAILY_CHECK_IN',
            requirements: { action: 'CHECKIN' }
          }
        ]
        setTasks(defaultTasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      setTasks([])
    }
  }

  const fetchAchievementsData = async () => {
    try {
      const res = await fetch('/api/achievements')
      if (res.ok) {
        const achievementsData = await res.json()
        setAchievements(achievementsData.achievements || achievementsData || [])
      } else {
        // Use achievements from main dashboard data as fallback
        if (data?.achievements) {
          setAchievements(data.achievements)
        } else {
          setAchievements([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
      // Use achievements from main dashboard data as fallback
      if (data?.achievements) {
        setAchievements(data.achievements)
      } else {
        setAchievements([])
      }
    }
  }

  const fetchRewardsData = async () => {
    try {
      const res = await fetch('/api/rewards')
      if (res.ok) {
        const rewardsData = await res.json()
        setRewards(rewardsData.rewards || rewardsData || [])
      } else {
        // Create default rewards based on user points
        const userPoints = data?.user.totalPoints || 0
        const defaultRewards = [
          { 
            id: 'bronze-badge', 
            name: 'Bronze Badge', 
            description: 'Reach 100 points', 
            cost: 100, 
            available: userPoints >= 100,
            type: 'BADGE'
          },
          { 
            id: 'silver-badge', 
            name: 'Silver Badge', 
            description: 'Reach 500 points', 
            cost: 500, 
            available: userPoints >= 500,
            type: 'BADGE'
          },
          { 
            id: 'connect-tokens', 
            name: 'CONNECT Tokens', 
            description: 'Exchange points for tokens', 
            cost: 50, 
            available: userPoints >= 50,
            type: 'TOKEN'
          }
        ]
        setRewards(defaultRewards)
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
      setRewards([])
    }
  }

  // Fetch data when switching tabs
  useEffect(() => {
    if (data && activeTab === 'tasks') {
      fetchTasksData()
    } else if (data && activeTab === 'rewards') {
      fetchAchievementsData()
      fetchRewardsData()
    }
  }, [activeTab, data])

  // Utility functions
  const generateReferralLink = () => {
    if (!data?.user.referralCode) return ''
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${baseUrl}?ref=${data.user.referralCode}`
  }

  const copyReferralLink = async () => {
    const link = generateReferralLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Referral link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy referral link')
    }
  }

  const shareReferralLink = async () => {
    const link = generateReferralLink()
    const shareData = {
      title: 'Join the Solana Airdrop Platform',
      text: 'Earn rewards by engaging with our community!',
      url: link
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        copyReferralLink()
      }
    } else {
      copyReferralLink()
    }
  }

  const handleDailyClaim = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/earning/daily-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(`Claimed ${result.tokens || 5} CONNECT tokens! 🎉`)
        
        // Update local state immediately
        if (data) {
          setData(prev => ({
            ...prev!,
            user: {
              ...prev!.user,
              totalEarnedTokens: (prev!.user.totalEarnedTokens || 0) + (result.tokens || 5),
              streak: result.currentStreak || prev!.user.streak
            },
            stats: {
              ...prev!.stats,
              dailyEarningStatus: {
                canClaim: false,
                currentStreak: result.currentStreak || prev!.stats.dailyEarningStatus?.currentStreak || 0,
                totalEarned: (prev!.stats.dailyEarningStatus?.totalEarned || 0) + (result.tokens || 5),
                nextClaimIn: result.nextClaimIn || 24
              }
            }
          }))
        }
        
        // Refresh dashboard data to get updated stats
        setTimeout(fetchDashboardData, 1000)
      } else {
        toast.error(result.error || 'Failed to claim daily reward')
      }
    } catch (error) {
      console.error('Daily claim error:', error)
      toast.error('Failed to claim daily reward')
    } finally {
      setClaiming(false)
    }
  }

  const handleTaskComplete = async (taskId: string, points: number) => {
    try {
      const res = await fetch(`/api/tasks/checkin?taskId=${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(`Task completed! +${result.points || points} points`)
        
        // Update tasks list
        setTasks((prevTasks: any) => 
          prevTasks.map((task: any) => 
            task.id === taskId ? { ...task, completed: true } : task
          )
        )
        
        // Refresh dashboard data
        setTimeout(fetchDashboardData, 1000)
      } else {
        toast.error(result.error || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Task completion error:', error)
      toast.error('Failed to complete task')
    }
  }

  const handleRewardClaim = async (rewardId: string) => {
    try {
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rewardId })
      })

      const result = await res.json()

      if (res.ok) {
        toast.success('Reward claimed successfully!')
        
        // Update rewards list
        setRewards((prevRewards: any) => 
          prevRewards.map((reward: any) => 
            reward.id === rewardId ? { ...reward, claimed: true, available: false } : reward
          )
        )
        
        // Refresh dashboard data
        setTimeout(fetchDashboardData, 1000)
      } else {
        toast.error(result.error || 'Failed to claim reward')
      }
    } catch (error) {
      console.error('Reward claim error:', error)
      toast.error('Failed to claim reward')
    }
  }

  const handleAirdropClaim = async () => {
    try {
      const res = await fetch('/api/airdrop/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(`Successfully claimed ${result.tokens} CONNECT tokens!`)
        setShowClaim(false)
        
        // Refresh dashboard data
        setTimeout(fetchDashboardData, 1000)
      } else {
        toast.error(result.error || 'Failed to claim airdrop')
      }
    } catch (error) {
      console.error('Airdrop claim error:', error)
      toast.error('Failed to claim airdrop')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-white text-xl">Loading Dashboard...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Dashboard</h2>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const formatNextClaim = (hours: number) => {
    if (hours <= 0) return 'Available now!'
    if (hours < 1) return `${Math.ceil(hours * 60)} minutes`
    return `${Math.floor(hours)} hours ${Math.ceil((hours % 1) * 60)} minutes`
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Background Animation */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 opacity-30"
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </motion.div>

      {/* Header */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mt-1">Welcome back, {data.user.twitterUsername || 'User'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">Rank #{data.user.rank}</span>
              </div>
              
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg">
                <Coins className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">{data.user.totalPoints.toLocaleString()} Points</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mb-8 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'earning', label: 'Daily Earning', icon: Coins },
            { id: 'tasks', label: 'Tasks', icon: Target },
            { id: 'rewards', label: 'Rewards', icon: Gift },
            { id: 'referrals', label: 'Referrals', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                console.log(`Switching to ${tab.id} tab`)
                setActiveTab(tab.id)
              }}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Daily Earning Card */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Coins className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Daily Earning</h3>
                          <p className="text-gray-400">Login to earn 5 CONNECT daily</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{data.stats.dailyEarningStatus?.totalEarned || data.user.totalEarnedTokens || 0}</p>
                        <p className="text-gray-400 text-sm">Total Earned</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="w-5 h-5 text-orange-400" />
                          <span className="text-white font-semibold">Current Streak</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-400">{data.stats.dailyEarningStatus?.currentStreak || data.user.streak || 0}</p>
                        <p className="text-gray-400 text-sm">days in a row</p>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-blue-400" />
                          <span className="text-white font-semibold">Next Claim</span>
                        </div>
                        <p className="text-blue-400 font-semibold">
                          {formatNextClaim(data.stats.dailyEarningStatus?.nextClaimIn || 0)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDailyClaim}
                      disabled={!data.stats.dailyEarningStatus?.canClaim || claiming}
                      className={`w-full py-4 rounded-xl font-semibold transition-all ${
                        data.stats.dailyEarningStatus?.canClaim
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {claiming ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Claiming...
                        </div>
                      ) : data.stats.dailyEarningStatus?.canClaim ? (
                        'Claim 5 CONNECT Tokens'
                      ) : (
                        `Available in ${formatNextClaim(data.stats.dailyEarningStatus?.nextClaimIn || 0)}`
                      )}
                    </button>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {data.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex justify-between items-center py-2">
                          <div>
                            <p className="text-white font-medium">{activity.action}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-green-400 font-semibold">+{activity.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-white/5 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Today's Points</span>
                        <span className="text-white font-semibold">{data.stats.todayPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">This Week</span>
                        <span className="text-white font-semibold">{data.stats.weeklyPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Referrals</span>
                        <span className="text-white font-semibold">{data.stats.referralCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Engagements</span>
                        <span className="text-white font-semibold">{data.stats.totalEngagements}</span>
                      </div>
                    </div>
                  </div>

                  {/* Referral Card */}
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Referral Program</h3>
                    <p className="text-gray-300 mb-4">Earn 3 CONNECT tokens for each successful referral!</p>
                    <button
                      onClick={copyReferralLink}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Copied!' : 'Copy Referral Link'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'earning' && (
            <motion.div
              key="earning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Earning Card */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Coins className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Daily Earning</h3>
                        <p className="text-gray-400">Login to earn 5 CONNECT daily</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">{data.stats.dailyEarningStatus?.totalEarned || data.user.totalEarnedTokens || 0}</p>
                      <p className="text-gray-400 text-sm">Total Earned</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-semibold">Next Claim</span>
                      </div>
                      <p className="text-blue-400 font-semibold">
                        {formatNextClaim(data.stats.dailyEarningStatus?.nextClaimIn || 0)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDailyClaim}
                    disabled={!data.stats.dailyEarningStatus?.canClaim || claiming}
                    className={`w-full py-4 rounded-xl font-semibold transition-all ${
                      data.stats.dailyEarningStatus?.canClaim
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {claiming ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Claiming...
                      </div>
                    ) : data.stats.dailyEarningStatus?.canClaim ? (
                      'Claim 5 CONNECT Tokens'
                    ) : (
                      `Available in ${formatNextClaim(data.stats.dailyEarningStatus?.nextClaimIn || 0)}`
                    )}
                  </button>
                </div>
                
                {/* Earning History */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Earning History</h3>
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex justify-between items-center py-2">
                        <div>
                          <p className="text-white font-medium">{activity.action}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-green-400 font-semibold">+{activity.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CONTINUATION POINT: The remaining tabs (tasks, rewards, referrals, analytics) and closing components will be in Part 2 */}
                   {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Tasks Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <Target className="w-8 h-8 text-purple-400" />
                  Tasks & Challenges
                </h2>
                <p className="text-gray-400">Complete tasks to earn points and unlock rewards</p>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <Target className="w-8 h-8 text-blue-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Available Tasks</h4>
                  <p className="text-3xl font-bold text-blue-400">{tasks.length}</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-6">
                  <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Completed</h4>
                  <p className="text-3xl font-bold text-green-400">{tasks.filter((t: any) => t.completed).length}</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-6">
                  <Coins className="w-8 h-8 text-yellow-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Points Available</h4>
                  <p className="text-3xl font-bold text-yellow-400">
                    {tasks.filter((t: any) => !t.completed).reduce((sum: number, t: any) => sum + (t.points || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Available Tasks</h3>
                
                {tasks.length > 0 ? (
                  tasks.map((task: any) => {
                    const getTaskIcon = (type: string) => {
                      const iconMap: Record<string, any> = {
                        'SOCIAL_TWITTER': Twitter,
                        'WALLET_CONNECT': Wallet,
                        'DAILY_CHECK_IN': Calendar,
                        'REFERRAL': Users
                      }
                      return iconMap[type] || Target
                    }
                    
                    const IconComponent = getTaskIcon(task.type)
                    
                    return (
                      <div
                        key={task.id}
                        className="bg-white/5 rounded-xl p-6 border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              task.completed ? 'bg-green-500/20' : 'bg-purple-500/20'
                            }`}>
                              {task.completed ? (
                                <CheckCircle className="w-6 h-6 text-green-400" />
                              ) : (
                                <IconComponent className="w-6 h-6 text-purple-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-white">{task.title}</h4>
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                                  +{task.points} pts
                                </span>
                              </div>
                              <p className="text-gray-400">{task.description}</p>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            {task.completed ? (
                              <div className="px-6 py-2 bg-green-500/20 text-green-300 rounded-lg font-medium">
                                Completed
                              </div>
                            ) : (
                              <button
                                onClick={() => handleTaskComplete(task.id, task.points)}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-400 mb-2">No tasks available</h4>
                    <p className="text-gray-500">Check back later for new tasks!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Rewards Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <Gift className="w-8 h-8 text-purple-400" />
                  Rewards & Achievements
                </h2>
                <p className="text-gray-400">Unlock achievements and claim rewards</p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
                  <Trophy className="w-8 h-8 text-yellow-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Achievements</h4>
                  <p className="text-3xl font-bold text-yellow-400">
                    {achievements.filter((a: any) => a.unlocked).length}/{achievements.length}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
                  <Star className="w-8 h-8 text-blue-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Points Available</h4>
                  <p className="text-3xl font-bold text-blue-400">{data.user.totalPoints}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                  <Award className="w-8 h-8 text-purple-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Current Rank</h4>
                  <p className="text-3xl font-bold text-purple-400">#{data.user.rank}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                  <Coins className="w-8 h-8 text-green-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Token Allocation</h4>
                  <p className="text-3xl font-bold text-green-400">{data.stats.tokenAllocation}</p>
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Trophy className="w-7 h-7 text-yellow-400" />
                  Achievements
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {achievements.length > 0 ? (
                    achievements.map((achievement: any) => (
                      <div
                        key={achievement.id}
                        className={`p-6 rounded-xl border ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`text-4xl ${achievement.unlocked ? 'grayscale-0' : 'grayscale'}`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold mb-2 ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                              {achievement.title}
                            </h4>
                            <p className="text-gray-300 text-sm mb-3">{achievement.description}</p>
                            
                            {achievement.unlocked ? (
                              <div className="flex items-center gap-3">
                                <span className="text-yellow-400 font-semibold">Unlocked!</span>
                              </div>
                            ) : (
                              <div>
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                  <span>Progress</span>
                                  <span>{achievement.progress || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${achievement.progress || 0}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          {achievement.unlocked && (
                            <CheckCircle className="w-6 h-6 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-gray-400 mb-2">No achievements yet</h4>
                      <p className="text-gray-500">Complete tasks to unlock achievements!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Rewards */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Gift className="w-7 h-7 text-purple-400" />
                  Available Rewards
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rewards.length > 0 ? (
                    rewards.map((reward: any) => (
                      <div key={reward.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-white mb-2">{reward.name}</h4>
                          <p className="text-gray-400 text-sm mb-4">{reward.description}</p>
                          <div className="mb-4">
                            <span className="text-2xl font-bold text-purple-400">{reward.cost}</span>
                            <span className="text-gray-400 ml-1">points</span>
                          </div>
                          
                          <button
                            onClick={() => handleRewardClaim(reward.id)}
                            disabled={!reward.available || reward.claimed}
                            className={`w-full py-3 rounded-lg font-medium transition-colors ${
                              reward.available && !reward.claimed
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {reward.claimed ? 'Claimed' : reward.available ? 'Claim Reward' : 'Not Available'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-gray-400 mb-2">No rewards available</h4>
                      <p className="text-gray-500">Check back later for new rewards!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'referrals' && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Enhanced Referrals Tab Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Referral Stats */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-blue-400" />
                    Referral Program
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 text-sm">Total Referrals</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{data.referrals.totalReferrals}</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400 text-sm">Tokens Earned</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">{data.referrals.totalEarned}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm font-medium block mb-2">Your Referral Link</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={generateReferralLink()}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        />
                        <button
                          onClick={copyReferralLink}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={shareReferralLink}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <Gift className="w-4 h-4" />
                        <span className="font-semibold">Referral Rewards</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Earn <span className="text-green-400 font-semibold">3 CONNECT tokens</span> for each successful referral!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Referrals */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Recent Referrals</h3>
                  
                  {data.referrals.recentReferrals.length > 0 ? (
                    <div className="space-y-4">
                      {data.referrals.recentReferrals.map((referral, index) => (
                        <motion.div
                          key={referral.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <UserPlus className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {referral.twitterUsername || `${referral.walletAddress.slice(0, 6)}...${referral.walletAddress.slice(-4)}`}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {referral.completed ? 'Active user' : 'Pending verification'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-semibold">+{referral.points}</div>
                            <div className="text-gray-500 text-sm">
                              {new Date(referral.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-gray-400 mb-2">No referrals yet</h4>
                      <p className="text-gray-500">Start sharing your referral link to earn bonus tokens!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Analytics Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-blue-400" />
                    Analytics Dashboard
                  </h2>
                  <p className="text-gray-400 mt-2">Track your performance and engagement</p>
                </div>
                
                <div className="flex gap-2">
                  {(['7d', '30d', '90d'] as const).map((period) => (
                    <button
                      key={period}
                      className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                    <span className="text-sm px-2 py-1 rounded bg-green-500/20 text-green-400">
                      +12%
                    </span>
                  </div>
                  <h4 className="text-white font-semibold mb-1">Total Points</h4>
                  <p className="text-3xl font-bold text-blue-400">{data.user.totalPoints.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                  <Activity className="w-6 h-6 text-green-400 mb-3" />
                  <h4 className="text-white font-semibold mb-1">Weekly Average</h4>
                  <p className="text-3xl font-bold text-green-400">{Math.round(data.stats.weeklyPoints / 7)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                  <Users className="w-6 h-6 text-purple-400 mb-3" />
                  <h4 className="text-white font-semibold mb-1">Engagements</h4>
                  <p className="text-3xl font-bold text-purple-400">{data.stats.totalEngagements}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
                  <Trophy className="w-6 h-6 text-yellow-400 mb-3" />
                  <h4 className="text-white font-semibold mb-1">Referrals</h4>
                  <p className="text-3xl font-bold text-yellow-400">{data.stats.referralCount}</p>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Points Over Time</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {[
                    data.stats.todayPoints || 45, 
                    78, 92, 65, 134, 87, 156
                  ].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-300 hover:opacity-80"
                        style={{ height: `${Math.max((height / 200) * 200, 10)}px` }}
                      />
                      <span className="text-gray-400 text-xs mt-2">
                        {15 + index}/1
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-400" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {data.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{activity.action}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-green-400 font-semibold">+{activity.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Claim Modal */}
      <AnimatePresence>
        {showClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClaim(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 p-8 rounded-3xl border border-white/10 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Claim Your Tokens</h3>
              <p className="text-gray-400 mb-6">
                You're about to claim {data.stats.tokenAllocation?.toLocaleString() || 0} tokens based on your{' '}
                {data.user.twitterActivity?.toLowerCase()} activity level.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowClaim(false)}
                  className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAirdropClaim}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-shadow"
                >
                  Confirm Claim
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
