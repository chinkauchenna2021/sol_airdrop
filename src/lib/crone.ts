import prisma from "./prisma"
import { batchUpdateActivityLevels } from "./twitter-enhanced"

// Cron job for periodic Twitter sync
export async function scheduledTwitterSync(): Promise<void> {
  console.log('Starting scheduled Twitter sync...')
  
  try {
    const result = await batchUpdateActivityLevels()
    console.log(`Twitter sync completed: ${result.updated}/${result.total} users updated`)
    
    // Log to analytics
    await prisma.analytics.create({
      data: {
        date: new Date(),
        metadata: {
          type: 'twitter_sync',
          updated: result.updated,
          total: result.total
        }
      }
    })
    
  } catch (error) {
    console.error('Scheduled Twitter sync failed:', error)
  }
}