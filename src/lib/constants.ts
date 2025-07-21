export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Solana Airdrop Platform'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'AIRDROP'
export const TOKEN_DECIMALS = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '9')

export const POINTS = {
  LIKE: parseInt(process.env.POINTS_PER_LIKE || '10'),
  RETWEET: parseInt(process.env.POINTS_PER_RETWEET || '20'),
  COMMENT: parseInt(process.env.POINTS_PER_COMMENT || '15'),
  FOLLOW: parseInt(process.env.POINTS_PER_FOLLOW || '50'),
  REFERRAL: parseInt(process.env.POINTS_PER_REFERRAL || '100'),
  DAILY_CHECK_IN: parseInt(process.env.DAILY_CHECK_IN_POINTS || '5'),
  WELCOME_BONUS: 100,
  TWITTER_CONNECT: 50,
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
  CLAIM_DISABLED: 'Claims are temporarily disabled',
  TASK_ALREADY_COMPLETED: 'You have already completed this task',
} as const

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TWITTER_CONNECTED: 'Twitter account connected successfully',
  TASK_COMPLETED: 'Task completed successfully',
  CLAIM_SUBMITTED: 'Your claim has been submitted',
  REFERRAL_SUCCESS: 'Referral registered successfully',
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

// export const DAILY_EARNING_CONFIG = {
//   LOGIN_REWARD: 5, // 5 CONNECT tokens per day
//   REFERRAL_REWARD: 3, // 3 CONNECT tokens per referral
//   COOLDOWN_HOURS: 24, // Can only claim once per 24 hours
// } as const






export const ENHANCED_CONFIG = {
  // Daily Earning Configuration
  DAILY_EARNING: {
    LOGIN_REWARD: 5,
    REFERRAL_REWARD: 3,
    STREAK_BONUS_7_DAYS: 5,
    STREAK_BONUS_30_DAYS: 15,
    TWITTER_CONNECT_BONUS: 50,
    COOLDOWN_HOURS: 24
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

  // Twitter Points Configuration
  TWITTER_POINTS: {
    LIKE: 10,
    RETWEET: 20,
    COMMENT: 15,
    QUOTE: 25,
    FOLLOW: 50
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



// Default achievements configuration
export const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🚀',
    points: 25,
    requirements: { totalPoints: { gte: 1 } }
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Connect your Twitter account',
    icon: '🐦',
    points: 50,
    requirements: { twitterConnected: true }
  },
  {
    id: 'point-collector',
    name: 'Point Collector',
    description: 'Reach 100 points',
    icon: '💰',
    points: 0,
    requirements: { totalPoints: { gte: 100 } }
  },
  {
    id: 'engagement-master',
    name: 'Engagement Master',
    description: 'Complete 10 tasks',
    icon: '💪',
    points: 100,
    requirements: { completedTasks: { gte: 10 } }
  },
  {
    id: 'referral-champion',
    name: 'Referral Champion',
    description: 'Refer 5 users successfully',
    icon: '🏆',
    points: 200,
    requirements: { referralCount: { gte: 5 } }
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 7-day login streak',
    icon: '🔥',
    points: 150,
    requirements: { streak: { gte: 7 } }
  }
] as const