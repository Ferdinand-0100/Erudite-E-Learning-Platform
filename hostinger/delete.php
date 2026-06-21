<?php
/**
 * delete.php — Hostinger file delete endpoint
 *
 * Deploy this file to: public_html/uploads/delete.php
 *
 * Receives a POST with JSON body { "path": "bucket/subfolder/filename.pdf" }
 * Deletes the file from disk and returns success/error as JSON.
 */

// ── Configuration ─────────────────────────────────────────────────────────────

define('UPLOAD_SECRET', getenv('UPLOAD_SECRET') ?: 'KEY');
define('UPLOADS_DIR', __DIR__ . '/files');

// ── CORS ──────────────────────────────────────────────────────────────────────

header('Access-Control-Allow-Origin: https://eruditeenglish.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Upload-Token, Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Parse body ────────────────────────────────────────────────────────────────

$body = json_decode(file_get_contents('php://input'), true);
$path = trim($body['path'] ?? '');

if (!$path) {
    jsonError(400, 'Missing path');
}

// Sanitize — prevent directory traversal
$path = ltrim($path, '/');
if (preg_match('/\.\./', $path)) {
    jsonError(400, 'Invalid path');
}

// ── Delete file ───────────────────────────────────────────────────────────────

$fullPath = UPLOADS_DIR . '/' . $path;

// Make sure the resolved path is still inside UPLOADS_DIR
$realUploads = realpath(UPLOADS_DIR);
$realFile    = realpath($fullPath);

if ($realFile === false) {
    // File doesn't exist — treat as success (idempotent)
    jsonSuccess(['deleted' => false, 'reason' => 'file not found']);
}

if (strpos($realFile, $realUploads) !== 0) {
    jsonError(400, 'Path escapes uploads directory');
}

if (!unlink($realFile)) {
    jsonError(500, 'Failed to delete file');
}

jsonSuccess(['deleted' => true]);
