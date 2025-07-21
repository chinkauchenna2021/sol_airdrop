import { NextRequest, NextResponse } from 'next/server'
import { batchUpdateActivityLevels, handleTwitterWebhook } from '@/lib/twitter-enhanced'
import crypto from 'crypto'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-twitter-webhooks-signature')

    // Verify webhook signature
    if (!verifyTwitterSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const webhookData = JSON.parse(body)

    // Handle the webhook data
    await handleTwitterWebhook(webhookData)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Twitter webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

function verifyTwitterSignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.TWITTER_WEBHOOK_SECRET) return false

  const expectedSignature = crypto
    .createHmac('sha256', process.env.TWITTER_WEBHOOK_SECRET)
    .update(body)
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(expectedSignature)
  )
}

