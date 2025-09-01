// components/TwitterIntegration.tsx
'use client'
import React, { useState, useEffect } from 'react';
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
import { useEnhancedTwitterAuth } from '@/hooks/twitter-sdk-hook/useEnhancedTwitterAuth';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import { useTwitterAuth } from '@/hooks/twitter-sdk-hook/userNextAuthTwitterAuth';
import { error } from 'console';

export default function TwitterIntegrationDefaultComponent() {
  const { user } = useUserStore();
  // const {
  //   isTwitterConnected,
  //   isConnecting,
  //   error,
  //   connectTwitter,
  //   disconnectTwitter,
  // } = useEnhancedTwitterAuth();

    const {
    session,
    isTwitterConnected,
    isConnecting,
    error,
    engagement,
    connectTwitter,
    disconnectTwitter,
  } = useTwitterAuth();
  
  const [engagementData, setEngagementData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id && isTwitterConnected) {
      loadEngagementData();
    }
  }, [user?.id, isTwitterConnected]);

  const loadEngagementData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/twitter/engagement-stats/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setEngagementData(data.stats);
      }
    } catch (error) {
      console.error('Failed to load engagement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTwitterData = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/twitter/refresh-data/${user.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        const { user: updatedUser } = await response.json();
        // Update user in store if needed
        toast.success('Twitter data refreshed successfully');
        await loadEngagementData();
      }
    } catch (error) {
      console.error('Failed to refresh Twitter data:', error);
      toast.error('Failed to refresh Twitter data');
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-blue-500" />
            Twitter Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isTwitterConnected ? (
            <div className="text-center py-8">
              <Twitter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Twitter Account</h3>
              <p className="text-gray-600 mb-6">
                Link your Twitter to start earning tokens for likes, retweets, comments, and more!
              </p>
              <Button 
                onClick={connectTwitter} 
                disabled={isConnecting}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Twitter className="w-4 h-4 mr-2" />
                    Connect Twitter
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Info and actions */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {/* {user.twitterImage && (
                    <img 
                      src={user.twitterImage} 
                      alt={user.twitterName || user.twitterUsername} 
                      className="w-12 h-12 rounded-full"
                    />
                  )} */}
                  <div>
                    {/* <h3 className="font-semibold">{user.twitterName}</h3> */}
                    <p className="text-gray-600">@{user?.twitterUsername}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {user?.twitterFollowers?.toLocaleString() || 0} followers
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button onClick={refreshTwitterData} variant="outline" size="sm" disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={disconnectTwitter} variant="destructive" size="sm">
                    <XCircle className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {/* Engagement Stats */}
              {engagementData && (
                <Tabs value={''} onValueChange={()=>undefined}  >
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{engagementData.totalEngagements}</div>
                        <div className="text-sm text-blue-700">Total Engagements</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{engagementData.todayEngagements}</div>
                        <div className="text-sm text-green-700">Today</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{engagementData.weeklyEngagements}</div>
                        <div className="text-sm text-purple-700">This Week</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{engagementData.monthlyEngagements}</div>
                        <div className="text-sm text-orange-700">This Month</div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="breakdown">
                    <div className="space-y-3">
                      {engagementData.breakdown.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {item.type === 'LIKE' && <Heart className="w-4 h-4 text-red-500" />}
                            {item.type === 'RETWEET' && <Repeat className="w-4 h-4 text-green-500" />}
                            {item.type === 'COMMENT' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                            {item.type === 'FOLLOW' && <UserPlus className="w-4 h-4 text-indigo-500" />}
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}