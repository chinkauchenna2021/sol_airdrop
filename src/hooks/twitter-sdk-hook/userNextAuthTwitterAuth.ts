// // hooks/useTwitterAuth.ts
// 'use client'
// import { useState, useEffect, useCallback } from 'react';
// import { useSession, signIn, signOut } from 'next-auth/react';
// import { useUserStore } from '@/store/useUserStore';
// import { useWalletStore } from '@/store/useWalletStore';
// import { toast } from 'sonner';

// export function useTwitterAuth() {
//   const { data: session, status } = useSession();
//   const { user, setUser } = useUserStore();
//   const { connected, publicKey } = useWalletStore();


//   console.log(connected, publicKey, "===============PublicKey=================")
  
//   const [isSyncing, setIsSyncing] = useState(false);
//   const [engagementData, setEngagementData] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const connectTwitter = useCallback(async () => {
//     if (!connected || !publicKey) {
//       toast.error('Please connect your wallet first');
//       return false;
//     }

//     try {
//       await signIn('twitter', {
//         callbackUrl: `${window.location.origin}/?twitter_connected=true`,
//       });
//       syncUserWithWallet();
//       return true;
//     } catch (error) {
//       console.error('Twitter connection error:', error);
//       toast.error('Failed to connect Twitter');
//       return false;
//     }
//   }, [connected, publicKey]);

//   const disconnectTwitter = useCallback(async () => {
//     try {
//       await signOut({ callbackUrl: `${window.location.origin}/dashboard` });
//       toast.success('Twitter disconnected successfully');
//     } catch (error) {
//       console.error('Twitter disconnect error:', error);
//       toast.error('Failed to disconnect Twitter');
//     }
//   }, []);

//   const syncUserWithWallet = useCallback(async () => {
//     if (!session?.user?.id || !publicKey || isSyncing) return;
    
//     setIsSyncing(true);
//     setError(null);

//     try {
//       const response = await fetch('/api/auth/sync-wallet', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           userId: session.user.id,
//           walletAddress: publicKey,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Sync failed');
//       }

//       const { user: syncedUser } = await response.json();
//       setUser(syncedUser);
//       toast.success('Wallet connected successfully');

//     } catch (error) {
//       console.error('Wallet sync error:', error);
//       setError('Failed to sync wallet');
//     } finally {
//       setIsSyncing(false);
//     }
//   }, [session, publicKey, isSyncing]);

//   const mergeAccounts = useCallback(async (sourceUserId: string, targetUserId: string) => {
                             

//   },[]);

//   const loadEngagementData = useCallback(async () => {
//     if (!session?.user?.id) return;

//     try {
//       const response = await fetch('/api/twitter/engagement-stats');
//       if (response.ok) {
//         const data = await response.json();
//         setEngagementData(data.stats);
//       }
//     } catch (error) {
//       console.error('Failed to load engagement data:', error);
//     }
//   }, [session]);

//   const refreshTwitterData = useCallback(async () => {
//     if (!session?.user?.id) return;

//     try {
//       const response = await fetch('/api/twitter/refresh-data', {
//         method: 'POST'
//       });

//       if (response.ok) {
//         const { user: updatedUser } = await response.json();
//         setUser(updatedUser);
//         await loadEngagementData();
//         toast.success('Twitter data refreshed successfully');
//       }
//     } catch (error) {
//       console.error('Failed to refresh Twitter data:', error);
//       toast.error('Failed to refresh Twitter data');
//     }
//   }, [session, loadEngagementData]);

//   // Auto-sync wallet when both are connected
//   useEffect(() => {
//     if (session?.user?.id && connected && publicKey && !user?.walletAddress) {
//       syncUserWithWallet();
//     }
//   }, [session, connected, publicKey]);
//   // }, [session, connected, publicKey, user?.walletAddress]);
//   // Load engagement data when authenticated
//   useEffect(() => {
//     if (session?.user?.id) {
//       loadEngagementData();
//     }
//   }, [session?.user?.id]);

//   return {
//     session,
//     isTwitterConnected: !!session?.user?.twitterId,
//     isConnecting: status === 'loading' || isSyncing,
//     error,
//     engagement:engagementData,
//     connectTwitter,
//     disconnectTwitter,
//     refreshTwitterData,
//     loadEngagementData,
//   };
// }





