'use client'

import { useState } from 'react'
import { Twitter, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface TwitterConnectProps {
  onConnect?: () => void
}

export function TwitterConnect({ onConnect }: TwitterConnectProps) {
  const [connecting, setConnecting] = useState(false)

  const handleTwitterConnect = async () => {
    try {
      setConnecting(true)
      
      // Get OAuth URL from backend
      const res = await fetch('/api/twitter/auth')
      if (!res.ok) throw new Error('Failed to get auth URL')
      
      const { authUrl } = await res.json()
      
      // Open Twitter OAuth in popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      const popup = window.open(
        authUrl,
        'twitter-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      // Check for callback
      const checkInterval = setInterval(() => {
        try {
          if (popup?.closed) {
            clearInterval(checkInterval)
            checkAuthStatus()
          }
        } catch (error) {
          // Ignore cross-origin errors
        }
      }, 1000)
      
    } catch (error) {
      console.error('Twitter connect error:', error)
      toast.error('Failed to connect Twitter')
    } finally {
      setConnecting(false)
    }
  }
  
  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/twitter/status')
      if (res.ok) {
        const { connected } = await res.json()
        if (connected) {
          toast.success('Twitter connected successfully!')
          onConnect?.()
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  return (
    <button
      onClick={handleTwitterConnect}
      disabled={connecting}
      className="flex items-center gap-3 px-6 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-all disabled:opacity-50"
    >
      <Twitter className="w-5 h-5" />
      {connecting ? 'Connecting...' : 'Connect Twitter'}
      <ExternalLink className="w-4 h-4" />
    </button>
  )
}