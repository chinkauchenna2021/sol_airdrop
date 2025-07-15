'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { UserPlus, Gift, X } from 'lucide-react'
import toast from 'react-hot-toast'
import prisma from '@/lib/prisma'

interface ReferralBanner {
  show: boolean
  referrerInfo?: {
    twitterUsername?: string
    walletAddress: string
  }
}

export function ReferralTracker() {
  const searchParams = useSearchParams()
  const [banner, setBanner] = useState<ReferralBanner>({ show: false })
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    const referralCode = searchParams?.get('ref')
    if (referralCode && !sessionStorage.getItem('referral_processed')) {
      validateReferralCode(referralCode)
    }
  }, [searchParams])

  const validateReferralCode = async (referralCode: string) => {
    try {
      setIsValidating(true)
      
      const response = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode })
      })

      if (response.ok) {
        const { referrer } = await response.json()
        
        // Store referral info in session storage
        sessionStorage.setItem('pending_referral', JSON.stringify({
          code: referralCode,
          referrer: referrer
        }))

        setBanner({
          show: true,
          referrerInfo: referrer
        })

        toast.success('Referral code applied! You\'ll earn bonus points when you connect your wallet.')
      } else {
        console.error('Invalid referral code')
        // Don't show error to user, just silently fail
      }
    } catch (error) {
      console.error('Referral validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const dismissBanner = () => {
    setBanner({ show: false })
    sessionStorage.setItem('referral_dismissed', 'true')
  }

  if (isValidating) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Validating referral...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {banner.show && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">
                    You were invited by {banner.referrerInfo?.twitterUsername || 
                    `${banner.referrerInfo?.walletAddress?.slice(0, 6)}...${banner.referrerInfo?.walletAddress?.slice(-4)}`}!
                  </p>
                  <p className="text-sm opacity-90">
                    Connect your wallet to claim 100 bonus points for both of you! 🎉
                  </p>
                </div>
              </div>
              <button
                onClick={dismissBanner}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div> 
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

