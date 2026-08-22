/**
 * Real ZIP archive generation for audit bundles.
 *
 * Uses the archiver library to produce genuine ZIP files on disk.
 * The verifier must then read these bytes through its own parser —
 * never via in-memory JavaScript object passthrough.
 */

import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';
import { Writable } from 'node:stream';
import type { BundleOutput } from './bundle.js';

const require = createRequire(import.meta.url);
const archiverLib = require('archiver') as {
  create: (format: string, options?: Record<string, unknown>) => {
    pipe: (stream: NodeJS.WritableStream) => void;
    append: (data: string | Buffer, opts: { name: string }) => void;
    finalize: () => Promise<void>;
    pointer: () => number;
  };
};

function createZipArchive() {
  return archiverLib.create('zip', { zlib: { level: 6 } });
}

/**
 * Write a bundle to a real ZIP file on disk.
 * Returns the path written.
 */
export async function writeBundleToZip(
  bundle: BundleOutput,
  outputPath: string
): Promise<{ path: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = createZipArchive();

    output.on('close', () => {
      resolve({ path: outputPath, sizeBytes: archive.pointer() });
    });
    output.on('error', reject);

    archive.pipe(output);

    for (const [name, content] of Object.entries(bundle.files)) {
      archive.append(content, { name });
    }

    const sigBytes = Buffer.from(bundle.signature, 'hex');
    archive.append(sigBytes, { name: 'signature.bin' });

    archive.finalize().catch(reject);
  });
}

/**
 * Write a bundle to a Buffer (for tests and headless demo).
 */
export async function writeBundleToBuffer(bundle: BundleOutput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    writable.on('finish', () => {
      resolve(Buffer.concat(chunks));
    });
    writable.on('error', reject);

    const archive = createZipArchive();
    archive.pipe(writable);

    for (const [name, content] of Object.entries(bundle.files)) {
      archive.append(content, { name });
    }

    const sigBytes = Buffer.from(bundle.signature, 'hex');
    archive.append(sigBytes, { name: 'signature.bin' });

    archive.finalize().catch(reject);
  });
}
