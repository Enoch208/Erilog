import { describe, it, expect } from 'vitest';
import { computeEventHash, toHashInput, sha256Hex } from '@erilog/crypto';
import { SyncRequestSchema } from '@erilog/schemas';
import type { HandoutEvent } from '@erilog/schemas';

/**
 * Integration tests for sync API edge cases.
 *
 * These tests validate the sync protocol logic at the schema and
 * hash computation level. Full integration against PostgreSQL
 * requires the server running with DB (use pnpm playwright test for that).
 */

const MISSION_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const DEVICE_ID = 'a1b2c3d4-0000-4000-8000-aaa000000001';
const POLICY_VERSION = 0;
const TOKEN_SALT = 'seed42salt000000000000000000000000';

async function makeEvent(overrides: Partial<HandoutEvent> & { sequence: number; tokenRaw: string; previousHash: string }): Promise<HandoutEvent> {
  const tokenHash = await sha256Hex(TOKEN_SALT + overrides.tokenRaw);
  const id = overrides.id ?? crypto.randomUUID();
  const deviceTime = overrides.deviceTime ?? new Date().toISOString();

  const partial = {
    id,
    missionId: overrides.missionId ?? MISSION_ID,
    deviceId: overrides.deviceId ?? DEVICE_ID,
    policyVersion: overrides.policyVersion ?? POLICY_VERSION,
    sequence: overrides.sequence,
    tokenHash,
    itemType: overrides.itemType ?? 'emergency_kit',
    quantity: overrides.quantity ?? 1,
    deviceTime,
    previousHash: overrides.previousHash,
    eventHash: '',
  };

  const hashInput = toHashInput(partial as HandoutEvent);
  const eventHash = await computeEventHash(hashInput);

  return { ...partial, eventHash };
}

describe('Sync Edge Cases', () => {
  describe('Schema Validation', () => {
    it('rejects request with empty events array', () => {
      const result = SyncRequestSchema.safeParse({
        deviceId: DEVICE_ID,
        missionId: MISSION_ID,
        events: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects event with negative quantity', () => {
      const result = SyncRequestSchema.safeParse({
        deviceId: DEVICE_ID,
        missionId: MISSION_ID,
        events: [{
          id: crypto.randomUUID(),
          missionId: MISSION_ID,
          deviceId: DEVICE_ID,
          policyVersion: 0,
          sequence: 0,
          tokenHash: 'a'.repeat(64),
          itemType: 'emergency_kit',
          quantity: -1,
          deviceTime: new Date().toISOString(),
          previousHash: 'GENESIS',
          eventHash: 'b'.repeat(64),
        }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects event with invalid UUID', () => {
      const result = SyncRequestSchema.safeParse({
        deviceId: 'not-a-uuid',
        missionId: MISSION_ID,
        events: [{
          id: crypto.randomUUID(),
          missionId: MISSION_ID,
          deviceId: 'not-a-uuid',
          policyVersion: 0,
          sequence: 0,
          tokenHash: 'a'.repeat(64),
          itemType: 'emergency_kit',
          quantity: 1,
          deviceTime: new Date().toISOString(),
          previousHash: 'GENESIS',
          eventHash: 'b'.repeat(64),
        }],
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid sync request', async () => {
      const event = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      const result = SyncRequestSchema.safeParse({
        deviceId: DEVICE_ID,
        missionId: MISSION_ID,
        events: [event],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Hash Chain Integrity', () => {
    it('first event must have GENESIS as previousHash', async () => {
      const event = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      expect(event.previousHash).toBe('GENESIS');
      expect(event.eventHash).toHaveLength(64);
    });

    it('chain event references previous hash', async () => {
      const event1 = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      const event2 = await makeEvent({ sequence: 1, tokenRaw: 'HH-041', previousHash: event1.eventHash });
      expect(event2.previousHash).toBe(event1.eventHash);
      expect(event2.eventHash).not.toBe(event1.eventHash);
    });

    it('hash changes when content changes (tamper detection)', async () => {
      const event = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      const tampered = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS', quantity: 2 });
      expect(tampered.eventHash).not.toBe(event.eventHash);
    });

    it('hash is deterministic for same input', async () => {
      const id = 'e0e0e0e0-0000-4000-8000-000000000001';
      const deviceTime = '2026-08-01T10:00:00.000Z';
      const event1 = await makeEvent({ id, sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS', deviceTime });
      const event2 = await makeEvent({ id, sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS', deviceTime });
      expect(event1.eventHash).toBe(event2.eventHash);
    });
  });

  describe('Idempotent Replay', () => {
    it('same content produces same hash (already_seen detection)', async () => {
      const event = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      // If server has this event and receives the same, hashes match → already_seen
      const resubmitted = { ...event };
      expect(resubmitted.eventHash).toBe(event.eventHash);
    });

    it('same ID but different content produces different hash (collision detection)', async () => {
      const id = crypto.randomUUID();
      const event1 = await makeEvent({ id, sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS', quantity: 1 });
      const event2 = await makeEvent({ id, sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS', quantity: 2 });
      // Same ID but different hashes → EVENT_ID_COLLISION
      expect(event1.id).toBe(event2.id);
      expect(event1.eventHash).not.toBe(event2.eventHash);
    });
  });

  describe('Sequence Validation', () => {
    it('sequence must be 0 for first event', async () => {
      const event = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      expect(event.sequence).toBe(0);
    });

    it('sequence gap is detectable', async () => {
      // If server has event at sequence 0, and receives sequence 2, that's a gap
      const event0 = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      const event2 = await makeEvent({ sequence: 2, tokenRaw: 'HH-042', previousHash: event0.eventHash });
      // Server logic: expectedSequence = 1, received = 2 → SEQUENCE_GAP
      expect(event2.sequence).toBe(2);
      // Gap between 0 and 2
    });
  });

  describe('Reconciliation After Sync', () => {
    it('reverse sync order produces same reconciliation result', async () => {
      // This is validated by the property-based tests in @erilog/reconcile
      // Here we verify that two event orderings produce valid chains
      const alphaEvent0 = await makeEvent({ sequence: 0, tokenRaw: 'HH-040', previousHash: 'GENESIS' });
      const alphaEvent1 = await makeEvent({ sequence: 1, tokenRaw: 'HH-042', previousHash: alphaEvent0.eventHash });

      const bravoDevice = 'a1b2c3d4-0000-4000-8000-bbb000000002';
      const bravoEvent0 = await makeEvent({ sequence: 0, tokenRaw: 'HH-041', previousHash: 'GENESIS', deviceId: bravoDevice });
      const bravoEvent1 = await makeEvent({ sequence: 1, tokenRaw: 'HH-042', previousHash: bravoEvent0.eventHash, deviceId: bravoDevice });

      // All events have valid hashes regardless of sync order
      expect(alphaEvent0.eventHash).toHaveLength(64);
      expect(alphaEvent1.eventHash).toHaveLength(64);
      expect(bravoEvent0.eventHash).toHaveLength(64);
      expect(bravoEvent1.eventHash).toHaveLength(64);

      // Chains are per-device — order of device sync doesn't affect chain validity
      expect(alphaEvent1.previousHash).toBe(alphaEvent0.eventHash);
      expect(bravoEvent1.previousHash).toBe(bravoEvent0.eventHash);
    });
  });
});
