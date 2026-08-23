/**
 * Browser ZIP reader for audit bundles.
 *
 * Mirrors `apps/verifier/src/archive-reader.ts` check-for-check, but reads
 * through JSZip instead of yauzl-promise so it runs in the browser with no
 * Node built-ins. The safety limits, error codes, and resulting `BundleFiles`
 * shape are intentionally identical so browser and headless verification
 * behave the same way.
 */

import JSZip from 'jszip';
import { hexEncode } from '@erilog/crypto';
import type { BundleFiles } from '@erilog/verifier/core';

export interface ArchiveLimits {
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  maxCompressionRatio: number;
}

export const DEFAULT_LIMITS: ArchiveLimits = {
  maxFileCount: 20,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB per file
  maxTotalSizeBytes: 50 * 1024 * 1024, // 50 MB total
  maxCompressionRatio: 100, // 100:1
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

/** Reject absolute paths, traversal, and Windows-style separators. */
function validatePath(path: string): void {
  if (path.startsWith('/') || path.startsWith('\\')) {
    throw new ArchiveSafetyError(`Unsafe file path: absolute path "${path}"`, 'PATH_TRAVERSAL');
  }
  if (path.includes('..')) {
    throw new ArchiveSafetyError(`Unsafe file path: path traversal in "${path}"`, 'PATH_TRAVERSAL');
  }
  if (path.includes('\\')) {
    throw new ArchiveSafetyError(`Unsafe file path: backslash in "${path}"`, 'PATH_TRAVERSAL');
  }
}

/** JSZip keeps compressed size on a private field; read it defensively. */
function compressedSizeOf(entry: JSZip.JSZipObject): number {
  const data = (entry as unknown as { _data?: { compressedSize?: number } })._data;
  return typeof data?.compressedSize === 'number' ? data.compressedSize : 0;
}

/**
 * Read and validate an audit bundle ZIP from raw bytes.
 *
 * @throws ArchiveSafetyError when a safety limit or required-file rule is violated.
 */
export async function readArchiveInBrowser(
  bytes: ArrayBuffer | Uint8Array,
  limits: ArchiveLimits = DEFAULT_LIMITS
): Promise<BundleFiles> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    throw new ArchiveSafetyError(
      `Not a readable ZIP archive: ${error instanceof Error ? error.message : String(error)}`,
      'UNREADABLE_ARCHIVE'
    );
  }

  const files: Record<string, string> = {};
  const seenNames = new Set<string>();
  let fileCount = 0;
  let totalUncompressed = 0;

  // JSZip already de-duplicates identical names, so guard the raw central
  // directory listing as well before trusting the parsed entry map.
  for (const rawName of Object.keys(zip.files)) {
    if (seenNames.has(rawName)) {
      throw new ArchiveSafetyError(`Duplicate archive entry: "${rawName}"`, 'DUPLICATE_ENTRY');
    }
    seenNames.add(rawName);
  }

  for (const [fileName, entry] of Object.entries(zip.files)) {
    if (fileCount >= limits.maxFileCount) {
      throw new ArchiveSafetyError(
        `Archive exceeds maximum file count (${limits.maxFileCount})`,
        'MAX_FILE_COUNT'
      );
    }

    validatePath(fileName);

    if (entry.dir || fileName.endsWith('/')) continue;

    const content = await entry.async('uint8array');
    const uncompressedSize = content.byteLength;

    if (uncompressedSize > limits.maxFileSizeBytes) {
      throw new ArchiveSafetyError(
        `File "${fileName}" exceeds max size (${uncompressedSize} > ${limits.maxFileSizeBytes})`,
        'MAX_FILE_SIZE'
      );
    }

    totalUncompressed += uncompressedSize;
    if (totalUncompressed > limits.maxTotalSizeBytes) {
      throw new ArchiveSafetyError(
        `Archive exceeds max total uncompressed size (${totalUncompressed} > ${limits.maxTotalSizeBytes})`,
        'MAX_TOTAL_SIZE'
      );
    }

    const compressedSize = compressedSizeOf(entry);
    if (compressedSize > 0) {
      const ratio = uncompressedSize / compressedSize;
      if (ratio > limits.maxCompressionRatio) {
        throw new ArchiveSafetyError(
          `Suspicious compression ratio for "${fileName}" (${ratio.toFixed(1)}:1 > ${limits.maxCompressionRatio}:1)`,
          'COMPRESSION_RATIO'
        );
      }
    }

    fileCount += 1;

    if (fileName === 'signature.bin') {
      files['signature'] = hexEncode(content);
    } else {
      files[fileName] = new TextDecoder('utf-8').decode(content);
    }
  }

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
