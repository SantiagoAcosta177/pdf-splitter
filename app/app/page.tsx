'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as pdfjsLib from 'pdfjs-dist'
import { saveAs } from 'file-saver'

// Configurar worker de PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

interface PDFPage {
  pageNumber: number
  canvas: HTMLCanvasElement
  blob?: Blob
}

export default function AppPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPages, setPdfPages] = useState<PDFPage[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [ranges, setRanges] = useState<Array<{from: number, to: number}>>([{from: 1, to: 1}])
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación
    fetch('/api/me')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          router.push('/')
        }
      })
      .catch(() => {
        router.push('/')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = () => {
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/')
  }

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('Por favor selecciona un archivo PDF válido', 'error')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      showToast('El archivo es demasiado grande. Máximo 50MB', 'error')
      return
    }

    setPdfFile(file)
    setSelectedPages(new Set())
    setRanges([{from: 1, to: 1}])
    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      const pages: PDFPage[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 0.5 })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        pages.push({
          pageNumber: i,
          canvas,
        })
      }

      setPdfPages(pages)
      showToast(`PDF cargado exitosamente. ${pdf.numPages} páginas encontradas.`, 'success')
    } catch (error) {
      showToast('Error al procesar el PDF', 'error')
      console.error('Error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const togglePageSelection = (pageNumber: number) => {
    const newSelected = new Set(selectedPages)
    if (newSelected.has(pageNumber)) {
      newSelected.delete(pageNumber)
    } else {
      newSelected.add(pageNumber)
    }
    setSelectedPages(newSelected)
  }

  const addRange = () => {
    setRanges([...ranges, {from: 1, to: 1}])
  }

  const removeRange = (index: number) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((_, i) => i !== index))
    }
  }

  const updateRange = (index: number, field: 'from' | 'to', value: number) => {
    const newRanges = [...ranges]
    newRanges[index] = { ...newRanges[index], [field]: value }
    setRanges(newRanges)
  }

  const applyRangeSelection = () => {
    const pages: number[] = []
    
    for (const range of ranges) {
      if (range.from && range.to && range.from <= range.to) {
        for (let i = range.from; i <= range.to; i++) {
          if (i <= pdfPages.length) {
            pages.push(i)
          }
        }
      }
    }
    
    const uniquePages = [...new Set(pages)]
    setSelectedPages(new Set(uniquePages))
    if (uniquePages.length > 0) {
      showToast(`${uniquePages.length} páginas seleccionadas`, 'success')
    }
  }

  const handleSplit = async () => {
    if (!pdfFile || selectedPages.size === 0) {
      showToast('Por favor selecciona al menos una página', 'error')
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      formData.append('pages', JSON.stringify(Array.from(selectedPages).sort((a, b) => a - b)))

      const response = await fetch('/api/split', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        saveAs(blob, 'paginas_extraidas.pdf')
        showToast('PDF generado y descargado exitosamente', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Error al procesar el PDF', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
      console.error('Error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">PDF Splitter</h1>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <div className="mb-8">
          <div
            className={`drop-zone border-2 border-dashed rounded-lg p-8 text-center ${
              dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arrastra tu PDF aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Máximo 50MB
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Seleccionar Archivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0])
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Range Input */}
        {pdfPages.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Selección por Rangos</h3>
              <button
                onClick={addRange}
                className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                + Añadir Rango
              </button>
            </div>
            
            <div className="space-y-4">
              {ranges.map((range, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Rango {index + 1}:</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">De la página</label>
                    <div className="flex items-center">
                      <button
                        onClick={() => updateRange(index, 'from', Math.max(1, range.from - 1))}
                        className="px-2 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={range.from <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={pdfPages.length}
                        value={range.from}
                        onChange={(e) => updateRange(index, 'from', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => updateRange(index, 'from', Math.min(pdfPages.length, range.from + 1))}
                        className="px-2 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={range.from >= pdfPages.length}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">a</label>
                    <div className="flex items-center">
                      <button
                        onClick={() => updateRange(index, 'to', Math.max(1, range.to - 1))}
                        className="px-2 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={range.to <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={pdfPages.length}
                        value={range.to}
                        onChange={(e) => updateRange(index, 'to', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => updateRange(index, 'to', Math.min(pdfPages.length, range.to + 1))}
                        className="px-2 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={range.to >= pdfPages.length}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {ranges.length > 1 && (
                    <button
                      onClick={() => removeRange(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Eliminar rango"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">
                Seleccionadas: {selectedPages.size} de {pdfPages.length} páginas
              </p>
              <button
                onClick={applyRangeSelection}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Aplicar Rangos
              </button>
            </div>
          </div>
        )}

        {/* PDF Pages */}
        {pdfPages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Páginas del PDF</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pdfPages.map((page) => (
                <div
                  key={page.pageNumber}
                  className={`pdf-thumbnail border rounded-lg p-2 ${
                    selectedPages.has(page.pageNumber) ? 'selected' : ''
                  }`}
                  onClick={() => togglePageSelection(page.pageNumber)}
                >
                  <div className="text-center">
                    <div className="bg-gray-100 rounded mb-2 overflow-hidden">
                      <img
                        src={page.canvas.toDataURL()}
                        alt={`Página ${page.pageNumber}`}
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Página {page.pageNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {selectedPages.size > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Páginas Seleccionadas: {selectedPages.size}
                </h3>
                <p className="text-sm text-gray-500">
                  {Array.from(selectedPages).sort((a, b) => a - b).join(', ')}
                </p>
              </div>
              <button
                onClick={handleSplit}
                disabled={isProcessing}
                className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Procesando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Procesando PDF...</p>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}
