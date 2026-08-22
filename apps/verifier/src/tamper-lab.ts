/**
 * Tamper Lab.
 *
 * Clones a bundle in memory, applies a semantic mutation, and re-verifies.
 * The original bundle is never modified. Demonstrates detection only — it
 * does NOT re-sign or "fix" the tampered bundle.
 *
 * Per design.md Section 10 (REQ-AUD-8).
 */

import { verifyBundle, type BundleFiles, type VerificationFailure } from './verifier.js';

export interface TamperResult {
  originalValid: boolean;
  tamperedValid: boolean;
  mutation: string;
  failures: VerificationFailure[];
}

export interface QuantityMutation {
  type: 'change_event_quantity';
  eventIndex: number;
  from: number;
  to: number;
}

/**
 * Deep-clone the bundle files so the original is never mutated.
 */
function cloneBundle(files: BundleFiles): BundleFiles {
  return { ...files };
}

/**
 * Apply a quantity mutation to events.json while preserving valid JSON.
 * Returns a new bundle files record with the mutated events.json.
 */
export function applyQuantityMutation(
  files: BundleFiles,
  eventIndex: number,
  newQuantity: number
): { mutated: BundleFiles; description: string; from: number } {
  const clone = cloneBundle(files);
  const events = JSON.parse(clone['events.json']);

  if (!Array.isArray(events) || eventIndex >= events.length) {
    throw new Error(`Cannot mutate event at index ${eventIndex}: out of range`);
  }

  const from = events[eventIndex].quantity;
  events[eventIndex].quantity = newQuantity;

  // Re-serialize as valid JSON (NOT re-canonicalized to match manifest —
  // this is the point: the tampered content will not match the checksum)
  // We use the same canonical serialization the export used, so the JSON is
  // structurally valid but the checksum will differ.
  clone['events.json'] = JSON.stringify(events);

  return {
    mutated: clone,
    description: `event[${eventIndex}].quantity changed from ${from} to ${newQuantity}`,
    from,
  };
}

/**
 * Run the tamper lab: verify original, apply mutation, verify tampered.
 */
export async function runTamperLab(
  files: BundleFiles,
  pinnedPublicKeyHex: string,
  mutation: QuantityMutation
): Promise<TamperResult> {
  // Verify the original (unmutated) bundle
  const originalResult = await verifyBundle(cloneBundle(files), pinnedPublicKeyHex);

  // Apply mutation to a clone
  const { mutated, description } = applyQuantityMutation(
    files,
    mutation.eventIndex,
    mutation.to
  );

  // Verify the tampered bundle
  const tamperedResult = await verifyBundle(mutated, pinnedPublicKeyHex);

  return {
    originalValid: originalResult.valid,
    tamperedValid: tamperedResult.valid,
    mutation: description,
    failures: tamperedResult.failures,
  };
}
