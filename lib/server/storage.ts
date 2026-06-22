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

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase Storage env vars not set: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    )
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
      webViewLink: signedData.signedUrl,
      webContentLink: signedData.signedUrl,
    }
  },

  async delete(fileId) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileId])
    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  },

  async getSignedUrl(storagePath) {
    if (!storagePath) return null

    try {
      const supabase = getSupabaseClient()
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

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Google Drive env var not set: ${name}`)
  }

  return value
}

function getGoogleDriveClient() {
  const clientId = getRequiredEnv('GOOGLE_DRIVE_CLIENT_ID')
  const clientSecret = getRequiredEnv('GOOGLE_DRIVE_CLIENT_SECRET')
  const refreshToken = getRequiredEnv('GOOGLE_DRIVE_REFRESH_TOKEN')
  const folderId = getRequiredEnv('GOOGLE_DRIVE_FOLDER_ID')

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
      webViewLink: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
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
    return `https://drive.google.com/file/d/${storagePath}/view`
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
