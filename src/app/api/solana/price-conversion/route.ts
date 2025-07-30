import { NextRequest, NextResponse } from 'next/server'
import { getSolAmountForUsd } from '@/utils'

export async function POST(req: NextRequest) {
  try {
    const { usdAmount } = await req.json()

    if (!usdAmount || usdAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid USD amount is required' },
        { status: 400 }
      )
    }

    const result = await getSolAmountForUsd(usdAmount)

    return NextResponse.json({
      usdAmount,
      solAmount: result.solAmount,
      solPrice: result.solPrice,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Price conversion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to convert price' },
      { status: 500 }
    )
  }
}
