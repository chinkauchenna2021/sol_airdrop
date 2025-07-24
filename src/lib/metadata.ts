export const siteConfig = {
  name: "TweetXConnect",
  description: "Official platform for the Connect token airdrop. Earn CONNECT tokens by engaging on Twitter, connecting your Solana wallet, and completing social tasks.",
  url: "https://tweetxconnect.app", // Replace with your actual domain
  ogImage: "https://tweetxconnect.com/images/logo/sol_logo.jpg", // Replace with your OG image
  creator: "@TweetXConnect", // Replace with your Twitter handle
  keywords: [
    "connect token",
    "connect airdrop", 
    "tweetxconnect",
    "solana airdrop",
    "twitter airdrop",
    "connect crypto",
    "social token",
    "web3 social",
    "crypto rewards",
    "twitter engagement",
    "solana wallet",
    "free crypto",
    "token distribution",
    "defi airdrop",
    "blockchain rewards",
    "connect token claim"
  ]
}

// Generate metadata for Next.js 13+ app directory
export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
  ...rest
}: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
  [key: string]: any
}) {
  const metadata = {
    title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
    description: description || siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    
    // Open Graph
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
      description: description || siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: image || siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    
    // Twitter
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
      description: description || siteConfig.description,
      images: [image || siteConfig.ogImage],
      creator: siteConfig.creator,
    },
    
    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    
    // Additional metadata
    category: "cryptocurrency",
    ...rest,
  }

  return metadata
}

// Page-specific metadata configurations
export const pageMetadata = {
  home: {
    title: "TweetXConnect - Official Connect Token Airdrop Platform",
    description: "Join the Connect token airdrop! Earn CONNECT tokens by engaging on Twitter, connecting your Solana wallet, and completing social tasks. Free crypto rewards for active participants.",
    keywords: "connect token airdrop, tweetxconnect, free connect tokens, twitter crypto rewards, solana airdrop platform"
  },
  
  leaderboard: {
    title: "Leaderboard - Top Connect Token Earners",
    description: "Check the live leaderboard of top Connect token earners on TweetXConnect. See who's leading the airdrop campaign and earning the most CONNECT rewards.",
    keywords: "connect token leaderboard, airdrop rankings, tweetxconnect rankings, top connect earners"
  },
  
  tasks: {
    title: "Tasks & Challenges - Earn Connect Tokens",
    description: "Complete Twitter tasks and social challenges to maximize your Connect token rewards. Follow accounts, like tweets, retweet content, and unlock bonus CONNECT tokens.",
    keywords: "connect token tasks, twitter challenges, social media rewards, connect airdrop missions"
  },
  
  profile: {
    title: "Your Profile - Connect Token Progress",
    description: "Track your Connect token airdrop progress, view claimed CONNECT rewards, referral stats, and achievement unlocks. Manage your connected Solana wallet and Twitter account.",
    keywords: "connect token profile, airdrop dashboard, connect rewards tracking, wallet management"
  },
  
  admin: {
    title: "Admin Dashboard - TweetXConnect",
    description: "Administrative panel for managing the Connect token airdrop platform.",
    noIndex: true
  }
}

// Structured data for rich snippets
export function generateStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": siteConfig.name,
    "description": siteConfig.description,
    "url": siteConfig.url,
    "applicationCategory": "DeFi",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free Connect token airdrop for social engagement"
    },
    "featureList": [
      "Connect token airdrop participation",
      "Twitter engagement tracking and rewards", 
      "Solana wallet integration",
      "Automated CONNECT token distribution",
      "Real-time leaderboards and rankings",
      "Social task completion system",
      "Referral bonus program"
    ],
    "screenshot": siteConfig.ogImage,
    "author": {
      "@type": "Organization",
      "name": "TweetXConnect"
    },
    "keywords": "Connect token, airdrop, Twitter rewards, Solana, cryptocurrency, social engagement",
    "category": "Cryptocurrency Airdrop Platform"
  }
}