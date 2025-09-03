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



'use client'
import React, { useEffect, useState } from 'react';
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
  Coins
} from 'lucide-react';
import { useTwitterAuth } from '@/hooks/twitter-sdk-hook/userNextAuthTwitterAuth';
import { useUserStore } from '@/store/useUserStore';
import { useWalletStore } from '@/store/useWalletStore';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function TwitterIntegration() {
  const { user } = useUserStore();
  const { connected } = useWalletStore();
  const {
    session,
    isTwitterConnected,
    isConnecting,
    error,
    engagement,
    connectTwitter,
    disconnectTwitter,
    refreshTwitterData,
    loadEngagementData
  } = useTwitterAuth();
  
  const [isRefreshing, setIsRefreshing] = useState(false);


  const {data:sessions} = useSession();
  console.log(sessions,"===============================Session============")


  useEffect(()=>{
       if (!session?.user.id) return;
       loadEngagementData();
  },[])

  const handleRefresh = async () => {
    if (!session?.user.id) return;
    setIsRefreshing(true);
    try {
      await refreshTwitterData();
      toast.success('Twitter data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh Twitter data:', error);
      toast.error('Failed to refresh Twitter data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
          <p className="mt-2 text-gray-600">Loading Twitter authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto">
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Connection Status */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Twitter className="w-5 h-5 text-blue-500" />
            Twitter Connection Status
          </CardTitle>
          <CardDescription>
            Connect your Twitter account to earn tokens for engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isTwitterConnected ? (
            <div className="text-center py-10">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Twitter className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Your Twitter Account</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Link your Twitter to start earning tokens for likes, retweets, comments, and more!
              </p>
              <Button 
                onClick={connectTwitter} 
                disabled={isConnecting || !connected}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Twitter className="w-4 h-4 mr-2" />
                    {connected ? 'Connect Twitter' : 'Connect Wallet First'}
                  </>
                )}
              </Button>
              {!connected && (
                <p className="mt-3 text-sm text-gray-500">Please connect your wallet first</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info and actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {session?.user.twitterImage && (
                    <img 
                      src={session.user.twitterImage} 
                      alt={session.user.twitterName || session.user.twitterUsername} 
                      className="w-12 h-12 rounded-full border border-gray-200"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{session?.user.twitterName}</h3>
                    <p className="text-gray-600">@{session?.user.twitterUsername}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {session?.user.twitterFollowers?.toLocaleString() || 0} followers
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline" 
                    size="sm" 
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    onClick={disconnectTwitter} 
                    variant="destructive" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
              
              {/* Engagement Stats */}
              {engagement ? (
                <Tabs  className="w-full" value={''} onValueChange={()=>undefined}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">{engagement.totalEngagements}</div>
                        <div className="text-sm text-blue-700">Total Engagements</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{engagement.todayEngagements}</div>
                        <div className="text-sm text-green-700">Today</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-purple-600">{engagement.weeklyEngagements}</div>
                        <div className="text-sm text-purple-700">This Week</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="text-2xl font-bold text-orange-600">{engagement.monthlyEngagements}</div>
                        <div className="text-sm text-orange-700">This Month</div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="breakdown" className="mt-4">
                    <div className="space-y-3">
                      {engagement.breakdown.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            {item.type === 'LIKE' && <Heart className="w-5 h-5 text-red-500" />}
                            {item.type === 'RETWEET' && <Repeat className="w-5 h-5 text-green-500" />}
                            {item.type === 'COMMENT' && <MessageCircle className="w-5 h-5 text-blue-500" />}
                            {item.type === 'FOLLOW' && <UserPlus className="w-5 h-5 text-indigo-500" />}
                            <div>
                              <div className="font-medium capitalize">{item.type.toLowerCase()}s</div>
                              <div className="text-sm text-gray-600">{item.count} engagements</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-yellow-600 flex items-center gap-1">
                              <Coins className="w-4 h-4" />
                              {item.tokens.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Engagement Data</h3>
                  <p className="text-gray-500 mb-4">Your engagement statistics will appear here once available</p>
                  <Button 
                    onClick={loadEngagementData} 
                    variant="outline"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Load Data
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}