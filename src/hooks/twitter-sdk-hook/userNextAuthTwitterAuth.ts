// hooks/useTwitterAuth.ts
'use client'
import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useUserStore } from '@/store/useUserStore';
import { useWalletStore } from '@/store/useWalletStore';
import { toast } from 'sonner';

export function useTwitterAuth() {
  const { data: session, status } = useSession();
  const { user, setUser } = useUserStore();
  const { connected, publicKey } = useWalletStore();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const connectTwitter = useCallback(async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      await signIn('twitter', {
        callbackUrl: `${window.location.origin}/dashboard?twitter_connected=true`,
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
      toast.success('Wallet connected successfully');

    } catch (error) {
      console.error('Wallet sync error:', error);
      setError('Failed to sync wallet');
    } finally {
      setIsSyncing(false);
    }
  }, [session, publicKey, isSyncing]);

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
  }, [session, loadEngagementData]);

  // Auto-sync wallet when both are connected
  useEffect(() => {
    if (session?.user?.id && connected && publicKey && !user?.walletAddress) {
      syncUserWithWallet();
    }
  }, [session, connected, publicKey, user?.walletAddress]);

  // Load engagement data when authenticated
  useEffect(() => {
    if (session?.user?.id) {
      loadEngagementData();
    }
  }, [session?.user?.id]);

  return {
    session,
    isTwitterConnected: !!session?.user?.twitterId,
    isConnecting: status === 'loading' || isSyncing,
    error,
    engagement:engagementData,
    connectTwitter,
    disconnectTwitter,
    refreshTwitterData,
    loadEngagementData,
  };
}