import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value
    if (session === 'authenticated') {
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
