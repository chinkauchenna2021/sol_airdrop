"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";
import { WalletModal } from "./WalletModal";
import toast from "react-hot-toast";

export function WalletButton() {
  const { connected, publicKey } = useWallet();
  const { connect, disconnect, select } = useWallet();
  const { connection } = useConnection();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { setWalletState } = useWalletStore();

  const handleConnect = async () => {
    setShowModal(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setWalletState({ connected: false, publicKey: null, balance: 0 });
      toast.success("Wallet disconnected");
    } catch (error) {
      toast.error("Failed to disconnect wallet");
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

  useEffect(() => {
    (async()=>{
      
      if (connected && publicKey) {  
        console.log(publicKey , "WALLET CONNECTION")           
        const res = await fetch('/api/auth/wallet', {      
          method: 'POST',       
          headers: { 'Content-Type': 'application/json' },       
          body: JSON.stringify({       
            walletAddress: publicKey?.toBase58()       
          })      
        }) 
        const data = await res.json()
        console.log(data, "====Wallet auth")
        
        setWalletState({
            connected: true,
            publicKey: publicKey?.toBase58(),
            balance: 0,
          });    
        }
    })()
    
  }, [connected,publicKey]);

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddress}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-white"
        >
          <Wallet className="w-4 h-4" />
          <span>{truncateAddress(publicKey.toBase58())}</span>
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleDisconnect}
          className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all text-red-400"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleConnect}
        className="px-6 py-3 bg-solana-purple text-white font-semibold rounded-lg hover:bg-solana-purple/90 transition-all flex items-center gap-2 glow-effect"
      >
        <Wallet className="w-5 h-5" />
        Connect Wallet
      </button>
      <WalletModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
