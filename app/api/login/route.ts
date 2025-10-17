import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const providedUsername = typeof username === 'string' ? username.trim() : ''
    const providedPassword = typeof password === 'string' ? password : ''

    if (!providedUsername || !providedPassword) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const expectedPassword = `${providedUsername}2025!`

    if (providedPassword === expectedPassword) {
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
    }

    return NextResponse.json(
      { error: 'Credenciales incorrectas' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
