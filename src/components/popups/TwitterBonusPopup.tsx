'use client'

import { useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import { Gift, X, CheckCircle, Sparkles, Coins } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { useSession } from 'next-auth/react'
import { claimTwitterBonus, checkBonusStatus } from '@/lib/popupbonus/handlebonus'

export default function TwitterBonusPopup() {
  const { user, setUser } = useUserStore()
  const [showPopup, setShowPopup] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [confettiKey, setConfettiKey] = useState(0)
  const { width, height } = { width: window.innerWidth, height: window.innerHeight }
  const { data: session, status } = useSession()

  // Initialize popup state based on user bonus status
  useEffect(() => {
    const initializePopupState = async () => {
      if (status !== 'authenticated' || !user || !session?.user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await checkBonusStatus(session.user.id)
        
        if (response.status && response.userBonusStatus) {
          const hasReceivedBonus = response.userBonusStatus.receivedTwitterBonus
          
          if (user?.receivedTwitterBonus !== hasReceivedBonus) {
            setUser({
              ...user,
              receivedTwitterBonus: hasReceivedBonus
            })
          }
          
          setShowPopup(!hasReceivedBonus)
        }
      } catch (error) {
        console.error('Error checking bonus status:', error)
        setShowPopup(!user?.receivedTwitterBonus)
      } finally {
        setIsLoading(false)
      }
    }

    initializePopupState()
  }, [user, session, status, setUser])

  const handleClaimBonus = async () => {
    if (!user || isClaiming || claimed) return
    setIsClaiming(true)
    
    try {
      const response = await claimTwitterBonus()
      
      if (response.status) {
        setUser({
          ...user,
          receivedTwitterBonus: true,
        })
        
        setClaimed(true)
        setConfettiKey(prev => prev + 1)
        
        setTimeout(() => {
          setShowPopup(false)
          setClaimed(false)
        }, 5000)
      }
    } catch (error) {
      console.error('Error claiming bonus:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  const handleClose = () => {
    setShowPopup(false)
  }

  if (isLoading || status !== 'authenticated' || !user) {
    return null
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          <Confetti
            key={confettiKey}
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={700}
            gravity={0.05}
            colors={['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#FFFFFF']}
            tweenDuration={5000}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-500/30 overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl"></div>
              
              {/* Floating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/10"
                  style={{
                    width: `${Math.random() * 10 + 2}px`,
                    height: `${Math.random() * 10 + 2}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.8, 0.2],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
              
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                disabled={isClaiming || claimed}
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="relative z-10 text-center">
                <motion.div 
                  className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Gift className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl md:text-4xl font-bold text-white mb-2 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {claimed ? "Bonus Claimed!" : "Congratulations!"}
                </motion.h2>
                
                <motion.div 
                  className="flex items-center justify-center space-x-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <p className="text-xl text-purple-100">
                    You've earned <span className="font-bold text-yellow-400">3000 $CONNECT</span>
                  </p>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
                
                <motion.p 
                  className="text-gray-300 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  For connecting your Twitter account
                </motion.p>
                
                {claimed ? (
                  <motion.div 
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-green-400 font-medium">Tokens added to your balance!</p>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={handleClaimBonus}
                    disabled={isClaiming}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 disabled:opacity-70 flex items-center justify-center space-x-2 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center space-x-2">
                      {isClaiming ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-5 h-5" />
                          <span>Claim Your Tokens</span>
                        </>
                      )}
                    </span>
                  </motion.button>
                )}
                
                <motion.p 
                  className="text-gray-400 text-sm mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  This bonus is only available for first-time Twitter connections
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}