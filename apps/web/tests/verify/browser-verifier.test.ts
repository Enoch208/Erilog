/**
 * Parity tests for the browser verification path used by /verify.
 *
 * The page reads bundles with JSZip instead of yauzl-promise, so these tests
 * assert that the browser reader produces the same BundleFiles and the same
 * verification verdicts as the headless verifier for a real signed ZIP.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createSyncEngineState,
  generateBundle,
  processSync,
  writeBundleToBuffer,
} from '@erilog/reconcile';
import type { BundleOutput, MissionState } from '@erilog/reconcile';
import { computeEventHash, getPublicKey, sha256Hex, canonicalize } from '@erilog/crypto';
import { verifyBundle } from '@erilog/verifier/core';
import { readArchive } from '@erilog/verifier';
import type { HandoutEvent, MissionPolicy } from '@erilog/schemas';
import {
  ArchiveSafetyError,
  readArchiveInBrowser,
} from '../../lib/verify/read-archive-browser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../../packages/crypto/fixtures/seed-42-vectors.json'),
    'utf-8'
  )
);

const SEED = vectors.seed42Contract;
const TEST_PRIVATE_KEY = vectors.testKeyPair.privateKey;

let publicKey: string;
let bundle: BundleOutput;
let zipBytes: Uint8Array;

async function buildSeed42Events(): Promise<HandoutEvent[]> {
  const events: HandoutEvent[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < SEED.events.length; i++) {
    const ev = SEED.events[i];
    const tokenHash = vectors.tokenHashes[ev.tokenRaw as keyof typeof vectors.tokenHashes];
    const previousHash = ev.previousHash ? ev.previousHash : hashes[i === 1 ? 0 : 2];
    const hashInput = {
      id: ev.id,
      missionId: SEED.mission.id,
      deviceId: ev.deviceId,
      policyVersion: SEED.mission.policyVersion,
      sequence: ev.sequence,
      tokenHash,
      itemType: ev.itemType,
      quantity: ev.quantity,
      deviceTime: ev.deviceTime,
      previousHash,
    };
    const eventHash = await computeEventHash(hashInput);
    hashes.push(eventHash);
    events.push({ ...hashInput, eventHash });
  }
  return events;
}

beforeAll(async () => {
  publicKey = await getPublicKey(TEST_PRIVATE_KEY);
  const events = await buildSeed42Events();

  const mission: MissionState = {
    missionId: SEED.mission.id,
    policy: SEED.policy as MissionPolicy,
    policyVersion: SEED.mission.policyVersion,
    devices: [
      { deviceId: SEED.devices.alpha.id, allocation: SEED.devices.alpha.allocation },
      { deviceId: SEED.devices.bravo.id, allocation: SEED.devices.bravo.allocation },
    ],
    initialStock: SEED.mission.totalStock,
    deviceIds: new Set([SEED.devices.alpha.id, SEED.devices.bravo.id]),
    validTokenHashes: new Set(Object.values(vectors.tokenHashes)),
  };

  const state = createSyncEngineState();
  await processSync(events.slice(0, 2), mission, state, SEED.devices.alpha.id);
  await processSync(events.slice(2, 4), mission, state, SEED.devices.bravo.id);

  bundle = await generateBundle({
    missionId: SEED.mission.id,
    policyVersion: SEED.mission.policyVersion,
    policy: SEED.policy as MissionPolicy,
    events,
    reconciliationResult: state.latestReconciliation!,
    privateKeyHex: TEST_PRIVATE_KEY,
    publicKeyHex: publicKey,
    exportedAt: '2026-08-22T12:00:00.000Z',
  });

  zipBytes = new Uint8Array(await writeBundleToBuffer(bundle));
});

describe('/verify browser reader — parity with the headless reader', () => {
  it('extracts byte-identical bundle files from a real ZIP', async () => {
    const browserFiles = await readArchiveInBrowser(zipBytes);
    const nodeFiles = await readArchive(Buffer.from(zipBytes));

    expect(Object.keys(browserFiles).sort()).toEqual(Object.keys(nodeFiles).sort());
    for (const key of Object.keys(nodeFiles)) {
      expect(browserFiles[key]).toBe(nodeFiles[key]);
    }
  });

  it('verifies an untouched bundle as valid', async () => {
    const files = await readArchiveInBrowser(zipBytes);
    const result = await verifyBundle(files, publicKey);
    expect(result.valid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('names events.json when one quantity is changed from 1 to 2', async () => {
    const files = await readArchiveInBrowser(zipBytes);
    const events = JSON.parse(files['events.json']);
    events[1].quantity = 2;
    const tampered = { ...files, 'events.json': JSON.stringify(events) };

    const result = await verifyBundle(tampered, publicKey);
    expect(result.valid).toBe(false);

    const failure = result.failures.find((f) => f.check === 'file_checksum');
    expect(failure).toBeDefined();
    expect(failure!.file).toBe('events.json');
    expect(failure!.expected).not.toBe(failure!.observed);
  });

  it('fails on signature when the manifest checksum is repaired without the key', async () => {
    const files = await readArchiveInBrowser(zipBytes);
    const events = JSON.parse(files['events.json']);
    events[1].quantity = 2;
    const mutatedEvents = JSON.stringify(events);

    const manifest = JSON.parse(files['manifest.json']);
    manifest.files['events.json'].sha256 = await sha256Hex(mutatedEvents);

    const tampered = {
      ...files,
      'events.json': mutatedEvents,
      'manifest.json': canonicalize(manifest),
    };

    const result = await verifyBundle(tampered, publicKey);
    expect(result.valid).toBe(false);
    expect(result.failures.some((f) => f.check === 'signature')).toBe(true);
  });

  it('rejects a bundle verified against a different pinned key', async () => {
    const files = await readArchiveInBrowser(zipBytes);
    const otherKey = await getPublicKey(
      '4242424242424242424242424242424242424242424242424242424242424242'
    );
    const result = await verifyBundle(files, otherKey);
    expect(result.valid).toBe(false);
    expect(
      result.failures.some((f) => f.check === 'signature' || f.check === 'key_id_mismatch')
    ).toBe(true);
  });

  it('rejects input that is not a ZIP archive', async () => {
    await expect(
      readArchiveInBrowser(new TextEncoder().encode('this is definitely not a zip'))
    ).rejects.toBeInstanceOf(ArchiveSafetyError);
  });

  it('rejects an archive missing signature.bin', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('manifest.json', bundle.files['manifest.json']!);
    const bytes = await zip.generateAsync({ type: 'uint8array' });

    await expect(readArchiveInBrowser(bytes)).rejects.toMatchObject({
      code: 'MISSING_REQUIRED',
    });
  });

  it('enforces the archive file-count limit', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (let i = 0; i < 8; i++) zip.file(`file-${i}.txt`, `content ${i}`);
    const bytes = await zip.generateAsync({ type: 'uint8array' });

    await expect(
      readArchiveInBrowser(bytes, {
        maxFileCount: 3,
        maxFileSizeBytes: 1024 * 1024,
        maxTotalSizeBytes: 1024 * 1024,
        maxCompressionRatio: 100,
      })
    ).rejects.toMatchObject({ code: 'MAX_FILE_COUNT' });
  });

  it('rejects path traversal entries', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('../escape.json', '{}');
    zip.file('manifest.json', bundle.files['manifest.json']!);
    const bytes = await zip.generateAsync({ type: 'uint8array' });

    await expect(readArchiveInBrowser(bytes)).rejects.toMatchObject({
      code: 'PATH_TRAVERSAL',
    });
  });
});
