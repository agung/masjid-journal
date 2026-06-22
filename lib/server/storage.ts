'use server'

import { google } from 'googleapis'
import { Readable } from 'stream'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// Shared types
// ============================================================

export interface UploadResult {
  fileId: string
  fileName: string
  webViewLink: string
  webContentLink: string
}

export interface StorageProvider {
  upload(buffer: Buffer, mimeType: string, fileName: string): Promise<UploadResult>
  delete(fileId: string): Promise<void>
  getSignedUrl(storagePath: string | null): Promise<string | null>
}

// ============================================================
// Provider: Supabase Storage
// ============================================================

const BUCKET_NAME = 'bukti-transaksi'

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient(): ReturnType<typeof createClient> | null {
  if (supabaseClient) return supabaseClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.warn(
      'Supabase Storage env vars not set: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    )
    return null
  }

  supabaseClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseClient
}

const supabaseProvider: StorageProvider = {
  async upload(buffer, mimeType, fileName) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error(
        'Supabase Storage not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      )
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Permanent public URL (bucket must be public — set once in Supabase dashboard)
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    // Short-lived signed URL (60s) for immediate display
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60)

    if (signedError || !signedData?.signedUrl) {
      try {
        await supabase.storage.from(BUCKET_NAME).remove([fileName])
      } catch (cleanupErr) {
        console.error('[upload-proof] Failed to clean up after signed URL error', cleanupErr)
      }

      throw new Error(`Failed to generate signed URL: ${signedError?.message ?? 'unknown'}`)
    }

    return {
      fileId: fileName,
      fileName,
      webViewLink: publicUrlData.publicUrl, // permanent URL — stored as proofPublicUrl
      webContentLink: signedData.signedUrl,  // short-lived signed URL
    }
  },

  async delete(fileId) {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase Storage not configured')
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileId])
    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  },

  async getSignedUrl(storagePath) {
    if (!storagePath) return null

    try {
      const supabase = getSupabaseClient()
      if (!supabase) return null

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 60)

      if (error || !data?.signedUrl) {
        console.error('[getProofSignedUrl]', error)
        return null
      }

      return data.signedUrl
    } catch (err) {
      console.error('[getProofSignedUrl]', err)
      return null
    }
  },
}

// ============================================================
// Provider: Google Drive OAuth
// ============================================================

function getEnvWithFallback(name: string, fallbackName?: string) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined)

  if (!value) {
    throw new Error(
      `Google Drive env var not set: ${name}${fallbackName ? ` or ${fallbackName}` : ''}`
    )
  }

  return value
}

function getGoogleDriveClient() {
  const clientId = getEnvWithFallback('GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_CLIENT_ID')
  const clientSecret = getEnvWithFallback('GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET')
  const refreshToken = getEnvWithFallback('GOOGLE_DRIVE_REFRESH_TOKEN')
  const folderId = getEnvWithFallback('GOOGLE_DRIVE_FOLDER_ID')

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })

  return { drive: google.drive({ version: 'v3', auth }), folderId }
}

const googleDriveProvider: StorageProvider = {
  async upload(buffer, mimeType, fileName) {
    const { drive, folderId } = getGoogleDriveClient()
    const stream = Readable.from(buffer)

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id,name,webViewLink,webContentLink',
    })

    const file = response.data
    if (!file.id) throw new Error('Upload failed: no file ID returned')

    try {
      await drive.permissions.create({
        fileId: file.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })
    } catch (err) {
      try {
        await drive.files.delete({ fileId: file.id })
      } catch (cleanupErr) {
        console.error('[upload-proof] Failed to clean up uploaded file after permission error', cleanupErr)
      }

      throw err
    }

    return {
      fileId: file.id,
      fileName: file.name ?? fileName,
      webViewLink: `https://drive.google.com/uc?export=view&id=${file.id}`,
      webContentLink: file.webContentLink ?? `https://drive.google.com/uc?id=${file.id}`,
    }
  },

  async delete(fileId) {
    const { drive } = getGoogleDriveClient()
    await drive.files.delete({ fileId })
  },

  async getSignedUrl(storagePath) {
    // Google Drive URLs are permanent (file is public via "anyone" permission)
    if (!storagePath) return null
    // Use direct download URL so the image can be embedded in <img> tags
    return `https://drive.google.com/uc?export=view&id=${storagePath}`
  },
}

// ============================================================
// Provider selection via STORAGE_PROVIDER env var
// ============================================================

function getProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? 'supabase'

  switch (provider) {
    case 'google_drive':
      return googleDriveProvider
    case 'supabase':
      return supabaseProvider
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER: ${provider}. Use "supabase" or "google_drive".`
      )
  }
}

// ============================================================
// Public API (same interface regardless of provider)
// ============================================================

/**
 * Upload a file to the active storage provider.
 * Returns file ID, name, and signed/preview URLs.
 */
export async function uploadProofToDrive({
  buffer,
  mimeType,
  fileName,
}: {
  buffer: Buffer
  mimeType: string
  fileName: string
}): Promise<UploadResult> {
  return getProvider().upload(buffer, mimeType, fileName)
}

/**
 * Delete a file from the active storage provider.
 */
export async function deleteProofFromDrive(fileId: string): Promise<void> {
  return getProvider().delete(fileId)
}

/**
 * Generate a signed URL (or permanent URL, depending on provider)
 * for a previously stored file.
 *
 * - Supabase: returns a fresh signed URL with 60s expiry
 * - Google Drive: returns the permanent public view URL
 */
export async function getProofSignedUrl(
  storagePath: string | null
): Promise<string | null> {
  return getProvider().getSignedUrl(storagePath)
}
