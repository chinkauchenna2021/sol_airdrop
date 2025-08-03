export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Solana Airdrop Platform'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'CONNECT'
export const TOKEN_DECIMALS = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '9')

// UPDATED: Separate Points and Tokens Configuration
export const POINTS_CONFIG = {
  // Activities that give POINTS only
  DAILY_CHECK_IN: parseInt(process.env.DAILY_CHECK_IN_POINTS || '5'),
  WELCOME_BONUS: parseInt(process.env.WELCOME_BONUS_POINTS || '100'),
  TWITTER_CONNECT: parseInt(process.env.TWITTER_CONNECT_POINTS || '50'),
  TASK_COMPLETION: parseInt(process.env.TASK_COMPLETION_POINTS || '25'),
  STREAK_BONUS_7_DAYS: parseInt(process.env.STREAK_BONUS_7_POINTS || '10'),
  STREAK_BONUS_30_DAYS: parseInt(process.env.STREAK_BONUS_30_POINTS || '25'),
  ACHIEVEMENT_UNLOCK: parseInt(process.env.ACHIEVEMENT_POINTS || '15'),
  WALLET_CONNECT: parseInt(process.env.WALLET_CONNECT_POINTS || '25'),
} as const

export const TOKENS_CONFIG = {
  // Activities that give TOKENS only
  REFERRAL: parseFloat(process.env.REFERRAL_TOKENS || '50'),
  TWITTER_LIKE: parseFloat(process.env.TWITTER_LIKE_TOKENS || '0.5'),
  TWITTER_RETWEET: parseFloat(process.env.TWITTER_RETWEET_TOKENS || '1.0'),
  TWITTER_COMMENT: parseFloat(process.env.TWITTER_COMMENT_TOKENS || '0.8'),
  TWITTER_FOLLOW: parseFloat(process.env.TWITTER_FOLLOW_TOKENS || '2.0'),
  TWITTER_QUOTE: parseFloat(process.env.TWITTER_QUOTE_TOKENS || '1.5'),
} as const

// LEGACY: Keep for backward compatibility but mark as deprecated
export const POINTS = {
  LIKE: 0, // DEPRECATED: Now gives tokens
  RETWEET: 0, // DEPRECATED: Now gives tokens  
  COMMENT: 0, // DEPRECATED: Now gives tokens
  FOLLOW: 0, // DEPRECATED: Now gives tokens
  REFERRAL: 0, // DEPRECATED: Now gives tokens
  DAILY_CHECK_IN: POINTS_CONFIG.DAILY_CHECK_IN,
  WELCOME_BONUS: POINTS_CONFIG.WELCOME_BONUS,
  TWITTER_CONNECT: POINTS_CONFIG.TWITTER_CONNECT,
} as const

export const ACTIVITY_TYPES = {
  POINTS: 'POINTS',
  TOKENS: 'TOKENS',
  BOTH: 'BOTH'
} as const

export const ENGAGEMENT_TYPES = {
  LIKE: 'LIKE',
  RETWEET: 'RETWEET',
  COMMENT: 'COMMENT',
  QUOTE: 'QUOTE',
  FOLLOW: 'FOLLOW',
} as const

export const TASK_TYPES = {
  SOCIAL_TWITTER: 'SOCIAL_TWITTER',
  SOCIAL_DISCORD: 'SOCIAL_DISCORD',
  WALLET_CONNECT: 'WALLET_CONNECT',
  REFERRAL: 'REFERRAL',
  DAILY_CHECK_IN: 'DAILY_CHECK_IN',
  CUSTOM: 'CUSTOM',
} as const

export const CLAIM_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

export const PAYMENT_METHODS = {
  SOLANA: 'SOLANA',
  USDC: 'USDC',
} as const

export const SOLANA_ENDPOINTS = {
  MAINNET: 'https://api.mainnet-beta.solana.com',
  DEVNET: 'https://api.devnet.solana.com',
  TESTNET: 'https://api.testnet.solana.com',
} as const

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'An error occurred on the server',
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  TWITTER_NOT_CONNECTED: 'Please connect your Twitter account first',
  INSUFFICIENT_POINTS: 'You do not have enough points',
  INSUFFICIENT_TOKENS: 'You do not have enough tokens', // NEW
  CLAIM_DISABLED: 'Claims are temporarily disabled',
  TASK_ALREADY_COMPLETED: 'You have already completed this task',
  POINTS_NOT_CLAIMABLE: 'Points cannot be claimed, only tokens can be claimed', // NEW
} as const

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TWITTER_CONNECTED: 'Twitter account connected successfully',
  TASK_COMPLETED: 'Task completed successfully',
  CLAIM_SUBMITTED: 'Your claim has been submitted',
  REFERRAL_SUCCESS: 'Referral registered successfully',
  TOKENS_EARNED: 'Tokens earned successfully', // NEW
  POINTS_EARNED: 'Points earned successfully', // NEW
} as const

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LEADERBOARD: '/leaderboard',
  TOKENOMICS: '/tokenomics',
  CLAIM: '/claim',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
} as const

