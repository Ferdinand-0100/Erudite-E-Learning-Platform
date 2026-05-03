/**
 * videoUrl.js
 * Utilities for normalising video embed URLs.
 * Supports YouTube and Google Drive share links.
 */

/**
 * Extracts the Google Drive file ID from any Drive URL format.
 * Handles:
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 *
 * @param {string} url
 * @returns {string|null} file ID or null
 */
export function extractDriveFileId(url) {
  if (!url) return null

  // /file/d/FILE_ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]

  // ?id=FILE_ID or &id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]

  return null
}

/**
 * Converts a Google Drive share URL to an embeddable preview URL.
 * Returns null if the URL is not a recognisable Drive link.
 *
 * @param {string} url
 * @returns {string|null}
 */
export function driveToEmbedUrl(url) {
  const id = extractDriveFileId(url)
  if (!id) return null
  return `https://drive.google.com/file/d/${id}/preview`
}

/**
 * Detects the video source type from a URL.
 * @param {string} url
 * @returns {'youtube'|'drive'|'embed'|'unknown'}
 */
export function detectVideoSource(url) {
  if (!url) return 'unknown'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('drive.google.com')) return 'drive'
  if (url.includes('/embed/') || url.includes('/preview')) return 'embed'
  return 'unknown'
}

/**
 * Normalises any supported video URL to a final embed URL.
 * - YouTube watch URLs → embed URL
 * - Google Drive share URLs → preview URL
 * - Already-embed URLs → returned as-is
 *
 * @param {string} url
 * @returns {string} embed-ready URL
 */
export function normaliseVideoUrl(url) {
  if (!url) return url

  const source = detectVideoSource(url)

  if (source === 'drive') {
    return driveToEmbedUrl(url) ?? url
  }

  if (source === 'youtube') {
    // Convert watch URL to embed
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  }

  return url
}
