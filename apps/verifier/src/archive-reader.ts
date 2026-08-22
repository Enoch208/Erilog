/**
 * Safe ZIP archive reader for the verifier.
 *
 * Enforces:
 * - Maximum file count (default 20)
 * - Maximum individual file size (default 10 MB)
 * - Maximum total uncompressed size (default 50 MB)
 * - Compression ratio limit (zip bomb defense, default 100:1)
 * - Path allowlist (no traversal, no absolute paths)
 * - No duplicate entries
 *
 * Per design.md Section 9.3 / REQ-NFR-7.
 */

import * as yauzl from 'yauzl-promise';
import type { BundleFiles } from './verifier.js';

export interface ArchiveLimits {
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  maxCompressionRatio: number;
}

export const DEFAULT_LIMITS: ArchiveLimits = {
  maxFileCount: 20,
  maxFileSizeBytes: 10 * 1024 * 1024,    // 10 MB per file
  maxTotalSizeBytes: 50 * 1024 * 1024,   // 50 MB total
  maxCompressionRatio: 100,               // 100:1
};

export class ArchiveSafetyError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ArchiveSafetyError';
  }
}

/**
 * Validate a file path for safety.
 */
function validatePath(path: string): void {
  // No absolute paths
  if (path.startsWith('/') || path.startsWith('\\')) {
    throw new ArchiveSafetyError(
      `Unsafe file path: absolute path "${path}"`,
      'PATH_TRAVERSAL'
    );
  }
  // No traversal
  if (path.includes('..') || path.includes('\\..')) {
    throw new ArchiveSafetyError(
      `Unsafe file path: path traversal in "${path}"`,
      'PATH_TRAVERSAL'
    );
  }
  // No backslashes (Windows-style paths in archives)
  if (path.includes('\\')) {
    throw new ArchiveSafetyError(
      `Unsafe file path: backslash in "${path}"`,
      'PATH_TRAVERSAL'
    );
  }
}

/**
 * Read and validate a ZIP archive from a Buffer.
 *
 * Returns the parsed bundle files ready for verification.
 * Throws ArchiveSafetyError if any safety limit is violated.
 */
export async function readArchive(
  zipBuffer: Buffer,
  limits: ArchiveLimits = DEFAULT_LIMITS
): Promise<BundleFiles> {
  const zipFile = await yauzl.fromBuffer(zipBuffer);

  const entries: Array<{ fileName: string; compressedSize: number; uncompressedSize: number }> = [];
  const seenNames = new Set<string>();
  const files: Record<string, string> = {};
  let totalUncompressed = 0;

  for await (const entry of zipFile) {
    const fileName = entry.filename;

    // Check file count
    if (entries.length >= limits.maxFileCount) {
      throw new ArchiveSafetyError(
        `Archive exceeds maximum file count (${limits.maxFileCount})`,
        'MAX_FILE_COUNT'
      );
    }

    // Check for duplicates
    if (seenNames.has(fileName)) {
      throw new ArchiveSafetyError(
        `Duplicate archive entry: "${fileName}"`,
        'DUPLICATE_ENTRY'
      );
    }
    seenNames.add(fileName);

    // Validate path
    validatePath(fileName);

    // Skip directories
    if (fileName.endsWith('/')) continue;

    // Check individual file size
    if (entry.uncompressedSize > limits.maxFileSizeBytes) {
      throw new ArchiveSafetyError(
        `File "${fileName}" exceeds max size (${entry.uncompressedSize} > ${limits.maxFileSizeBytes})`,
        'MAX_FILE_SIZE'
      );
    }

    // Check total size
    totalUncompressed += entry.uncompressedSize;
    if (totalUncompressed > limits.maxTotalSizeBytes) {
      throw new ArchiveSafetyError(
        `Archive exceeds max total uncompressed size (${totalUncompressed} > ${limits.maxTotalSizeBytes})`,
        'MAX_TOTAL_SIZE'
      );
    }

    // Check compression ratio (zip bomb defense)
    if (entry.compressedSize > 0) {
      const ratio = entry.uncompressedSize / entry.compressedSize;
      if (ratio > limits.maxCompressionRatio) {
        throw new ArchiveSafetyError(
          `Suspicious compression ratio for "${fileName}" (${ratio.toFixed(1)}:1 > ${limits.maxCompressionRatio}:1)`,
          'COMPRESSION_RATIO'
        );
      }
    }

    entries.push({
      fileName,
      compressedSize: entry.compressedSize,
      uncompressedSize: entry.uncompressedSize,
    });

    // Read content
    const stream = await entry.openReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks);

    if (fileName === 'signature.bin') {
      // Signature is stored as binary, convert to hex for verifier
      files['signature'] = content.toString('hex');
    } else {
      files[fileName] = content.toString('utf-8');
    }
  }

  // Verify we have the minimum required files
  if (!files['manifest.json']) {
    throw new ArchiveSafetyError(
      'Archive missing required file: manifest.json',
      'MISSING_REQUIRED'
    );
  }
  if (!files['signature']) {
    throw new ArchiveSafetyError(
      'Archive missing required file: signature.bin',
      'MISSING_REQUIRED'
    );
  }

  return files as BundleFiles;
}
