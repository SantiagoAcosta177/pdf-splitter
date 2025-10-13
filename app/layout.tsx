import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF Splitter - Divide tus PDFs fácilmente',
  description: 'Aplicación web para dividir PDFs con interfaz intuitiva',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
