"use client";

import { useEffect, useState, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Wallet, LogOut, Copy, Check, AlertCircle } from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";
import { WalletModal } from "./WalletModal";
import toast from "react-hot-toast";

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [authenticationStatus, setAuthenticationStatus] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  const { setWalletState } = useWalletStore();
  
  // Use refs to track disconnect state
  const isDisconnecting = useRef(false);
  const hasAuthenticated = useRef(false);

  // Handle wallet authentication - but only if not disconnecting
  useEffect(() => {
    const authenticateWallet = async () => {
      // Skip if we're disconnecting or already authenticated this session
      if (isDisconnecting.current || hasAuthenticated.current) {
        return;
      }

      if (connected && publicKey && authenticationStatus === 'idle') {
        try {
          setAuthenticationStatus('authenticating');
          console.log('🔐 Authenticating wallet:', publicKey.toBase58());
          
          const res = await fetch('/api/auth/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: publicKey.toBase58()
            })
          });

          if (res.ok) {
            const data = await res.json();
            console.log('✅ Wallet authenticated successfully:', data);
            
            setWalletState({
              connected: true,
              publicKey: publicKey.toBase58(),
              balance: 0,
              connecting: false,
            });
            
            setAuthenticationStatus('success');
            hasAuthenticated.current = true;
            toast.success('Wallet connected successfully!');
          } else {
            const errorData = await res.json();
            console.error('❌ Authentication failed:', errorData);
            setAuthenticationStatus('error');
            toast.error(errorData.error || 'Authentication failed');
          }
        } catch (error) {
          console.error('❌ Authentication error:', error);
          setAuthenticationStatus('error');
          toast.error('Failed to authenticate wallet');
        }
      }
    };

    authenticateWallet();
  }, [connected, publicKey, setWalletState, authenticationStatus]);

  // Reset authentication status when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setAuthenticationStatus('idle');
      hasAuthenticated.current = false;
      // Reset disconnect flag after a short delay
      setTimeout(() => {
        isDisconnecting.current = false;
      }, 1000);
    }
  }, [connected]);

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      
      // Set disconnecting flag to prevent auto-reconnect
      isDisconnecting.current = true;
      hasAuthenticated.current = false;
      
      // Clear backend session first
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.warn('Failed to clear backend session:', error);
      }
      
      // Clear local state
      setWalletState({ 
        connected: false, 
        publicKey: null, 
        balance: 0, 
        connecting: false 
      });
      
      setAuthenticationStatus('idle');
      
      // Disconnect the wallet
      await disconnect();
      
      console.log('✅ Wallet disconnected successfully');
      toast.success("Wallet disconnected");
      
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      toast.error("Failed to disconnect wallet");
      
      // Reset disconnect flag on error
      isDisconnecting.current = false;
    }
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Show connection status
  if (connected && publicKey && !isDisconnecting.current) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddress}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-white"
        >
          <Wallet className="w-4 h-4" />
          <span>{truncateAddress(publicKey.toBase58())}</span>
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        
        {/* Authentication Status Indicator */}
        {authenticationStatus === 'authenticating' && (
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        )}
        
        {authenticationStatus === 'error' && (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
        
        <button
          onClick={handleDisconnect}
          className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all text-red-400"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-solana-purple text-white font-semibold rounded-lg hover:bg-solana-purple/90 transition-all flex items-center gap-2 glow-effect"
      >
        <Wallet className="w-5 h-5" />
        Connect Wallet
      </button>
      
      <WalletModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}