import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, Twitter, ChevronDown } from 'lucide-react'

interface TwitterConnectionIndicatorProps {
  connected: boolean
  hasTwitter: boolean
  className?: string
}

export const TwitterConnectionIndicator: React.FC<TwitterConnectionIndicatorProps> = ({
  connected,
  hasTwitter,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolledToTwitter, setHasScrolledToTwitter] = useState(false)

  useEffect(() => {
    // Show indicator only if wallet is connected but Twitter is not
    const shouldShow = connected && !hasTwitter && !hasScrolledToTwitter
    setIsVisible(shouldShow)
  }, [connected, hasTwitter, hasScrolledToTwitter])

  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled to the Twitter connection section
      const twitterSection = document.querySelector('[data-twitter-connection]')
      if (twitterSection) {
        const rect = twitterSection.getBoundingClientRect()
        const isInView = rect.top <= window.innerHeight * 0.8 // Trigger when 80% in view
        
        if (isInView && !hasScrolledToTwitter) {
          setHasScrolledToTwitter(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasScrolledToTwitter])

  // Reset when Twitter gets connected
  useEffect(() => {
    if (hasTwitter) {
      setHasScrolledToTwitter(false)
    }
  }, [hasTwitter])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ 
            duration: 0.6, 
            ease: "easeOut",
            delay: 2 // Delay appearance to avoid overwhelming user
          }}
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none ${className}`}
        >
          {/* Main Indicator Container */}
          <div className="relative">
            {/* Pulsing Background Circle */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 blur-xl"
              style={{ width: '200px', height: '200px', left: '-50px', top: '-50px' }}
            />

            {/* Main Content Card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative bg-gray-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20"
              style={{ width: '300px' }}
            >
              {/* Twitter Icon with Glow */}
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-50" />
                  <div className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Twitter className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Main Text */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Complete Your Setup
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Connect your Twitter account to start earning rewards through social engagement
                </p>
              </div>

              {/* Scroll Instruction */}
              <div className="text-center">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="flex flex-col items-center space-y-2"
                >
                  <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">
                    Scroll Down
                  </span>
                  
                  {/* Animated Arrow */}
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="flex flex-col items-center space-y-1"
                  >
                    <ArrowDown className="w-5 h-5 text-blue-400" />
                    <ChevronDown className="w-4 h-4 text-blue-400/70" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-gray-700/50">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="w-8 h-0.5 bg-gray-600 rounded-full" />
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    backgroundColor: ['#3B82F6', '#06B6D4', '#3B82F6']
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 rounded-full"
                />
                <div className="w-8 h-0.5 bg-gray-600 rounded-full" />
                <div className="w-2 h-2 bg-gray-600 rounded-full" />
              </div>

              {/* Step Indicator */}
              <div className="text-center mt-3">
                <span className="text-xs text-gray-400">
                  Step 2 of 3 • Connect Social Media
                </span>
              </div>
            </motion.div>

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
                animate={{
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TwitterConnectionIndicator