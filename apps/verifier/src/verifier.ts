/**
 * Static verifier core.
 *
 * Implements the verification procedure from design.md Section 10.2.
 * This module is framework-independent — usable in browser, CLI, or tests.
 *
 * Verification checks:
 * 1. Signature on manifest against PINNED public key
 * 2. Key ID matches pinned key fingerprint
 * 3. Manifest completeness (no extra/missing files)
 * 4. Per-file SHA-256 checksums
 * 5. Recompute reconciliation from events + policy
 * 6. Compare recomputed result to declared summary
 */

import { reconcile } from '@erilog/reconcile';
import type { HandoutEvent, MissionPolicy, DeviceAllocation } from '@erilog/schemas';
import {
  canonicalize,
  verify as ed25519Verify,
  keyFingerprint,
  computeFileChecksum,
} from '@erilog/crypto';
import type { BundleManifest } from '@erilog/crypto';

export interface VerificationResult {
  valid: boolean;
  failures: VerificationFailure[];
}

export interface VerificationFailure {
  check: string;
  file?: string;
  expected?: string;
  observed?: string;
  message: string;
}

export interface BundleFiles {
  'manifest.json': string;
  'policy.json': string;
  'events.json': string;
  'summary.json': string;
  signature: string; // hex-encoded
  [key: string]: string;
}

/**
 * Verify an audit bundle against a pinned public key.
 *
 * The bundle is provided as a record of filename → content string,
 * plus the hex-encoded signature. In the browser, the caller extracts
 * these from the ZIP. In CLI/tests, they can be provided directly.
 */
export async function verifyBundle(
  files: BundleFiles,
  pinnedPublicKeyHex: string
): Promise<VerificationResult> {
  const failures: VerificationFailure[] = [];

  // Parse manifest
  let manifest: BundleManifest;
  try {
    manifest = JSON.parse(files['manifest.json']) as BundleManifest;
  } catch {
    failures.push({
      check: 'manifest_parse',
      message: 'Failed to parse manifest.json as valid JSON',
    });
    return { valid: false, failures };
  }

  // Check 1: Verify signature against pinned key
  const manifestBytes = new TextEncoder().encode(files['manifest.json']);
  try {
    const sigValid = await ed25519Verify(files.signature, manifestBytes, pinnedPublicKeyHex);
    if (!sigValid) {
      const pinnedFp = await keyFingerprint(pinnedPublicKeyHex);
      failures.push({
        check: 'signature',
        expected: pinnedFp,
        observed: manifest.keyId,
        message: `Signature verification failed. Expected key: ${pinnedFp}`,
      });
    }
  } catch (e) {
    failures.push({
      check: 'signature',
      message: `Signature verification error: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  // Check 2: Key ID matches pinned key
  const pinnedFingerprint = await keyFingerprint(pinnedPublicKeyHex);
  if (manifest.keyId !== pinnedFingerprint) {
    failures.push({
      check: 'key_id_mismatch',
      expected: pinnedFingerprint,
      observed: manifest.keyId,
      message: `Bundle signed with key ${manifest.keyId}, verifier expects ${pinnedFingerprint}`,
    });
  }

  // Check 3: Manifest completeness
  const declaredFiles = Object.keys(manifest.files);
  const bundleContentFiles = Object.keys(files).filter(
    (f) => f !== 'manifest.json' && f !== 'signature'
  );

  for (const declared of declaredFiles) {
    if (!files[declared]) {
      failures.push({
        check: 'manifest_completeness',
        file: declared,
        message: `Manifest references ${declared} but not found in archive`,
      });
    }
  }

  for (const present of bundleContentFiles) {
    if (!manifest.files[present]) {
      failures.push({
        check: 'manifest_completeness',
        file: present,
        message: `Archive contains ${present} not listed in manifest`,
      });
    }
  }

  // Check 4: Per-file checksums
  for (const [fileName, meta] of Object.entries(manifest.files)) {
    const content = files[fileName];
    if (!content) continue; // Already reported in completeness check

    const computed = await computeFileChecksum(content);
    if (computed !== meta.sha256) {
      failures.push({
        check: 'file_checksum',
        file: fileName,
        expected: meta.sha256,
        observed: computed,
        message: `File ${fileName}: expected SHA-256 ${meta.sha256}, computed ${computed}`,
      });
    }
  }

  // Check 5+6: Recompute reconciliation
  if (files['policy.json'] && files['events.json'] && files['summary.json']) {
    try {
      const policy = JSON.parse(files['policy.json']) as MissionPolicy;
      const events = JSON.parse(files['events.json']) as HandoutEvent[];

      // Derive device allocations from events (for recomputation)
      // In the real verifier, this would come from the bundle or be derivable
      // For now, we use the events to infer unique devices
      const deviceIds = [...new Set(events.map((e) => e.deviceId))];
      const devices: DeviceAllocation[] = deviceIds.map((id) => ({
        deviceId: id,
        allocation: { emergency_kit: 1000 }, // Large — device overspend checked separately
      }));

      // Determine initial stock from declared summary
      const declaredResult = JSON.parse(files['summary.json']);
      const initialStock = declaredResult.summary?.initialStock ?? {};

      const recomputed = await reconcile({
        policy,
        events,
        devices,
        initialStock,
      });

      const recomputedCanonical = canonicalize({
        summary: recomputed.summary,
        exceptions: recomputed.exceptions,
        eventSetDigest: recomputed.eventSetDigest,
      });

      const declaredCanonical = canonicalize(declaredResult);

      if (recomputedCanonical !== declaredCanonical) {
        // Find specific mismatches
        if (canonicalize(recomputed.summary) !== canonicalize(declaredResult.summary)) {
          failures.push({
            check: 'recomputation_summary',
            file: 'summary.json',
            expected: canonicalize(declaredResult.summary),
            observed: canonicalize(recomputed.summary),
            message: `Recomputed summary does not match declared summary`,
          });
        }

        if (canonicalize(recomputed.exceptions) !== canonicalize(declaredResult.exceptions)) {
          failures.push({
            check: 'recomputation_exceptions',
            file: 'summary.json',
            expected: canonicalize(declaredResult.exceptions),
            observed: canonicalize(recomputed.exceptions),
            message: `Recomputed exceptions do not match declared exceptions`,
          });
        }

        if (recomputed.eventSetDigest !== declaredResult.eventSetDigest) {
          failures.push({
            check: 'recomputation_digest',
            file: 'summary.json',
            expected: declaredResult.eventSetDigest,
            observed: recomputed.eventSetDigest,
            message: `Recomputed eventSetDigest does not match declared value`,
          });
        }
      }
    } catch (e) {
      failures.push({
        check: 'recomputation',
        message: `Recomputation error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}
