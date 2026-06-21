'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'

export interface ProofUploadResult {
  fileId: string
  webViewLink: string
  webContentLink: string
}

interface ProofUploadProps {
  onUploaded: (result: ProofUploadResult) => void
  onClear: () => void
}

export function ProofUpload({ onUploaded, onClear }: ProofUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)

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
      <label className="text-sm font-medium text-gray-700">
        Bukti Transaksi{' '}
        <span className="text-gray-400 font-normal">(opsional)</span>
      </label>

      {!preview ? (
        <label
          htmlFor="proof-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
        >
          <Camera size={28} className="text-gray-400 mb-1" />
          <span className="text-sm text-gray-500">Foto / pilih dari galeri</span>
          <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — maks 5MB</span>
          <input
            ref={inputRef}
            id="proof-file"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="relative rounded-xl overflow-hidden border">
          <div className="relative w-full aspect-[4/3]">
            <Image
              src={preview}
              alt="Preview bukti transaksi"
              fill
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
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-lg shadow"
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
