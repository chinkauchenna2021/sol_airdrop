# Solana Airdrop Platform

A comprehensive Web3 platform for managing token airdrops on Solana with Twitter integration for social engagement tracking.

## Features

- 🔐 **Wallet Integration** - Connect Solana wallets (Phantom, Solflare, etc.)
- 🐦 **Twitter Integration** - Track likes, retweets, comments, and follows
- 🏆 **Leaderboard System** - Real-time rankings based on engagement
- 💰 **Token Claims** - Automated token distribution based on points
- 📊 **Analytics Dashboard** - Track user growth and engagement metrics
- 👨‍💼 **Admin Panel** - Manage users, tasks, and platform settings
- 🎯 **Task System** - Custom tasks and challenges for users
- 🔗 **Referral Program** - Bonus points for bringing new users

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Solana Web3.js, SPL Token
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Solana wallet with SOL/tokens for airdrops
- Twitter Developer Account (for API access)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solana-airdrop-platform.git
cd solana-airdrop-platform
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with your credentials

5. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

6. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for JWT signing
- `SOLANA_PRIVATE_KEY` - Private key for airdrop wallet
- `TWITTER_BEARER_TOKEN` - Twitter API bearer token
- `NEXT_PUBLIC_TOKEN_MINT_ADDRESS` - SPL token mint address

### Optional Variables

- `REDIS_URL` - Redis connection for caching
- `ADMIN_WALLETS` - Comma-separated admin wallet addresses
- `CLAIMS_ENABLED` - Enable/disable token claims

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions
├── store/           # Zustand stores
├── hooks/           # Custom React hooks
└── styles/          # Global styles
```

## API Routes

- `/api/auth/wallet` - Wallet authentication
- `/api/twitter/*` - Twitter integration endpoints
- `/api/solana/*` - Blockchain operations
- `/api/leaderboard` - Leaderboard data
- `/api/claims/*` - Token claim endpoints
- `/api/admin/*` - Admin operations

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
docker-compose up -d
```

## Security Considerations

- Never expose private keys in client code
- Implement rate limiting on API routes
- Validate all user inputs
- Use secure wallet connections
- Regular security audits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@yourplatform.com or join our Discord server.