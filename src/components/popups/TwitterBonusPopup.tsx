'use client'

import { useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { Gift, X, CheckCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { useSession } from 'next-auth/react'
import { claimTwitterBonus, checkBonusStatus } from '@/lib/popupbonus/handlebonus' // Adjust import path as needed

export default function TwitterBonusPopup() {
  const { user, setUser } = useUserStore()
  const [showPopup, setShowPopup] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { width, height } = useWindowSize()
  const { data: session, status } = useSession()
  
  // Check if user has already received bonus

    useEffect(() => {
    const checkBonusEligibility = async () => {
    //   if (!user?.id || !session?.user.twitterId) {
    //     setIsLoading(false)
    //     return
    //   }

      try {
        // Check bonus status from server
        const response = await checkBonusStatus(session?.user.id as string)
        
        if (response.status && response.userBonusStatus) {
          const hasReceivedBonus = response.userBonusStatus.receivedTwitterBonus
          
          // Update local state to match server
          if (user?.receivedTwitterBonus !== hasReceivedBonus) {
            if (user) {
              setUser({
                ...user,
                id: user.id,
                walletAddress: user.walletAddress ?? '',
                twitterUsername: user.twitterUsername ?? '',
                twitterId: user.twitterId ?? '',
                totalPoints: user.totalPoints ?? 0,
                rank: user.rank ?? 0,
                isAdmin: user.isAdmin ?? false,
                twitterActivity: user.twitterActivity ?? 'LOW',
                twitterFollowers: user.twitterFollowers ?? 0,
                receivedTwitterBonus: hasReceivedBonus
              })
            }
          }

          // Show popup only if user hasn't received bonus yet
          setShowPopup(!hasReceivedBonus)
        }
      } catch (error) {
        console.error('Error checking bonus status:', error)
        // Fallback to client state if server check fails
        setShowPopup(!user?.receivedTwitterBonus)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated' && user) {
      checkBonusEligibility()
    } else {
      setIsLoading(false)
    }
  }, [])

  
  useEffect(() => {
    const checkBonusEligibility = async () => {
    //   if (!user?.id || !session?.user.twitterId) {
    //     setIsLoading(false)
    //     return
    //   }

      try {
        // Check bonus status from server
        const response = await checkBonusStatus(session?.user.id as string)
        
        if (response.status && response.userBonusStatus) {
          const hasReceivedBonus = response.userBonusStatus.receivedTwitterBonus
          
          // Update local state to match server
          if (user?.receivedTwitterBonus !== hasReceivedBonus) {
            if (user) {
              setUser({
                ...user,
                id: user.id,
                walletAddress: user.walletAddress ?? '',
                twitterUsername: user.twitterUsername ?? '',
                twitterId: user.twitterId ?? '',
                totalPoints: user.totalPoints ?? 0,
                rank: user.rank ?? 0,
                isAdmin: user.isAdmin ?? false,
                twitterActivity: user.twitterActivity ?? 'LOW',
                twitterFollowers: user.twitterFollowers ?? 0,
                receivedTwitterBonus: hasReceivedBonus
              })
            }
          }

          // Show popup only if user hasn't received bonus yet
          setShowPopup(!hasReceivedBonus)
        }
      } catch (error) {
        console.error('Error checking bonus status:', error)
        // Fallback to client state if server check fails
        setShowPopup(!user?.receivedTwitterBonus)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated' && user) {
      checkBonusEligibility()
    } else {
      setIsLoading(false)
    }
  }, [user, session, status, setUser])

  const handleClaimBonus = async () => {
    if (!user || isClaiming || claimed) return

    setIsClaiming(true)
    try {
      const response = await claimTwitterBonus()
      
      if (response.status) {
        // Update local state
        setUser({
          ...user,
          receivedTwitterBonus: true
        })
        
        setClaimed(true)
        
        // Auto close after success
        setTimeout(() => {
          setShowPopup(false)
          setClaimed(false)
        }, 10000)
      } else {
        console.error('Failed to claim bonus:', response.message)
        // Optional: Show error message to user
      }
    } catch (error) {
      console.error('Error claiming bonus:', error)
      // Optional: Show error message to user
    } finally {
      setIsClaiming(false)
    }
  }

  const handleClose = () => {
    setShowPopup(false)
  }

  // Don't render anything while loading or if not authenticated
  if (isLoading || status !== 'authenticated' || !user) {
    return null
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.1}
            colors={['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-500/30 overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl"></div>
              
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                disabled={isClaiming || claimed}
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="relative z-10 text-center">
                <div className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg">
                  <Gift className="w-12 h-12 text-white" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">
                  {claimed ? "Bonus Claimed!" : "Congratulations!"}
                </h2>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <p className="text-xl text-purple-200">
                    You've received <span className="font-bold text-yellow-400">3000 tokens</span>
                  </p>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                
                <p className="text-gray-300 mb-8">
                  For connecting your Twitter account to our platform
                </p>

                {claimed ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-green-400 font-medium">Tokens added to your balance!</p>
                  </div>
                ) : (
                  <button
                    onClick={handleClaimBonus}
                    disabled={isClaiming}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 disabled:opacity-70 flex items-center justify-center space-x-2"
                  >
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
                        <Gift className="w-5 h-5" />
                        <span>Claim Your Tokens</span>
                      </>
                    )}
                  </button>
                )}
                
                <p className="text-gray-400 text-sm mt-6">
                  This bonus is only available for first-time Twitter connections
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}