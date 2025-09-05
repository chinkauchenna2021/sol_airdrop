"use client";

import { useState } from "react";
import { Twitter, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface TwitterConnectButtonProps {
  twitterConnection: () => void;
  isLoading: boolean;
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
      className={`relative w-full sm:w-auto ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 blur-lg opacity-70"
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
        className="relative flex items-center justify-center w-full py-3 sm:py-4 px-3 sm:px-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold text-base sm:text-lg shadow-lg overflow-hidden group"
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CiAgPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTAgMEg1MFY1MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] opacity-20" />
        </div>
        
        {/* Left side - Twitter icon */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm mr-2 sm:mr-3 flex-shrink-0">
          <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        
        {/* Middle - Text content */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center">
            <span className="font-bold truncate">Connect Twitter</span>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-yellow-300 flex-shrink-0" />
          </div>
          {/* Only show subtitle on larger screens */}
          <p className="hidden sm:block text-xs text-blue-100 font-normal mt-1 truncate">
            Verify for airdrop eligibility
          </p>
        </div>
        
        {/* Right side - Arrow */}
        <motion.div
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-sm ml-2 flex-shrink-0"
          animate={{ x: isHovered ? [0, 5, 0] : 0 }}
          transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
        >
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </motion.div>
        
        {/* Loading overlay */}
        {isLoading && (
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-white font-medium">Connecting...</span>
            </div>
          </motion.div>
        )}
        
        {/* Security badge */}
        <div className="absolute -top-2 -right-2 flex items-center bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3 mr-1" />
        </div>
      </motion.button>
      
      {/* Decorative elements */}
      <motion.div
        className="absolute -top-2 -left-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400"
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
        className="absolute -bottom-2 -right-2 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-pink-500"
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