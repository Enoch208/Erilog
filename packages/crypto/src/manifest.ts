import { sha256Hex } from './hash-chain.js';

/**
 * Compute the SHA-256 checksum of a file's content (as UTF-8 string).
 */
export async function computeFileChecksum(content: string): Promise<string> {
  return sha256Hex(content);
}

/**
 * Compute checksums for all files in a bundle.
 */
export async function computeManifestChecksums(
  files: Record<string, string>
): Promise<Record<string, { sha256: string }>> {
  const result: Record<string, { sha256: string }> = {};
  for (const [name, content] of Object.entries(files)) {
    result[name] = { sha256: await computeFileChecksum(content) };
  }
  return result;
}