export const CACHE_KEYS = {
  USER_STATS: 'user_stats',
  LEADERBOARD: 'leaderboard',
  TASKS: 'tasks',
  ANALYTICS: 'analytics',
  CONFIG: 'config',
  TOKEN_BALANCE: 'token_balance', // NEW
  POINT_BALANCE: 'point_balance', // NEW
} as const

export const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const

export const LIMITS = {
  MAX_CLAIM_AMOUNT: 1000000,
  MIN_CLAIM_AMOUNT: 100,
  MIN_TOKEN_CLAIM: 10, // NEW: Minimum tokens to claim
  MAX_USERNAME_LENGTH: 30,
  MAX_BIO_LENGTH: 200,
  LEADERBOARD_PAGE_SIZE: 100,
  MAX_REFERRALS_PER_USER: 1000,
} as const

export const REGEX = {
  WALLET_ADDRESS: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const

export const TOKEN_CONFIG = {
  NAME: 'CONNECT',
  SYMBOL: 'CONNECT', 
  DECIMALS: 9,
  TOTAL_SUPPLY: 1000000000, // 1 billion tokens
  AIRDROP_ALLOCATION: 400000000, // 40% for airdrops
} as const

export const AIRDROP_CONFIG = {
  CLAIM_FEE_SOL: 4, // $4 worth of SOL required
  TIERS: {
    HIGH_ENGAGEMENT: {
      tokens: 4500,
      requirements: 'High Twitter engagement + followers',
    },
    MEDIUM_ENGAGEMENT: {
      tokens: 4000,
      requirements: 'Medium Twitter engagement + followers',
    },
    LOW_ENGAGEMENT: {
      tokens: 3000,
      requirements: 'Low Twitter engagement + followers',
    }
  },
  SEASON_STATUS: {
    ACTIVE: 'ACTIVE',
    CLAIMING: 'CLAIMING',
    ENDED: 'ENDED',
  }
} as const

export const ENHANCED_CONFIG = {
  // Daily Earning Configuration (POINTS)
  DAILY_EARNING: {
    LOGIN_REWARD: POINTS_CONFIG.DAILY_CHECK_IN,
    STREAK_BONUS_7_DAYS: POINTS_CONFIG.STREAK_BONUS_7_DAYS,
    STREAK_BONUS_30_DAYS: POINTS_CONFIG.STREAK_BONUS_30_DAYS,
    TWITTER_CONNECT_BONUS: POINTS_CONFIG.TWITTER_CONNECT,
    COOLDOWN_HOURS: 24
  },

  // Token Earning Configuration (TOKENS)
  TOKEN_EARNING: {
    REFERRAL_REWARD: TOKENS_CONFIG.REFERRAL,
    TWITTER_REWARDS: {
      LIKE: TOKENS_CONFIG.TWITTER_LIKE,
      RETWEET: TOKENS_CONFIG.TWITTER_RETWEET,
      COMMENT: TOKENS_CONFIG.TWITTER_COMMENT,
      FOLLOW: TOKENS_CONFIG.TWITTER_FOLLOW,
      QUOTE: TOKENS_CONFIG.TWITTER_QUOTE,
    }
  },

  // Airdrop Configuration
  AIRDROP: {
    CLAIM_FEE_SOL: 4, // $4 worth of SOL
    TIERS: {
      HIGH_ENGAGEMENT: {
        tokens: 4500,
        requirements: 'High Twitter engagement (1000+ followers OR 2+ engagements/day)',
        minFollowers: 1000,
        minEngagementRate: 2.0
      },
      MEDIUM_ENGAGEMENT: {
        tokens: 4000,
        requirements: 'Medium Twitter engagement (500+ followers OR 1+ engagements/day)',
        minFollowers: 500,
        minEngagementRate: 1.0
      },
      LOW_ENGAGEMENT: {
        tokens: 3000,
        requirements: 'Basic Twitter engagement (connected account with activity)',
        minFollowers: 0,
        minEngagementRate: 0.1
      }
    }
  },

  // System Thresholds
  THRESHOLDS: {
    HIGH_ACTIVITY_FOLLOWERS: 1000,
    MEDIUM_ACTIVITY_FOLLOWERS: 500,
    HIGH_ENGAGEMENT_RATE: 2.0, // per day
    MEDIUM_ENGAGEMENT_RATE: 1.0, // per day
    MIN_ACCOUNT_AGE_DAYS: 7,
    MIN_ENGAGEMENTS_FOR_AIRDROP: 5
  }
} as const

// Default achievements configuration (POINTS only)
export const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🚀',
    points: 25,
    rewardType: 'POINTS',
    requirements: { totalPoints: { gte: 1 } }
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Connect your Twitter account',
    icon: '🐦',
    points: 50,
    rewardType: 'POINTS',
    requirements: { twitterConnected: true }
  },
  {
    id: 'point-collector',
    name: 'Point Collector',
    description: 'Reach 100 points',
    icon: '💰',
    points: 0,
    rewardType: 'POINTS',
    requirements: { totalPoints: { gte: 100 } }
  },
  {
    id: 'engagement-master',
    name: 'Engagement Master',
    description: 'Complete 10 tasks',
    icon: '💪',
    points: 100,
    rewardType: 'POINTS',
    requirements: { completedTasks: { gte: 10 } }
  },
  {
    id: 'token-earner',
    name: 'Token Earner',
    description: 'Earn your first 10 tokens from Twitter activities',
    icon: '🪙',
    points: 50,
    rewardType: 'POINTS',
    requirements: { totalTokens: { gte: 10 } }
  },
  {
    id: 'referral-champion',
    name: 'Referral Champion',
    description: 'Refer 5 users successfully',
    icon: '🏆',
    points: 200,
    rewardType: 'POINTS',
    requirements: { referralCount: { gte: 5 } }
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 7-day login streak',
    icon: '🔥',
    points: 150,
    rewardType: 'POINTS',
    requirements: { streak: { gte: 7 } }
  }
] as const

