import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { parse } from 'cookie'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookies = parse(request.headers.get('cookie') || '')
    if (cookies.session !== 'authenticated') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const pagesString = formData.get('pages') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo PDF' },
        { status: 400 }
      )
    }

    if (!pagesString) {
      return NextResponse.json(
        { error: 'No se especificaron páginas' },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 50MB' },
        { status: 400 }
      )
    }

    // Parsear páginas
    let pages: number[]
    try {
      pages = JSON.parse(pagesString)
      if (!Array.isArray(pages) || pages.length === 0) {
        throw new Error('Páginas inválidas')
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Formato de páginas inválido' },
        { status: 400 }
      )
    }

    // Cargar PDF original
    const arrayBuffer = await file.arrayBuffer()
    const originalPdf = await PDFDocument.load(arrayBuffer)
    const totalPages = originalPdf.getPageCount()

    // Validar que las páginas estén en rango
    const invalidPages = pages.filter(page => page < 1 || page > totalPages)
    if (invalidPages.length > 0) {
      return NextResponse.json(
        { error: `Páginas fuera de rango: ${invalidPages.join(', ')}. El PDF tiene ${totalPages} páginas.` },
        { status: 400 }
      )
    }

    // Crear nuevo PDF con las páginas seleccionadas
    const newPdf = await PDFDocument.create()
    
    // Copiar páginas en el orden especificado
    for (const pageNum of pages) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]) // pdf-lib usa índice 0
      newPdf.addPage(copiedPage)
    }

    // Generar PDF final
    const pdfBytes = await newPdf.save()

    // Crear respuesta con el PDF
    const response = new NextResponse(pdfBytes)
    response.headers.set('Content-Type', 'application/pdf')
    response.headers.set('Content-Disposition', 'attachment; filename="paginas_extraidas.pdf"')
    response.headers.set('Content-Length', pdfBytes.length.toString())

    return response

  } catch (error) {
    console.error('Error procesando PDF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el PDF' },
      { status: 500 }
    )
  }
}
