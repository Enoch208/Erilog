import { canonicalize } from './canonicalize.js';
import type { EventHashInput, HandoutEvent } from '@erilog/schemas';

/**
 * Compute SHA-256 of a UTF-8 string and return as lowercase hex.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return hexEncode(new Uint8Array(digest));
}

/**
 * Encode a Uint8Array as lowercase hex string.
 */
export function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decode a hex string to Uint8Array.
 */
export function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Extract the hash input fields from a HandoutEvent (everything except eventHash).
 */
export function toHashInput(event: HandoutEvent): EventHashInput {
  return {
    id: event.id,
    missionId: event.missionId,
    deviceId: event.deviceId,
    policyVersion: event.policyVersion,
    sequence: event.sequence,
    tokenHash: event.tokenHash,
    itemType: event.itemType,
    quantity: event.quantity,
    deviceTime: event.deviceTime,
    previousHash: event.previousHash,
  };
}

/**
 * Compute the event hash: SHA-256 of the RFC 8785 canonical JSON of the hash input fields.
 */
export async function computeEventHash(input: EventHashInput): Promise<string> {
  const canonical = canonicalize(input);
  return sha256Hex(canonical);
}

/**
 * Verify a device's event chain for integrity.
 * Events must all belong to the same device.
 * Returns success or failure with the sequence number where it broke.
 */
export async function verifyDeviceChain(
  events: HandoutEvent[]
): Promise<{ valid: boolean; brokenAt?: number; reason?: string }> {
  if (events.length === 0) {
    return { valid: true };
  }

  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i]!;

    // Verify sequence continuity
    if (event.sequence !== i) {
      return { valid: false, brokenAt: event.sequence, reason: 'sequence_gap' };
    }

    // Verify self-hash
    const computed = await computeEventHash(toHashInput(event));
    if (computed !== event.eventHash) {
      return { valid: false, brokenAt: event.sequence, reason: 'self_hash_mismatch' };
    }

    // Verify chain linkage
    if (i === 0) {
      if (event.previousHash !== 'GENESIS') {
        return { valid: false, brokenAt: 0, reason: 'missing_genesis' };
      }
    } else {
      if (event.previousHash !== sorted[i - 1]!.eventHash) {
        return { valid: false, brokenAt: event.sequence, reason: 'chain_break' };
      }
    }
  }

  return { valid: true };
}
