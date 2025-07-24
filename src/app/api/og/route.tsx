import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    const title = searchParams.get('title') || 'TweetXConnect - Connect Token Airdrop'
    const description = searchParams.get('description') || 'Earn CONNECT tokens through Twitter engagement'
    const type = searchParams.get('type') || 'default'
    const userPoints = searchParams.get('points')
    const userRank = searchParams.get('rank')

    // Define different templates based on type
    const getTemplate = () => {
      switch (type) {
        case 'leaderboard':
          return (
            <div tw="flex flex-col w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
              <div tw="flex flex-col justify-center items-center h-full px-20">
                <div tw="text-6xl font-bold mb-4">🏆 Connect Leaderboard</div>
                <div tw="text-3xl mb-8 text-center">{title}</div>
                <div tw="flex items-center text-2xl bg-white/10 px-8 py-4 rounded-2xl">
                  <span tw="mr-4">🪙</span>
                  Top CONNECT token earners
                </div>
              </div>
            </div>
          )
        
        case 'profile':
          return (
            <div tw="flex flex-col w-full h-full bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 text-white">
              <div tw="flex flex-col justify-center items-center h-full px-20">
                <div tw="text-6xl font-bold mb-4">👤 Profile</div>
                <div tw="text-3xl mb-8 text-center">{title}</div>
                {userPoints && (
                  <div tw="flex items-center text-2xl bg-white/10 px-8 py-4 rounded-2xl mb-4">
                    <span tw="mr-4">🪙</span>
                    {userPoints} CONNECT Earned
                  </div>
                )}
                {userRank && (
                  <div tw="flex items-center text-2xl bg-white/10 px-8 py-4 rounded-2xl">
                    <span tw="mr-4">🎯</span>
                    Rank #{userRank}
                  </div>
                )}
              </div>
            </div>
          )
        
        case 'tasks':
          return (
            <div tw="flex flex-col w-full h-full bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 text-white">
              <div tw="flex flex-col justify-center items-center h-full px-20">
                <div tw="text-6xl font-bold mb-4">🐦 Twitter Tasks</div>
                <div tw="text-3xl mb-8 text-center">{title}</div>
                <div tw="flex items-center text-2xl bg-white/10 px-8 py-4 rounded-2xl">
                  <span tw="mr-4">🪙</span>
                  Complete tasks, earn CONNECT tokens
                </div>
              </div>
            </div>
          )
        
        default:
          return (
            <div tw="flex flex-col w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
              <div tw="flex flex-col justify-center items-center h-full px-20">
                <div tw="text-7xl font-bold mb-6">🔗 TweetXConnect</div>
                <div tw="text-4xl font-bold mb-4 text-center">{title}</div>
                <div tw="text-2xl mb-8 text-center text-white/80 max-w-4xl">{description}</div>
                <div tw="flex items-center space-x-8">
                  <div tw="flex items-center text-xl bg-white/10 px-6 py-3 rounded-xl">
                    <span tw="mr-3">🔗</span>
                    Connect Wallet
                  </div>
                  <div tw="flex items-center text-xl bg-white/10 px-6 py-3 rounded-xl">
                    <span tw="mr-3">🐦</span>
                    Twitter Tasks
                  </div>
                  <div tw="flex items-center text-xl bg-white/10 px-6 py-3 rounded-xl">
                    <span tw="mr-3">🪙</span>
                    Earn CONNECT
                  </div>
                </div>
              </div>
            </div>
          )
      }
    }

    return new ImageResponse(
      getTemplate(),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