// Helper functions for reward calculation
export const getTwitterTokenReward = (engagementType: string): number => {
  switch (engagementType.toUpperCase()) {
    case 'LIKE': return TOKENS_CONFIG.TWITTER_LIKE
    case 'RETWEET': return TOKENS_CONFIG.TWITTER_RETWEET
    case 'COMMENT': return TOKENS_CONFIG.TWITTER_COMMENT
    case 'FOLLOW': return TOKENS_CONFIG.TWITTER_FOLLOW
    case 'QUOTE': return TOKENS_CONFIG.TWITTER_QUOTE
    default: return 0.5 // Default fallback
  }
}

export const getPointsReward = (actionType: string): number => {
  switch (actionType.toUpperCase()) {
    case 'DAILY_CHECK_IN': return POINTS_CONFIG.DAILY_CHECK_IN
    case 'WELCOME_BONUS': return POINTS_CONFIG.WELCOME_BONUS
    case 'TWITTER_CONNECT': return POINTS_CONFIG.TWITTER_CONNECT
    case 'TASK_COMPLETION': return POINTS_CONFIG.TASK_COMPLETION
    case 'STREAK_BONUS_7': return POINTS_CONFIG.STREAK_BONUS_7_DAYS
    case 'STREAK_BONUS_30': return POINTS_CONFIG.STREAK_BONUS_30_DAYS
    case 'ACHIEVEMENT': return POINTS_CONFIG.ACHIEVEMENT_UNLOCK
    case 'WALLET_CONNECT': return POINTS_CONFIG.WALLET_CONNECT
    default: return 0
  }
}

export const isTokenActivity = (activityType: string): boolean => {
  const tokenActivities = ['REFERRAL', 'TWITTER_LIKE', 'TWITTER_RETWEET', 'TWITTER_COMMENT', 'TWITTER_FOLLOW', 'TWITTER_QUOTE']
  return tokenActivities.includes(activityType.toUpperCase())
}

export const isPointActivity = (activityType: string): boolean => {
  const pointActivities = ['DAILY_CHECK_IN', 'WELCOME_BONUS', 'TWITTER_CONNECT', 'TASK_COMPLETION', 'STREAK_BONUS', 'ACHIEVEMENT', 'WALLET_CONNECT']
  return pointActivities.some(activity => activityType.toUpperCase().includes(activity))
}