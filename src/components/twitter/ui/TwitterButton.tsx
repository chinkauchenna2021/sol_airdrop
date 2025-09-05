"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Twitter, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface TwitterConnectButtonProps {
  twitterConnection: () => void;
  isLoading:boolean;
  className?: string;
}

export default function TwitterConnectButton({ 
  twitterConnection,
  isLoading,
  className = "" 
}: TwitterConnectButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 blur-lg opacity-70"
        animate={{ 
          scale: isHovered ? [1, 1.05, 1] : 1,
          opacity: isHovered ? [0.7, 0.85, 0.7] : 0.7 
        }}
        transition={{ 
          duration: 2, 
          repeat: isHovered ? Infinity : 0,
          repeatType: "reverse" 
        }}
      />
      
      {/* Main button */}
      <motion.button
        onClick={twitterConnection}
        disabled={isLoading}
        className="relative flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold text-lg shadow-lg overflow-hidden group"
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CiAgPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTAgMEg1MFY1MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] opacity-20" />
        </div>
        
        {/* Left side - Twitter icon */}
        <div className="flex items-center justify-center w-8 h-6 rounded-xl bg-white/20 backdrop-blur-sm mr-4">
          <Twitter className="w-6 h-6 text-white" />
        </div>
        
        {/* Middle - Text content */}
        <div className="flex-1 text-left">
          <div className="flex items-center">
            <span className="font-bold">Connect Twitter</span>
            <Sparkles className="w-4 h-4 ml-2 text-yellow-300" />
          </div>
          <p className="text-xs text-blue-100 font-normal mt-1">
            Verify your account for airdrop eligibility
          </p>
        </div>
        
        {/* Right side - Arrow */}
        <motion.div
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm ml-2"
          animate={{ x: isHovered ? [0, 5, 0] : 0 }}
          transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </motion.div>
        
        {/* Loading overlay */}
        {isLoading && (
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col items-center flex gap-6">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span className="mt-2 text-white text-sm font-medium">Connecting...</span>
            </div>
          </motion.div>
        )}
        
        {/* Security badge */}
        <div className="absolute -top-2 -right-2 flex items-center bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Secure
        </div>
      </motion.button>
      
      {/* Decorative elements */}
      <motion.div
        className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-yellow-400"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      <motion.div
        className="absolute -bottom-3 -right-3 w-4 h-4 rounded-full bg-pink-500"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: 2.5, 
          repeat: Infinity,
          repeatType: "reverse",
          delay: 0.5
        }}
      />
    </motion.div>
  );
}