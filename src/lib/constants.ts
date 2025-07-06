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