// import { auth } from "@/lib/better-auth-enhanced"
// import { toNextJsHandler } from "better-auth/next-js"
// import { NextRequest, NextResponse } from "next/server"
// // import { auth } from "@/lib/better-auth"
// // import { toNextJsHandler } from "better-auth/next-js"
// // import { NextRequest, NextResponse } from "next/server"
//  const { GET: authGET, POST: authPOST } = toNextJsHandler(auth)

// export async function GET(request: NextRequest) {
//   try {
//     return await authGET(request)
//   } catch (error) {
//     console.error('Better Auth GET error:', error)
//     return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     return await authPOST(request)
//   } catch (error) {
//     console.error('Better Auth POST error:', error)
//     return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
//   }
// }

// // Optional: Add custom error handling
// export async function PATCH(request: Request) {
//   try {
//     // Handle any custom PATCH requests if needed
//     return new Response(JSON.stringify({ error: 'Method not allowed' }), {
//       status: 405,
//       headers: { 'Content-Type': 'application/json' }
//     })
//   } catch (error) {
//     console.error('Auth PATCH error:', error)
//     return new Response(JSON.stringify({ error: 'Internal server error' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     })
//   }
// }


import { auth } from "@/lib/better-auth-enhanced"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth)

export async function GET(request: NextRequest) {
  try {
    console.log('Processing GET request for auth endpoint')
    return await authGET(request)
  } catch (error) {
    console.error('Better Auth GET error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Processing POST request for auth endpoint')
    return await authPOST(request)
  } catch (error) {
    console.error('Better Auth POST error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    console.log('Processing PATCH request for auth endpoint')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Auth PATCH error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}