<?php
/**
 * upload.php — Hostinger file upload endpoint
 *
 * Deploy this file to: public_html/uploads/upload.php
 *
 * Receives multipart/form-data POST requests from the React admin panel.
 * Authenticates via a shared secret token in the X-Upload-Token header.
 * Saves the file and returns its public URL as JSON.
 *
 * Required env / config (set UPLOAD_SECRET in an .htaccess or just change
 * the constant below before deploying):
 *   UPLOAD_SECRET  — must match VITE_HOSTINGER_UPLOAD_SECRET in your .env
 */

// ── Configuration ─────────────────────────────────────────────────────────────

// Change this to match VITE_HOSTINGER_UPLOAD_SECRET in your .env
// Or read from a server-side config file outside the webroot for extra safety
define('UPLOAD_SECRET', getenv('UPLOAD_SECRET') ?: 'KEY');

// The public base URL of your uploads directory
define('UPLOADS_BASE_URL', 'https://eruditeenglish.com/uploads');

// Absolute path to the uploads directory on disk
// On Hostinger: public_html/uploads/files/
define('UPLOADS_DIR', __DIR__ . '/files');

// Maximum file size: 200 MB
define('MAX_FILE_SIZE', 200 * 1024 * 1024);

// Allowed MIME types per bucket/folder
$ALLOWED_TYPES = [
    'materials'   => ['application/pdf'],
    'audio-files' => ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/ogg'],
    'books'       => ['application/pdf', 'application/epub+zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'answer-keys' => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'essay-images'=> ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
];

// ── CORS ──────────────────────────────────────────────────────────────────────

header('Access-Control-Allow-Origin: https://eruditeenglish.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Upload-Token, Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function jsonError(int $code, string $message): never {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

function jsonSuccess(array $data): never {
    http_response_code(200);
    echo json_encode($data);
    exit;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError(405, 'Method not allowed');
}

$token = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '';
if (!hash_equals(UPLOAD_SECRET, $token)) {
    jsonError(401, 'Unauthorized');
}

// ── Validate inputs ───────────────────────────────────────────────────────────

$bucket = trim($_POST['bucket'] ?? '');
$path   = trim($_POST['path']   ?? '');

if (!$bucket || !$path) {
    jsonError(400, 'Missing bucket or path');
}

// Sanitize path — prevent directory traversal
$path = ltrim($path, '/');
if (preg_match('/\.\./', $path)) {
    jsonError(400, 'Invalid path');
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $uploadError = $_FILES['file']['error'] ?? 'no file';
    jsonError(400, "File upload error: $uploadError");
}

$file     = $_FILES['file'];
$fileSize = $file['size'];
$tmpPath  = $file['tmp_name'];

if ($fileSize > MAX_FILE_SIZE) {
    jsonError(413, 'File too large (max 200 MB)');
}

// ── MIME validation ───────────────────────────────────────────────────────────

global $ALLOWED_TYPES;
if (!isset($ALLOWED_TYPES[$bucket])) {
    jsonError(400, "Unknown bucket: $bucket");
}

// Use finfo for reliable MIME detection (not trusting client-reported type)
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($tmpPath);

if (!in_array($mimeType, $ALLOWED_TYPES[$bucket], true)) {
    jsonError(415, "File type not allowed for bucket '$bucket': $mimeType");
}

// ── Save file ─────────────────────────────────────────────────────────────────

$destPath = UPLOADS_DIR . '/' . $bucket . '/' . $path;
$destDir  = dirname($destPath);

if (!is_dir($destDir)) {
    if (!mkdir($destDir, 0755, true)) {
        jsonError(500, 'Failed to create upload directory');
    }
}

if (!move_uploaded_file($tmpPath, $destPath)) {
    jsonError(500, 'Failed to save file');
}

$publicUrl = UPLOADS_BASE_URL . '/' . $bucket . '/' . $path;

jsonSuccess([
    'url'  => $publicUrl,
    'path' => $bucket . '/' . $path,
]);
