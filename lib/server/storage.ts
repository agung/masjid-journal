'use server'

import { google } from 'googleapis'
import { Readable } from 'stream'

/**
 * Google Drive upload via Service Account.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   - service account email
 *   GOOGLE_SERVICE_ACCOUNT_KEY     - private key (base64-encoded full JSON key)
 *   GOOGLE_DRIVE_FOLDER_ID         - target folder ID in Google Drive
 */

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!email || !keyBase64 || !folderId) {
    throw new Error(
      'Google Drive env vars not set: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_DRIVE_FOLDER_ID'
    )
  }

  // Key is stored as base64-encoded full service account JSON
  const keyJson = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'))

  const auth = new google.auth.JWT({
    email,
    key: keyJson.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })

  return { drive: google.drive({ version: 'v3', auth }), folderId }
}

export interface UploadResult {
  fileId: string
  fileName: string
  webViewLink: string // link to view in browser (for proof display)
  webContentLink: string // direct download link
}

/**
 * Upload a file to Google Drive folder.
 * Returns file ID and public view link.
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
  const { drive, folderId } = getDriveClient()

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

  // Make file readable by anyone with link (so proof preview works)
  await drive.permissions.create({
    fileId: file.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  return {
    fileId: file.id,
    fileName: file.name ?? fileName,
    webViewLink: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
    webContentLink: file.webContentLink ?? `https://drive.google.com/uc?id=${file.id}`,
  }
}

/**
 * Delete a file from Google Drive by file ID.
 */
export async function deleteProofFromDrive(fileId: string): Promise<void> {
  const { drive } = getDriveClient()
  await drive.files.delete({ fileId })
}
