'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-8xl font-bold text-white mb-4"
        >
          404
        </motion.div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="solana" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              View Leaderboard
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.5, duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="mt-16"
        >
          <div className="w-64 h-64 mx-auto rounded-full bg-gradient-to-r from-solana-purple to-solana-green opacity-20 blur-3xl" />
        </motion.div>
      </motion.div>
    </div>
  )
}