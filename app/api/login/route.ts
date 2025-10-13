import { NextRequest, NextResponse } from 'next/server'

const DEMO_USER = 'Fabricio'
const DEMO_PASS = 'Fabricio2025!'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === DEMO_USER && password === DEMO_PASS) {
      const response = NextResponse.json({ success: true })
      // Establecer cookie de sesión usando la API de Next
      response.cookies.set('session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
      return response
    } else {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
