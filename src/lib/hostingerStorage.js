/**
 * hostingerStorage.js
 *
 * Drop-in replacement for Supabase storage calls.
 * Uploads and deletes files via the PHP endpoints on Hostinger.
 *
 * Usage mirrors the old Supabase pattern:
 *
 *   // Upload
 *   const { publicUrl, error } = await uploadFile('materials', path, file)
 *
 *   // Delete
 *   const { error } = await deleteFile('materials', path)
 *
 * The PHP endpoints live at:
 *   https://eruditeenglish.com/uploads/upload.php
 *   https://eruditeenglish.com/uploads/delete.php
 */

const UPLOAD_ENDPOINT = 'https://eruditeenglish.com/uploads/upload.php'
const DELETE_ENDPOINT = 'https://eruditeenglish.com/uploads/delete.php'
const UPLOADS_BASE_URL = 'https://eruditeenglish.com/uploads/files'

// Secret token set in .env as VITE_HOSTINGER_UPLOAD_SECRET
// Must match the UPLOAD_SECRET constant in upload.php and delete.php
const SECRET = import.meta.env.VITE_HOSTINGER_UPLOAD_SECRET

if (!SECRET) {
  console.error(
    '[hostingerStorage] VITE_HOSTINGER_UPLOAD_SECRET is not set. ' +
    'Add it to your .env file.'
  )
}

/**
 * Uploads a file to Hostinger.
 *
 * @param {string} bucket  - e.g. 'materials', 'audio-files', 'books', 'answer-keys', 'essay-images'
 * @param {string} path    - relative path within the bucket, e.g. 'english_ielts/1234_file.pdf'
 * @param {File}   file    - the File object from an <input type="file">
 * @returns {{ publicUrl: string|null, error: string|null }}
 */
export async function uploadFile(bucket, path, file) {
  const formData = new FormData()
  formData.append('bucket', bucket)
  formData.append('path', path)
  formData.append('file', file)

  try {
    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: { 'X-Upload-Token': SECRET },
      body: formData,
    })

    const json = await res.json()

    if (!res.ok) {
      return { publicUrl: null, error: json.error ?? `Upload failed (${res.status})` }
    }

    return { publicUrl: json.url, error: null }
  } catch (err) {
    return { publicUrl: null, error: err.message ?? 'Network error during upload' }
  }
}

/**
 * Deletes a file from Hostinger.
 *
 * @param {string} bucket  - e.g. 'materials'
 * @param {string} path    - the path within the bucket (no leading slash)
 * @returns {{ error: string|null }}
 */
export async function deleteFile(bucket, path) {
  const fullPath = `${bucket}/${path}`

  try {
    const res = await fetch(DELETE_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Upload-Token': SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: fullPath }),
    })

    const json = await res.json()

    if (!res.ok) {
      return { error: json.error ?? `Delete failed (${res.status})` }
    }

    return { error: null }
  } catch (err) {
    return { error: err.message ?? 'Network error during delete' }
  }
}

/**
 * Extracts the storage path (bucket/subfolder/filename) from a Hostinger public URL.
 * Returns null if the URL is not a Hostinger uploads URL (e.g. old Supabase URLs).
 *
 * @param {string} url
 * @param {string} bucket
 * @returns {string|null}
 */
export function storagePathFromUrl(url, bucket) {
  if (!url) return null

  // New Hostinger URL format
  const hostingerMarker = `${UPLOADS_BASE_URL}/${bucket}/`
  if (url.startsWith(hostingerMarker)) {
    return url.slice(hostingerMarker.length)
  }

  // Old Supabase URL format — return null so callers skip deletion gracefully
  if (url.includes('supabase.co')) {
    return null
  }

  return null
}

/**
 * Builds the public URL for a given bucket + path.
 * Useful if you need the URL before uploading (not typically needed).
 *
 * @param {string} bucket
 * @param {string} path
 * @returns {string}
 */
export function getPublicUrl(bucket, path) {
  return `${UPLOADS_BASE_URL}/${bucket}/${path}`
}
