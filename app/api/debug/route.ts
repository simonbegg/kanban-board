import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔥 DEBUG ENDPOINT HIT!', new Date().toISOString())
  
  const body = await request.json().catch(() => ({}))
  console.log('Request body:', body)
  
  const headers = Object.fromEntries(request.headers.entries())
  console.log('Request headers:', headers)
  
  return NextResponse.json({ 
    message: 'Debug endpoint working!',
    timestamp: new Date().toISOString(),
    receivedHeaders: headers,
    receivedBody: body
  })
}
