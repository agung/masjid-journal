'use client'

import { useState, useRef } from 'react'
import NextImage from 'next/image'
import { Camera, Loader2 } from 'lucide-react'

export interface ProofUploadResult {
  fileId: string
  webViewLink: string
  webContentLink: string
}

interface ProofUploadProps {
  onUploaded: (result: ProofUploadResult) => void
  onClear: () => void
  initialPreview?: string | null
}

/**
 * Compress an image file client-side using Canvas API.
 * Preserves original resolution but re-encodes as WebP (quality 0.85)
 * to significantly reduce file size.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      // Clean up the object URL
      URL.revokeObjectURL(img.src)

      const canvas = document.createElement('canvas')

      // Preserve original resolution — don't resize
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Convert to WebP at quality 0.85
      // This reduces file size 50-70% with minimal visual loss
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Compress failed'))
        },
        'image/webp',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
  })
}

export function ProofUpload({ onUploaded, onClear, initialPreview }: ProofUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Show local preview immediately (original file for speed)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      // Compress image client-side before upload
      const compressed = await compressImage(file)
      const compressedFile = new File([compressed], 'bukti.webp', { type: 'image/webp' })

      const fd = new FormData()
      fd.append('file', compressedFile)

      const res = await fetch('/api/upload-proof', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload gagal')
        setPreview(null)
        return
      }

      onUploaded(data as ProofUploadResult)
    } catch {
      setError('Upload gagal. Periksa koneksi internet.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Bukti Transaksi{' '}
        <span className="text-gray-400 font-normal dark:text-gray-500">(opsional)</span>
      </label>

      {!preview ? (
        <label
          htmlFor="proof-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 dark:hover:border-green-500 dark:hover:bg-green-950/30 transition-colors"
        >
          <Camera size={28} className="text-gray-400 mb-1 dark:text-gray-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Foto / pilih dari galeri</span>
          <span className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">JPG, PNG, WebP — maks 5MB</span>
          <input
            ref={inputRef}
            id="proof-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="relative rounded-xl overflow-hidden border">
          <div className="relative w-full aspect-[4/3]">
            <NextImage
              src={preview}
              alt="Preview bukti transaksi"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          {/* Overlay while uploading */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-sm font-medium flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Mengupload...</div>
            </div>
          )}

          {/* Clear button */}
          {!uploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-lg shadow dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300"
            >
              Ganti
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
