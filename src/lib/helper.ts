import { ENHANCED_CONFIG } from "./constants"

async function getCurrentSOLPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
    const data = await response.json()
    return data.solana.usd
  } catch (error) {
    console.error('Error fetching SOL price:', error)
    return 20 // Fallback price
  }
}

async function processTokenTransfer(
  walletAddress: string, 
  amount: number
): Promise<{ success: boolean; signature?: string }> {
  try {
    // This would interact with your CONNECT token contract
    // Implementation depends on your specific token contract setup
    
    // For SPL tokens, you would use:
    // const signature = await createTokenTransfer(walletAddress, amount)
    
    // For custom contracts, you would call your contract methods
    
    return { 
      success: true, 
      signature: 'mock_signature_' + Date.now().toString() 
    }
  } catch (error) {
    console.error('Token transfer error:', error)
    return { success: false }
  }
}

export class EarningSystemHelpers {
  
  // Calculate streak bonus
  static calculateStreakBonus(streakDays: number): number {
    if (streakDays >= 30) return ENHANCED_CONFIG.DAILY_EARNING.STREAK_BONUS_30_DAYS
    if (streakDays >= 7) return ENHANCED_CONFIG.DAILY_EARNING.STREAK_BONUS_7_DAYS
    return 0
  }

  // Calculate total daily reward
  static calculateDailyReward(streakDays: number): number {
    return ENHANCED_CONFIG.DAILY_EARNING.LOGIN_REWARD + this.calculateStreakBonus(streakDays)
  }

  // Determine airdrop tier
  static determineAirdropTier(followers: number, engagementRate: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    const config = ENHANCED_CONFIG.AIRDROP.TIERS
    
    if (followers >= config.HIGH_ENGAGEMENT.minFollowers || engagementRate >= config.HIGH_ENGAGEMENT.minEngagementRate) {
      return 'HIGH'
    }
    
    if (followers >= config.MEDIUM_ENGAGEMENT.minFollowers || engagementRate >= config.MEDIUM_ENGAGEMENT.minEngagementRate) {
      return 'MEDIUM'
    }
    
    return 'LOW'
  }

  // Get airdrop allocation by tier
  static getAirdropAllocation(tier: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    return ENHANCED_CONFIG.AIRDROP.TIERS[`${tier}_ENGAGEMENT`].tokens
  }

  // Check airdrop eligibility
  static checkAirdropEligibility(user: {
    twitterUsername?: string | null
    walletAddress: string
    engagements: any[]
    createdAt: Date
  }): {
    isEligible: boolean
    requirements: Record<string, boolean>
    failedRequirements: string[]
  } {
    const requirements = {
      twitterConnected: !!user.twitterUsername,
      walletConnected: !!user.walletAddress,
      minEngagements: user.engagements.length >= ENHANCED_CONFIG.THRESHOLDS.MIN_ENGAGEMENTS_FOR_AIRDROP,
      accountAge: (Date.now() - user.createdAt.getTime()) > (ENHANCED_CONFIG.THRESHOLDS.MIN_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000)
    }

    const isEligible = Object.values(requirements).every(Boolean)
    const failedRequirements = Object.entries(requirements)
      .filter(([_, met]) => !met)
      .map(([req]) => req)

    return { isEligible, requirements, failedRequirements }
  }
}
