/**
 * Audit bundle generation.
 *
 * Creates the bundle structure (policy, events, summary, manifest, signature)
 * per design.md Section 10.
 *
 * The bundle is returned as a record of filenames → content strings,
 * plus the binary signature. The caller is responsible for ZIP packaging.
 */

import type { HandoutEvent, MissionPolicy } from '@erilog/schemas';
import type { ReconciliationResult } from './types.js';
import type { BundleManifest } from '@erilog/crypto';
import {
  canonicalize,
  computeManifestChecksums,
  sign,
  keyFingerprint,
} from '@erilog/crypto';

export interface BundleInput {
  missionId: string;
  policyVersion: number;
  policy: MissionPolicy;
  events: HandoutEvent[];
  reconciliationResult: ReconciliationResult;
  privateKeyHex: string;
  publicKeyHex: string;
  exportedAt: string; // ISO 8601
}

export interface BundleOutput {
  files: Record<string, string>;
  signature: string; // hex-encoded Ed25519 signature
  manifest: BundleManifest;
}

/**
 * Generate a complete audit bundle.
 *
 * All content files are serialized with RFC 8785 canonical JSON.
 * The manifest includes checksums, metadata, and the signing key fingerprint.
 * The signature covers the manifest bytes.
 */
export async function generateBundle(input: BundleInput): Promise<BundleOutput> {
  const {
    missionId,
    policyVersion,
    policy,
    events,
    reconciliationResult,
    privateKeyHex,
    publicKeyHex,
    exportedAt,
  } = input;

  // Serialize content files as canonical JSON
  const policyJson = canonicalize(policy);
  const eventsJson = canonicalize(events);
  const summaryJson = canonicalize({
    summary: reconciliationResult.summary,
    exceptions: reconciliationResult.exceptions,
    eventSetDigest: reconciliationResult.eventSetDigest,
  });

  const files: Record<string, string> = {
    'policy.json': policyJson,
    'events.json': eventsJson,
    'summary.json': summaryJson,
  };

  // Compute checksums
  const checksums = await computeManifestChecksums(files);

  // Build manifest
  const keyId = await keyFingerprint(publicKeyHex);
  const manifest: BundleManifest = {
    schemaVersion: '1.0.0',
    algorithmVersion: '1.0.0',
    missionId,
    policyVersion,
    eventCount: events.length,
    eventSetDigest: reconciliationResult.eventSetDigest,
    exportedAt,
    keyId,
    canonicalization: 'RFC8785',
    files: checksums,
  };

  const manifestJson = canonicalize(manifest);
  files['manifest.json'] = manifestJson;

  // Sign the manifest
  const manifestBytes = new TextEncoder().encode(manifestJson);
  const signature = await sign(manifestBytes, privateKeyHex);

  return { files, signature, manifest };
}
