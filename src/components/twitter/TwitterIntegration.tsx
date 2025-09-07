// 'use client'
// import React, { useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { 
//   Twitter, 
//   Users, 
//   Activity, 
//   Award, 
//   RefreshCw, 
//   XCircle,
//   Heart,
//   Repeat,
//   MessageCircle,
//   UserPlus,
//   Coins
// } from 'lucide-react';
// import { useTwitterAuth } from '@/hooks/twitter-sdk-hook/userNextAuthTwitterAuth';
// import { useUserStore } from '@/store/useUserStore';
// import { toast } from 'sonner';

// export default function TwitterIntegrationDefaultComponent() {
//   const { user } = useUserStore();
//   const {
//     session,
//     isTwitterConnected,
//     isConnecting,
//     error,
//     engagement,
//     connectTwitter,
//     disconnectTwitter,
//     refreshTwitterData,
//     loadEngagementData
//   } = useTwitterAuth();
  
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   console.log(session,"===============================Session============")

//   const handleRefresh = async () => {
//     if (!session?.user.id) return;

//     setIsRefreshing(true);
//     try {
//       await refreshTwitterData();
//       toast.success('Twitter data refreshed successfully');
//     } catch (error) {
//       console.error('Failed to refresh Twitter data:', error);
//       toast.error('Failed to refresh Twitter data');
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   if (error) {
//     return (
//       <Alert variant="destructive" className="max-w-4xl mx-auto">
//         <AlertTitle>Authentication Error</AlertTitle>
//         <AlertDescription>{error}</AlertDescription>
//       </Alert>
//     );
//   }

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto p-6">
//       {/* Connection Status */}
//       <Card className="border border-gray-200 shadow-sm">
//         <CardHeader className="pb-4">
//           <CardTitle className="flex items-center gap-2 text-xl">
//             <Twitter className="w-5 h-5 text-blue-500" />
//             Twitter Connection Status
//           </CardTitle>
//           <CardDescription>
//             Connect your Twitter account to earn tokens for engagement
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {!isTwitterConnected ? (
//             <div className="text-center py-10">
//               <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
//                 <Twitter className="w-8 h-8 text-blue-400" />
//               </div>
//               <h3 className="text-lg font-semibold mb-2">Connect Your Twitter Account</h3>
//               <p className="text-gray-600 mb-6 max-w-md mx-auto">
//                 Link your Twitter to start earning tokens for likes, retweets, comments, and more!
//               </p>
//               <Button 
//                 onClick={connectTwitter} 
//                 disabled={isConnecting}
//                 size="lg"
//                 className="bg-blue-500 hover:bg-blue-600 transition-colors"
//               >
//                 {isConnecting ? (
//                   <>
//                     <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
//                     Connecting...
//                   </>
//                 ) : (
//                   <>
//                     <Twitter className="w-4 h-4 mr-2" />
//                     Connect Twitter
//                   </>
//                 )}
//               </Button>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {/* User Info and actions */}
//               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
//                 <div className="flex items-center gap-4">
//                   {session?.user.twitterImage && (
//                     <img 
//                       src={session.user.twitterImage} 
//                       alt={session.user.twitterName || session.user.twitterUsername} 
//                       className="w-12 h-12 rounded-full border border-gray-200"
//                     />
//                   )}
//                   <div>
//                     <h3 className="font-semibold">{session?.user.twitterName}</h3>
//                     <p className="text-gray-600">@{session?.user.twitterUsername}</p>
//                     <div className="flex items-center gap-2 mt-1">
//                       <Users className="w-4 h-4 text-gray-500" />
//                       <span className="text-sm text-gray-600">
//                         {session?.user.twitterFollowers?.toLocaleString() || 0} followers
//                       </span>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center gap-2">
//                   <Button 
//                     onClick={handleRefresh} 
//                     variant="outline" 
//                     size="sm" 
//                     disabled={isRefreshing}
//                     className="flex items-center gap-2"
//                   >
//                     <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
//                     Refresh
//                   </Button>
//                   <Button 
//                     onClick={disconnectTwitter} 
//                     variant="destructive" 
//                     size="sm"
//                     className="flex items-center gap-2"
//                   >
//                     <XCircle className="w-4 h-4" />
//                     Disconnect
//                   </Button>
//                 </div>
//               </div>
              
//               {/* Engagement Stats */}
//               {engagement && (
//                 <Tabs  className="w-full" value={''} onValueChange={()=>undefined }>
//                   <TabsList className="grid w-full grid-cols-2">
//                     <TabsTrigger value="overview">Overview</TabsTrigger>
//                     <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
//                   </TabsList>
                  
//                   <TabsContent value="overview" className="mt-4">
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
//                         <div className="text-2xl font-bold text-blue-600">{engagement.totalEngagements}</div>
//                         <div className="text-sm text-blue-700">Total Engagements</div>
//                       </div>
//                       <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
//                         <div className="text-2xl font-bold text-green-600">{engagement.todayEngagements}</div>
//                         <div className="text-sm text-green-700">Today</div>
//                       </div>
//                       <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
//                         <div className="text-2xl font-bold text-purple-600">{engagement.weeklyEngagements}</div>
//                         <div className="text-sm text-purple-700">This Week</div>
//                       </div>
//                       <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
//                         <div className="text-2xl font-bold text-orange-600">{engagement.monthlyEngagements}</div>
//                         <div className="text-sm text-orange-700">This Month</div>
//                       </div>
//                     </div>
//                   </TabsContent>
                  
//                   <TabsContent value="breakdown" className="mt-4">
//                     <div className="space-y-3">
//                       {engagement.breakdown.map((item: any, index: number) => (
//                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
//                           <div className="flex items-center gap-3">
//                             {item.type === 'LIKE' && <Heart className="w-5 h-5 text-red-500" />}
//                             {item.type === 'RETWEET' && <Repeat className="w-5 h-5 text-green-500" />}
//                             {item.type === 'COMMENT' && <MessageCircle className="w-5 h-5 text-blue-500" />}
//                             {item.type === 'FOLLOW' && <UserPlus className="w-5 h-5 text-indigo-500" />}
//                             <div>
//                               <div className="font-medium capitalize">{item.type.toLowerCase()}s</div>
//                               <div className="text-sm text-gray-600">{item.count} engagements</div>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <div className="font-bold text-yellow-600 flex items-center gap-1">
//                               <Coins className="w-4 h-4" />
//                               {item.tokens.toFixed(2)}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </TabsContent>
//                 </Tabs>
//               )}
              
//               {!engagement && (
//                 <div className="text-center py-8">
//                   <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-1">No Engagement Data</h3>
//                   <p className="text-gray-500 mb-4">Your engagement statistics will appear here once available</p>
//                   <Button 
//                     onClick={loadEngagementData} 
//                     variant="outline"
//                     className="flex items-center gap-2 mx-auto"
//                   >
//                     <RefreshCw className="w-4 h-4" />
//                     Load Data
//                   </Button>
//                 </div>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }



// 'use client'
// import React, { useEffect, useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { 
//   Twitter, 
//   Users, 
//   Activity, 
//   Award, 
//   RefreshCw, 
//   XCircle,
//   Heart,
//   Repeat,
//   MessageCircle,
//   UserPlus,
//   Coins
// } from 'lucide-react';
// import { useTwitterAuth } from '@/hooks/twitter-sdk-hook/userNextAuthTwitterAuth';
// import { useUserStore } from '@/store/useUserStore';
// import { useWalletStore } from '@/store/useWalletStore';
// import { toast } from 'sonner';
// import { useSession } from 'next-auth/react';

// import { getCookie } from 'cookies-next'
// import { DashboardData } from '@/app/dashboard/page';

// export default function TwitterIntegration() {
//   const {data:session, status} = useSession();
//   const { user } = useUserStore();
//   const { connected , publicKey } = useWalletStore();
//   const [data, setData] = useState<DashboardData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const {
//     isTwitterConnected,
//     isConnecting,
//     error,
//     engagement,
//     connectTwitter,
//     disconnectTwitter,
//     refreshTwitterData,
//     loadEngagementData,
//     // mergeAccounts
//   } = useTwitterAuth();
  
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const walletAddress = getCookie("publicKey")

//     useEffect(()=>{
//     if (session?.user) return;
//       //  mergeAccounts(sessions?.user?.id as string, walletAddress as string);
//       console.log(isTwitterConnected, "===========connection state========")
//        loadEngagementData();
//        fetchDashboardData()
//   },[session])


//     async function  fetchDashboardData() {
//       try {
//         // Fetch dashboard data and daily earning status in parallel
//         const [dashboardRes, earningRes] = await Promise.all([
//           fetch('/api/user/dashboard'),
//           fetch('/api/earning/status').catch(() => null) // Don't fail if this endpoint doesn't exist yet
//         ])
        
//         if (dashboardRes.ok) {
//           const dashboardData = await dashboardRes.json()
//           console.log('Dashboard data loaded:', dashboardData)
          
//           // Add daily earning status if available
//           if (earningRes?.ok) {
//             const earningData = await earningRes.json()
//             dashboardData.stats.dailyEarningStatus = earningData
//           } else {
//             // Fallback daily earning status
//             dashboardData.stats.dailyEarningStatus = {
//               canClaim: true,
//               currentStreak: dashboardData.user.streak || 0,
//               totalEarned: dashboardData.user.totalEarnedTokens || 0,
//               nextClaimIn: 0
//             }
//           }
          
//           setData(dashboardData)
//         } else {
//           console.log('Failed to fetch dashboard data:', dashboardRes.status)
//           // Don't use fallback anymore - show error instead
//           // throw new Error('Failed to load dashboard')
//         }
//       } catch (error) {
//         console.error('Failed to load dashboard:', error)
//         toast.error('Failed to load dashboard data')
//       } finally {
//         setLoading(false)
//       }
//     }
  

// console.log(data,'================data============  ')

//   const handleRefresh = async () => {
//     if (!session?.user.id) return;
//     setIsRefreshing(true);
//     try {
//       await refreshTwitterData();
//       toast.success('Twitter data refreshed successfully');
//     } catch (error) {
//       console.error('Failed to refresh Twitter data:', error);
//       toast.error('Failed to refresh Twitter data');
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   if (isConnecting) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="text-center">
//           <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
//           <p className="mt-2 text-gray-600">Loading Twitter authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <Alert variant="destructive" className="max-w-4xl mx-auto">
//         <AlertTitle>Authentication Error</AlertTitle>
//         <AlertDescription>{error}</AlertDescription>
//       </Alert>
//     );
//   }

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto p-6">
//       {/* Connection Status */}
//       <Card className="border border-gray-200 shadow-sm">
//         <CardHeader className="pb-4">
//           <CardTitle className="flex items-center gap-2 text-xl">
//             <Twitter className="w-5 h-5 text-blue-500" />
//             Twitter Connection Status
//           </CardTitle>
//           <CardDescription>
//             Connect your Twitter account to earn tokens for engagement
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {!session?.user ? (
//             <div className="text-center py-10">
//               <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
//                 <Twitter className="w-8 h-8 text-blue-400" />
//               </div>
//               <h3 className="text-lg font-semibold mb-2">Connect Your Twitter Account</h3>
//               <p className="text-gray-600 mb-6 max-w-md mx-auto">
//                 Link your Twitter to start earning tokens for likes, retweets, comments, and more!
//               </p>
//               <Button 
//                 onClick={() => connectTwitter()} 
//                 disabled={isConnecting || status == 'loading' || status == 'authenticated'}
//                 size="lg"
//                 className="bg-blue-500 hover:bg-blue-600 transition-colors"
//               >
//                 {isConnecting ? (
//                   <>
//                     <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
//                     Connecting...
//                   </>
//                 ) : (
//                   <>
//                     <Twitter className="w-4 h-4 mr-2" />
//                     {session?.user ? 'Connect Wallet' : 'Connect Twitter First'}
//                   </>
//                 )}
//               </Button>
//               {!session?.user && (
//                 <p className="mt-3 text-sm text-gray-500">Please connect your Twitter</p>
//               )}
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {/* User Info and actions */}
//               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
//                 <div className="flex items-center gap-4">
//                   {session?.user.twitterImage && (
//                     <img 
//                       src={session.user.twitterImage} 
//                       alt={session.user.twitterName || session.user.twitterUsername} 
//                       className="w-12 h-12 rounded-full border border-gray-200"
//                     />
//                   )}
//                   <div>
//                     <h3 className="font-semibold">{session?.user?.twitterName}</h3>
//                     <p className="text-gray-600">@{session?.user?.twitterUsername}</p>
//                     <div className="flex items-center gap-2 mt-1">
//                       <Users className="w-4 h-4 text-gray-500" />
//                       <span className="text-sm text-gray-600">
//                         {session?.user.twitterFollowers?.toLocaleString() || 0} followers
//                       </span>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center gap-2">
//                   <Button 
//                     onClick={handleRefresh} 
//                     variant="outline" 
//                     size="sm" 
//                     disabled={isRefreshing}
//                     className="flex items-center gap-2"
//                   >
//                     <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
//                     Refresh
//                   </Button>
//                   <Button 
//                     onClick={disconnectTwitter} 
//                     variant="destructive" 
//                     size="sm"
//                     className="flex items-center gap-2"
//                   >
//                     <XCircle className="w-4 h-4" />
//                     Disconnect
//                   </Button>
//                 </div>
//               </div>
              
//               {/* Engagement Stats */}
//               {session?.user ? (
//                 <Tabs  className="w-full" value={''} onValueChange={()=>undefined}>
//                   <TabsList className="grid w-full grid-cols-2">
//                     <TabsTrigger value="overview">Overview</TabsTrigger>
//                     <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
//                   </TabsList>
                  
//                   <TabsContent value="overview" className="mt-4">
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
//                         <div className="text-2xl font-bold text-blue-600">{engagement?.totalEngagements}</div>
//                         <div className="text-sm text-blue-700">Total Engagements</div>
//                       </div>
//                       <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
//                         <div className="text-2xl font-bold text-green-600">{engagement?.todayEngagements}</div>
//                         <div className="text-sm text-green-700">Today</div>
//                       </div>
//                       <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
//                         <div className="text-2xl font-bold text-purple-600">{engagement?.weeklyEngagements}</div>
//                         <div className="text-sm text-purple-700">This Week</div>
//                       </div>
//                       <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
//                         <div className="text-2xl font-bold text-orange-600">{engagement?.monthlyEngagements}</div>
//                         <div className="text-sm text-orange-700">This Month</div>
//                       </div>
//                     </div>
//                   </TabsContent>
                  
//                   <TabsContent value="breakdown" className="mt-4">
//                     <div className="space-y-3">
//                       {engagement?.breakdown?.map((item: any, index: number) => (
//                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
//                           <div className="flex items-center gap-3">
//                             {item.type === 'LIKE' && <Heart className="w-5 h-5 text-red-500" />}
//                             {item.type === 'RETWEET' && <Repeat className="w-5 h-5 text-green-500" />}
//                             {item.type === 'COMMENT' && <MessageCircle className="w-5 h-5 text-blue-500" />}
//                             {item.type === 'FOLLOW' && <UserPlus className="w-5 h-5 text-indigo-500" />}
//                             <div>
//                               <div className="font-medium capitalize">{item.type.toLowerCase()}s</div>
//                               <div className="text-sm text-gray-600">{item.count} engagements</div>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <div className="font-bold text-yellow-600 flex items-center gap-1">
//                               <Coins className="w-4 h-4" />
//                               {item.tokens.toFixed(2)}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </TabsContent>
//                 </Tabs>
//               ) : (
//                 <div className="text-center py-8">
//                   <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-1">No Engagement Data</h3>
//                   <p className="text-gray-500 mb-4">Your engagement statistics will appear here once available</p>
//                   <Button 
//                     onClick={loadEngagementData} 
//                     variant="outline"
//                     className="flex items-center gap-2 mx-auto"
//                   >
//                     <RefreshCw className="w-4 h-4" />
//                     Load Data
//                   </Button>
//                 </div>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

'use client'
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Twitter, 
  Users, 
  Activity, 
  Award, 
  RefreshCw, 
  XCircle,
  Heart,
  Repeat,
  MessageCircle,
  UserPlus,
  Coins,
  Zap,
  TrendingUp,
  Gift
} from 'lucide-react';
import { useTwitterAuth } from '@/hooks/twitter-sdk-hook/userNextAuthTwitterAuth';
import { useUserStore } from '@/store/useUserStore';
import { useWalletStore } from '@/store/useWalletStore';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { getCookie } from 'cookies-next'
import { DashboardData } from '@/app/dashboard/page';
import { motion, AnimatePresence } from 'framer-motion';

// Animated counter component
const AnimatedCounter = ({ value, duration = 1.5 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);
  }, [value, duration]);
  
  return <span>{count}</span>;
};

// Crypto-themed gradient card
const CryptoCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`bg-gradient-to-br from-gray-900 to-black border border-purple-900/50 rounded-xl shadow-lg shadow-purple-900/20 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

// Token display component
const TokenDisplay = ({ amount, size = "text-2xl" }: { amount: number; size?: string }) => (
  <div className={`flex items-center justify-center gap-2 font-bold ${size} text-yellow-400`}>
    <motion.div
      animate={{ rotate: [0, 10, 0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
    >
      <Coins className="w-6 h-6" />
    </motion.div>
    <span>{amount.toFixed(2)}</span>
  </div>
);

export default function TwitterIntegration() {
  const {data:session, status} = useSession();
  const { user } = useUserStore();
  const { connected , publicKey } = useWalletStore();
  const [data, setData] = useState<DashboardData | null | any>(null)
  const [loading, setLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  
  const {
    isTwitterConnected,
    isConnecting,
    error,
    connectTwitter,
    disconnectTwitter,
    refreshTwitterData,
  } = useTwitterAuth();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const walletAddress = getCookie("publicKey")
  
  // Only fetch data when session changes, not on every render
  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

    useEffect(() => {
    startMonitoring()
    const interval = setInterval(startMonitoring, 30000)
    return () => clearInterval(interval)
  }, [])

useEffect(() => {
   if(!session?.user.id) return;
    fetchDashboardData()
    startMonitoring()
    const interval = setInterval(()=>{
      fetchDashboardData()
      startMonitoring()
    }, 30000)
    return () => clearInterval(interval)
  }, [session?.user])
  
  // Fetch dashboard data only when session is available
  async function fetchDashboardData() {
    setIsDataLoading(true);
    try {
      const [dashboardRes, earningRes] = await Promise.all([
        fetch('/api/user/dashboard'),
        fetch('/api/earning/status').catch(() => null)
      ])
      
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        
        if (earningRes?.ok) {
          const earningData = await earningRes.json()
          dashboardData.stats.dailyEarningStatus = earningData
        } else {
          dashboardData.stats.dailyEarningStatus = {
            canClaim: true,
            currentStreak: dashboardData.user.streak || 0,
            totalEarned: dashboardData.user.totalEarnedTokens || 0,
            nextClaimIn: 0
          }
        }
        
        setData(dashboardData)
      } else {
        throw new Error('Failed to load dashboard')
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsDataLoading(false);
      setLoading(false);
    }
  };
  
  // Function to refresh Twitter data
  const handleRefresh = async () => {
    if (!session?.user.id) return;
    setIsRefreshing(true);
    try {
      await refreshTwitterData();
      await fetchDashboardData(); // Refresh dashboard data after Twitter data refresh
      toast.success('Twitter data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh Twitter data:', error);
      toast.error('Failed to refresh Twitter data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to start monitoring
  async function startMonitoring (){
    setIsMonitoring(true);
    try {
      const response = await fetch('/api/twitter/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Monitoring completed! Tracked ${result.engagementsTracked} activities and awarded ${result.tokensAwarded.toFixed(2)} tokens`);
        fetchDashboardData(); // Refresh dashboard data
      } else {
        throw new Error('Failed to monitor Twitter activities');
      }
    } catch (error) {
      console.error('Error monitoring Twitter:', error);
      toast.error('Failed to monitor Twitter activities');
    } finally {
      setIsMonitoring(false);
    }
  };
  
  // Show loading only during initial load
  if (loading && status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-12 h-12 mx-auto text-purple-500" />
          </motion.div>
          <p className="mt-4 text-gray-400">Loading Twitter data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto bg-red-900/20 border-red-800/50 text-red-200">
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Twitter engagement data from the API
  const twitterEngagement = data?.twitterEngagement as any;
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 mb-2">
          Twitter Airdrop Rewards
        </h1>
        <p className="text-gray-400">Connect your Twitter to earn tokens for engagement</p>
      </motion.div>
      
      {/* Connection Status */}
      <CryptoCard>
        <CardHeader className="pb-4 border-b border-gray-800">
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Twitter className="w-5 h-5 text-blue-400" />
            </div>
            Twitter Connection Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connect your Twitter account to earn tokens for engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {(!twitterEngagement)? (
            <div className="text-center py-10">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20"
              >
                <Twitter className="w-10 h-10 text-blue-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3">Connect Your Twitter Account</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Link your Twitter to start earning tokens for likes, retweets, comments, and more!
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => connectTwitter()} 
                  disabled={isConnecting || status == 'loading' || status == 'authenticated'}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/20"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Twitter className="w-5 h-5 mr-2" />
                      Connect Twitter
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info and actions */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-800/50 rounded-xl border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  {data.user.twitterImage && (
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      src={data.user.twitterImage} 
                      alt={data.user.twitterName || data.user.twitterUsername} 
                      className="w-14 h-14 rounded-full border-2 border-purple-500/30"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-white text-lg">{data.user.twitterName}</h3>
                    <p className="text-gray-400">@{data.user.twitterUsername}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">
                        {data.user.twitterFollowers?.toLocaleString() || 0} followers
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handleRefresh} 
                      variant="outline" 
                      size="sm" 
                      disabled={isRefreshing || isDataLoading}
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing || isDataLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={disconnectTwitter} 
                      variant="destructive" 
                      size="sm"
                      className="bg-red-900/30 border-red-800/50 text-red-300 hover:bg-red-800/50 hover:text-red-200 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Disconnect
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Engagement Stats */}
              {isDataLoading ? (
                <div className="flex justify-center items-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-10 h-10 text-purple-500" />
                  </motion.div>
                  <p className="mt-4 text-gray-400 ml-4">Loading engagement data...</p>
                </div>
              ) : twitterEngagement ? (
                <Tabs className="w-full" value={''} onValueChange={()=>undefined}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800 p-1 rounded-lg mb-6">
                    <TabsTrigger 
                      value="overview" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-md py-2"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="breakdown" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-md py-2"
                    >
                      Breakdown
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="text-center p-5 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl border border-blue-700/30"
                      >
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                          <AnimatedCounter value={twitterEngagement.totalEngagements} />
                        </div>
                        <div className="text-sm text-blue-300 flex items-center justify-center gap-1">
                          <Activity className="w-4 h-4" />
                          Total Engagements
                        </div>
                      </motion.div>
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="text-center p-5 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl border border-green-700/30"
                      >
                        <div className="text-2xl font-bold text-green-400 mb-1">
                          <AnimatedCounter value={twitterEngagement.todayEngagements} />
                        </div>
                        <div className="text-sm text-green-300 flex items-center justify-center gap-1">
                          <Zap className="w-4 h-4" />
                          Today
                        </div>
                      </motion.div>
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="text-center p-5 bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl border border-purple-700/30"
                      >
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          <AnimatedCounter value={twitterEngagement.weeklyEngagements} />
                        </div>
                        <div className="text-sm text-purple-300 flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          This Week
                        </div>
                      </motion.div>
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="text-center p-5 bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-xl border border-orange-700/30"
                      >
                        <div className="text-2xl font-bold text-orange-400 mb-1">
                          <AnimatedCounter value={twitterEngagement.monthlyEngagements} />
                        </div>
                        <div className="text-sm text-orange-300 flex items-center justify-center gap-1">
                          <Gift className="w-4 h-4" />
                          This Month
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-xl border border-yellow-700/30"
                      >
                        <div className="text-3xl font-bold text-yellow-400 mb-2">
                          <TokenDisplay amount={twitterEngagement.totalTokens} size="text-3xl" />
                        </div>
                        <div className="text-sm text-yellow-300 flex items-center justify-center gap-1">
                          <Award className="w-5 h-5" />
                          Total Tokens Earned
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-indigo-900/30 to-indigo-800/20 rounded-xl border border-indigo-700/30"
                      >
                        <div className="text-3xl font-bold text-indigo-400 mb-2 flex items-center justify-center gap-2">
                          <Users className="w-6 h-6" />
                          <AnimatedCounter value={twitterEngagement.twitterFollowers?.toLocaleString() || 0} />
                        </div>
                        <div className="text-sm text-indigo-300 flex items-center justify-center gap-1">
                          <UserPlus className="w-5 h-5" />
                          Twitter Followers
                        </div>
                      </motion.div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="breakdown" className="mt-4">
                    <div className="space-y-4">
                      {twitterEngagement.breakdown && twitterEngagement.breakdown.length > 0 ? (
                        twitterEngagement.breakdown.map((item: { type: string; count: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; tokens: number; }, index: React.Key | null | undefined) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Number(index) * 0.1 }}
                            whileHover={{ y: -3 }}
                            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${
                                item.type === 'LIKE' ? 'bg-red-500/10 text-red-400' : 
                                item.type === 'RETWEET' ? 'bg-green-500/10 text-green-400' : 
                                item.type === 'COMMENT' ? 'bg-blue-500/10 text-blue-400' : 
                                item.type === 'FOLLOW' ? 'bg-indigo-500/10 text-indigo-400' : 
                                'bg-purple-500/10 text-purple-400'
                              }`}>
                                {item.type === 'LIKE' && <Heart className="w-5 h-5" />}
                                {item.type === 'RETWEET' && <Repeat className="w-5 h-5" />}
                                {item.type === 'COMMENT' && <MessageCircle className="w-5 h-5" />}
                                {item.type === 'FOLLOW' && <UserPlus className="w-5 h-5" />}
                                {item.type === 'QUOTE' && <MessageCircle className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="font-medium text-white capitalize">{item.type.toLowerCase()}s</div>
                                <div className="text-sm text-gray-400">{item.count} engagements</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-yellow-400 flex items-center gap-1">
                                <Coins className="w-4 h-4" />
                                {item.tokens.toFixed(2)}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Activity className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                          </motion.div>
                          <h3 className="text-xl font-medium text-white mb-2">No Engagement Data</h3>
                          <p className="text-gray-500 mb-6">Your engagement statistics will appear here once available</p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              onClick={fetchDashboardData} 
                              variant="outline"
                              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 mx-auto"
                              disabled={isDataLoading}
                            >
                              <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin' : ''}`} />
                              Load Data
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Activity className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-medium text-white mb-2">No Engagement Data</h3>
                  <p className="text-gray-500 mb-6">Your engagement statistics will appear here once available</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={fetchDashboardData} 
                      variant="outline"
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 mx-auto"
                      disabled={isDataLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin' : ''}`} />
                      Load Data
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </CryptoCard>
    </div>
  );
}