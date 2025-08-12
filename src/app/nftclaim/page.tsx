'use client'

import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Transaction } from '@solana/web3.js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  Shield, 
  Coins, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Gift
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ApprovalStatus {
  approved: boolean
  claimed: boolean
  approvedAt?: string
  approvedBy?: string
}

interface PaymentInfo {
  transaction: string
  requiredSol: number
  lamports: number
  solPrice: number
  adminWallet: string
  message: string
}

interface MintResult {
  mintAddress: string
  nftNumber: number
  createSignature: string
  transferSignature: string
  message: string
}

const NFT_IMAGE_URL = "https://devnet.irys.xyz/2L1yiTEdYuV8qU88yGfU4eLqTzaETrF1bv5p5RF7vuu4"

export default function NFTMintingPage() {
  const { publicKey, signTransaction, connected } = useWallet()
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'connect' | 'check' | 'payment' | 'minting' | 'complete'>('connect')
  const [paymentSignature, setPaymentSignature] = useState<string>('')

  useEffect(() => {
    if (connected && publicKey) {
      setStep('check')
      checkApprovalStatus()
    } else {
      setStep('connect')
      setApprovalStatus(null)
    }
  }, [connected, publicKey])

  const checkApprovalStatus = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const response = await fetch(`/api/nft-claims/approval-status?wallet=${publicKey.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setApprovalStatus(data)
        
        if (data.claimed) {
          setStep('complete')
        } else if (data.approved) {
          setStep('payment')
        }
      } else {
        setApprovalStatus({ approved: false, claimed: false })
      }
    } catch (error) {
      console.error('Error checking approval status:', error)
      toast.error('Failed to check approval status')
    } finally {
      setLoading(false)
    }
  }

  const generatePaymentTransaction = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const response = await fetch('/api/nft-claims/paid-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_payment',
          userWallet: publicKey.toString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentInfo(data)
        toast.success('Payment transaction ready!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate payment transaction')
      }
    } catch (error) {
      console.error('Error generating payment:', error)
      toast.error('Failed to generate payment transaction')
    } finally {
      setLoading(false)
    }
  }

  const processPayment = async () => {
    if (!paymentInfo || !signTransaction || !publicKey) return

    try {
      setLoading(true)
      
      // Deserialize transaction
      const transaction = Transaction.from(Buffer.from(paymentInfo.transaction, 'base64'))
      
      // Sign transaction
      const signedTransaction = await signTransaction(transaction)
      
      // Send transaction
      const signature = await window.solana.sendAndConfirmTransaction(
        signedTransaction,
        { commitment: 'confirmed' }
      )
      
      setPaymentSignature(signature)
      toast.success('Payment successful! Processing NFT mint...')
      
      // Process mint
      await processMint(signature)
      
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Payment failed')
      setLoading(false)
    }
  }

  const processMint = async (signature: string) => {
    if (!publicKey) return

    try {
      setStep('minting')
      
      const response = await fetch('/api/nft-claims/paid-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_mint',
          userWallet: publicKey.toString(),
          paymentSignature: signature
        })
      })

      if (response.ok) {
        const result = await response.json()
        setMintResult(result)
        setStep('complete')
        toast.success('🎉 NFT minted and transferred successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to mint NFT')
        setStep('payment')
      }
    } catch (error) {
      console.error('Mint error:', error)
      toast.error('Failed to mint NFT')
      setStep('payment')
    } finally {
      setLoading(false)
    }
  }

  const resetProcess = () => {
    setPaymentInfo(null)
    setMintResult(null)
    setPaymentSignature('')
    setStep('check')
    checkApprovalStatus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Shield className="w-10 h-10 text-purple-400" />
            Connect Pass NFT
          </h1>
          <p className="text-gray-300 text-lg">
            Your exclusive access pass to the Connect ecosystem
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* NFT Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Connect Pass NFT</h3>
              <p className="text-gray-300">Limited Edition • $7.00</p>
            </div>
            
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-black/20 rounded-xl p-4">
                <img
                  src={NFT_IMAGE_URL}
                  alt="Connect Pass NFT"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Collection:</span>
                <span className="text-white font-medium">Connect Pass</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Symbol:</span>
                <span className="text-white font-medium">$connect</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Creator Fee:</span>
                <span className="text-white font-medium">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-white font-medium">Solana Devnet</span>
              </div>
            </div>
          </motion.div>

          {/* Process Flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Minting Process</h3>

            <AnimatePresence mode="wait">
              {step === 'connect' && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                    <Wallet className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h4>
                    <p className="text-gray-300 mb-6">
                      Connect your Solana wallet to check your approval status
                    </p>
                    <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-blue-500 hover:!from-purple-600 hover:!to-blue-600" />
                  </div>
                </motion.div>
              )}

              {step === 'check' && (
                <motion.div
                  key="check"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  {loading ? (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-10 h-10 text-yellow-400 animate-spin" />
                      </div>
                      <p className="text-white">Checking approval status...</p>
                    </div>
                  ) : approvalStatus ? (
                    <div className="space-y-4">
                      {approvalStatus.approved ? (
                        <>
                          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-white mb-2">Approved for Minting!</h4>
                            <p className="text-gray-300 mb-6">
                              You're approved to mint your Connect Pass NFT
                            </p>
                            <button
                              onClick={generatePaymentTransaction}
                              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all"
                            >
                              Continue to Payment
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-10 h-10 text-red-400" />
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-white mb-2">Not Approved</h4>
                            <p className="text-gray-300 mb-6">
                              You need admin approval to mint an NFT. Please contact support.
                            </p>
                            <button
                              onClick={checkApprovalStatus}
                              className="px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all flex items-center gap-2 mx-auto"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Refresh Status
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-10 h-10 text-blue-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">Payment Required</h4>
                    <p className="text-gray-300">Pay $7.00 worth of SOL to mint your NFT</p>
                  </div>

                  {paymentInfo ? (
                    <div className="bg-black/20 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">SOL Price:</span>
                        <span className="text-white">${paymentInfo.solPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Required SOL:</span>
                        <span className="text-white">{paymentInfo.requiredSol.toFixed(6)} SOL</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-400">Total USD:</span>
                        <span className="text-green-400">$7.00</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    {!paymentInfo ? (
                      <button
                        onClick={generatePaymentTransaction}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Generating...' : 'Generate Payment'}
                      </button>
                    ) : (
                      <button
                        onClick={processPayment}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Pay & Mint NFT'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 'minting' && (
                <motion.div
                  key="minting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Minting Your NFT</h4>
                    <p className="text-gray-300 mb-4">
                      Creating and transferring your Connect Pass NFT...
                    </p>
                    <div className="w-48 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'complete' && mintResult && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Gift className="w-10 h-10 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">NFT Minted Successfully! 🎉</h4>
                    <p className="text-gray-300 mb-4">
                      Your Connect Pass #{mintResult.nftNumber} has been minted and transferred to your wallet
                    </p>
                    
                    <div className="bg-black/20 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">NFT Number:</span>
                        <span className="text-white">#{mintResult.nftNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mint Address:</span>
                        <span className="text-white font-mono text-xs">{mintResult.mintAddress.slice(0, 8)}...</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => window.open(`https://solscan.io/token/${mintResult.mintAddress}?cluster=devnet`, '_blank')}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Solscan
                      </button>
                      <button
                        onClick={resetProcess}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
                      >
                        Mint Another
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-400 font-semibold mb-1">Important Notes:</p>
              <ul className="text-gray-300 space-y-1">
                <li>• You must be approved by an admin before minting</li>
                <li>• Payment of $7.00 worth of SOL is required</li>
                <li>• NFTs are minted on Solana Devnet</li>
                <li>• Each wallet can only mint one Connect Pass NFT</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}