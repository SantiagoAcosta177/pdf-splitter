import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'cookie'

export async function GET(request: NextRequest) {
  try {
    const cookies = parse(request.headers.get('cookie') || '')
    
    if (cookies.session === 'authenticated') {
      return NextResponse.json({ authenticated: true })
    } else {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}
