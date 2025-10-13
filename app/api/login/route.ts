import { NextRequest, NextResponse } from 'next/server'
import { serialize } from 'cookie'

const DEMO_USER = 'Fabricio'
const DEMO_PASS = 'Fabricio2025!'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === DEMO_USER && password === DEMO_PASS) {
      // Crear cookie de sesión
      const sessionCookie = serialize('session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/',
      })

      const response = NextResponse.json({ success: true })
      response.headers.set('Set-Cookie', sessionCookie)
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
