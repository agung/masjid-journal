'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, FileText, Loader2 } from 'lucide-react'

export interface ProofUploadResult {
  file: File
}

interface ProofUploadProps {
  onUploaded: (result: ProofUploadResult) => void
  onClear: () => void
  initialPreview?: string | null
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const MAX_PHOTO_BYTES = 1 * 1024 * 1024
const DOCUMENT_TYPES = new Set([
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/rtf', 'text/rtf',
])
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'])

function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isHeic(file: File) {
  return /\.(heic|heif)$/i.test(file.name) || ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'].includes(file.type.toLowerCase())
}

function isDocument(file: File) {
  return DOCUMENT_TYPES.has(file.type.toLowerCase()) || DOCUMENT_EXTENSIONS.has(extensionOf(file.name))
}

/** Decode to WebP in the browser; HEIC/HEIF is first converted using libheif WASM. */
async function compressImage(file: File): Promise<Blob> {
  let source: Blob = file
  if (isHeic(file)) {
    const { heicTo } = await import('heic-to/csp')
    source = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
  }

  const url = URL.createObjectURL(source)
  try {
    const img = document.createElement('img')
    img.src = url
    await img.decode()
    const maxDimension = 2048
    let scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas tidak tersedia')
    for (let resizeAttempt = 0; resizeAttempt < 7; resizeAttempt++) {
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.82, 0.72, 0.62, 0.52]) {
        const result = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
        if (!result) throw new Error('Konversi foto gagal')
        if (result.size <= MAX_PHOTO_BYTES) return result
      }
      scale *= 0.8
    }
    throw new Error('Foto terlalu besar setelah dikompres')
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function ProofUpload({ onUploaded, onClear, initialPreview }: ProofUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null)
  const [previewIsDocument, setPreviewIsDocument] = useState(() => !!initialPreview && DOCUMENT_EXTENSIONS.has(extensionOf(initialPreview.split('?')[0])) )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrl = useRef<string | null>(null)

  useEffect(() => () => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current)
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (file.size > MAX_SIZE_BYTES) {
      setError('Ukuran file maksimal 10 MB.')
      e.target.value = ''
      return
    }
    const document = isDocument(file)
    const looksLikeImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.name)
    if (!document && !looksLikeImage) {
      setError('Format belum didukung. Pilih foto, PDF, Word, Excel, PowerPoint, TXT, CSV, atau RTF.')
      e.target.value = ''
      return
    }

    const localUrl = URL.createObjectURL(file)
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current)
    previewObjectUrl.current = localUrl
    setPreview(localUrl)
    setPreviewIsDocument(document)
    setUploading(true)
    try {
      if (document) {
        onUploaded({ file })
      } else {
        const compressed = await compressImage(file)
        onUploaded({ file: new File([compressed], 'bukti.webp', { type: 'image/webp' }) })
        // Preview the converted image so HEIC works even in browsers without HEIC support.
        URL.revokeObjectURL(localUrl)
        const convertedUrl = URL.createObjectURL(compressed)
        previewObjectUrl.current = convertedUrl
        setPreview(convertedUrl)
      }
    } catch {
      URL.revokeObjectURL(localUrl)
      previewObjectUrl.current = null
      setError('Foto tidak dapat diproses. Coba simpan ulang sebagai JPEG atau pilih file lain.')
      setPreview(null)
      e.target.value = ''
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current)
    previewObjectUrl.current = null
    setPreview(null)
    setPreviewIsDocument(false)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Bukti Transaksi <span className="text-gray-400 font-normal dark:text-gray-500">(opsional)</span>
      </label>
      {!preview ? (
        <label htmlFor="proof-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 dark:hover:border-green-500 dark:hover:bg-green-950/30 transition-colors">
          <Camera size={28} className="text-gray-400 mb-1 dark:text-gray-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Foto atau pilih dokumen</span>
          <span className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">Foto dikompres maks 1 MB · Dokumen maks 10 MB</span>
          <input ref={inputRef} id="proof-file" type="file" accept="image/*,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf" className="sr-only" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="relative rounded-xl overflow-hidden border">
          {previewIsDocument ? (
            <div className="min-h-28 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900">
              <FileText size={32} className="shrink-0 text-green-600" />
              <div className="min-w-0"><p className="font-medium text-sm truncate">{preview.startsWith('blob:') ? inputRef.current?.files?.[0]?.name ?? 'Dokumen bukti' : 'Dokumen bukti transaksi'}</p><p className="text-xs text-gray-500 uppercase">{extensionOf(preview.split('?')[0]) || 'Dokumen'}</p></div>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] bg-gray-50 dark:bg-gray-900"><Image src={preview} alt="Preview bukti transaksi" fill unoptimized className="object-contain" /></div>
          )}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-sm font-medium flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Memproses...</div></div>}
          {!uploading && <button type="button" onClick={handleClear} className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-lg shadow dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300">Ganti</button>}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
