import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/next-auth/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try{
     const userBonus  = await prisma.user.update({
        where:{id: session?.user.id},
        data:{
           receivedTwitterBonus: true 
        }
     })

      if(!userBonus){
        return NextResponse.json({message: "bonus failed",status: false})
      }
      return NextResponse.json({message: "bonus recieved", status:true})

  }catch(err){
     return NextResponse.json({message: `bonus failed ${err}`,status: false})
  }
   
}




export async function POST(req: NextRequest) {
 const {userId} = await req.json()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try{
     const userBonusStatus  = await prisma.user.findFirst({
        where:{id: userId},
        select:{
           receivedTwitterBonus: true 
        }
     })

      return NextResponse.json({userBonusStatus, status:true})

  }catch(err){
     return NextResponse.json({message: `bonus failed ${err}`,status: false})
  }
   
}