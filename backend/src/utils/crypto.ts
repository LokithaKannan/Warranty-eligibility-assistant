import crypto from 'crypto';
import path from 'path';

/**
 * Generate a cryptographically random filename with a given extension.
 * Never uses the original upload filename for storage.
 */
export function generateStoredFilename(extension = '.pdf'): string {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${randomBytes}${extension}`;
}

/**
 * Compute SHA-256 hash of a Buffer for file integrity checking.
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate a short claim reference code.
 */
export function generateReferenceCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `WR-${timestamp}-${random}`;
}

/**
 * Sanitize a filename for safe logging/display (never for storage).
 */
export function sanitizeFilenameForDisplay(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 100);
}