// hooks/useTwitterAuth.ts
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { useUserStore } from '@/store/useUserStore';
import { useWalletStore } from '@/store/useWalletStore';
import { toast } from 'sonner';

export function useTwitterAuth() {
  const { data: session, status, update } = useSession();
  const { user, setUser } = useUserStore();
  const { connected, publicKey } = useWalletStore();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing Twitter session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      setIsLoading(true);
      try {
        const existingSession = await getSession();
        if (existingSession?.user?.twitterId) {
          // Session exists, load engagement data
          await loadEngagementData();
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const connectTwitter = useCallback(async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }
    try {
      await signIn('twitter', {
        callbackUrl: `${window.location.origin}/?twitter_connected=true`,
        redirect: false,
      });
      return true;
    } catch (error) {
      console.error('Twitter connection error:', error);
      toast.error('Failed to connect Twitter');
      return false;
    }
  }, [connected, publicKey]);

  const disconnectTwitter = useCallback(async () => {
    try {
      await signOut({ callbackUrl: `${window.location.origin}/dashboard` });
      toast.success('Twitter disconnected successfully');
    } catch (error) {
      console.error('Twitter disconnect error:', error);
      toast.error('Failed to disconnect Twitter');
    }
  }, []);

  const syncUserWithWallet = useCallback(async () => {
    if (!session?.user?.id || !publicKey || isSyncing) return;
    
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/sync-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          walletAddress: publicKey,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      const { user: syncedUser } = await response.json();
      setUser(syncedUser);
      
      // Update session to include wallet address
      await update({
        ...session,
        user: {
          ...session.user,
          walletAddress: publicKey,
        }
      });
      
      toast.success('Wallet connected successfully');
    } catch (error) {
      console.error('Wallet sync error:', error);
      setError('Failed to sync wallet');
    } finally {
      setIsSyncing(false);
    }
  }, [session, publicKey, isSyncing, update, setUser]);

  const mergeAccounts = useCallback(async (sourceUserId: string, targetUserId: string) => {
    try {
      const response = await fetch('/api/auth/merge-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUserId,
          targetUserId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Merge failed');
      }
      
      const { user: mergedUser } = await response.json();
      setUser(mergedUser);
      
      // Update session with merged user data
      await update({
        ...session,
        user: {
          ...session?.user,
          ...mergedUser,
        }
      });
      
      toast.success('Accounts merged successfully');
      return true;
    } catch (error) {
      console.error('Account merge error:', error);
      toast.error('Failed to merge accounts');
      return false;
    }
  }, [session, update, setUser]);

  const loadEngagementData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch('/api/twitter/engagement-stats');
      if (response.ok) {
        const data = await response.json();
        setEngagementData(data.stats);
      }
    } catch (error) {
      console.error('Failed to load engagement data:', error);
    }
  }, [session]);

  const refreshTwitterData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch('/api/twitter/refresh-data', {
        method: 'POST'
      });
      if (response.ok) {
        const { user: updatedUser } = await response.json();
        setUser(updatedUser);
        await loadEngagementData();
        toast.success('Twitter data refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh Twitter data:', error);
      toast.error('Failed to refresh Twitter data');
    }
  }, [session, loadEngagementData, setUser]);

  // Auto-sync wallet when both are connected
  useEffect(() => {
    if (session?.user?.id && connected && publicKey && !session.user.walletAddress) {
      syncUserWithWallet();
    }
  }, [session, connected, publicKey, syncUserWithWallet]);

  // Load engagement data when authenticated
  useEffect(() => {
    if (session?.user?.id && !engagementData) {
      loadEngagementData();
    }
  }, [session, engagementData, loadEngagementData]);

  return {
    session,
    isTwitterConnected: !!session?.user?.twitterId,
    isConnecting: status === 'loading' || isSyncing || isLoading,
    error,
    engagement: engagementData,
    connectTwitter,
    disconnectTwitter,
    refreshTwitterData,
    loadEngagementData,
    mergeAccounts,
  };
}