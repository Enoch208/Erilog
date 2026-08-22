import { describe, it, expect } from 'vitest';
import { reconcile } from '../src/reconcile.js';
import type { ReconciliationInput } from '../src/types.js';
import type { HandoutEvent, MissionPolicy } from '@erilog/schemas';
import { computeEventHash, sha256Hex } from '@erilog/crypto';
import vectors from '../../crypto/fixtures/seed-42-vectors.json';

const SEED = vectors.seed42Contract;

async function buildSeed42Events(): Promise<HandoutEvent[]> {
  const events: HandoutEvent[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < SEED.events.length; i++) {
    const ev = SEED.events[i]!;
    const tokenHash = vectors.tokenHashes[ev.tokenRaw as keyof typeof vectors.tokenHashes];
    const previousHash = ev.previousHash
      ? ev.previousHash
      : hashes[i === 1 ? 0 : 2]!;

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

    events.push({
      ...hashInput,
      eventHash,
    });
  }

  return events;
}

function buildSeed42Input(events: HandoutEvent[]): ReconciliationInput {
  return {
    policy: SEED.policy as MissionPolicy,
    events,
    devices: [
      { deviceId: SEED.devices.alpha.id, allocation: SEED.devices.alpha.allocation },
      { deviceId: SEED.devices.bravo.id, allocation: SEED.devices.bravo.allocation },
    ],
    initialStock: SEED.mission.totalStock,
  };
}

describe('reconcile()', () => {
  describe('Seed-42 scenario', () => {
    it('produces correct stock summary', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      expect(result.summary.missionId).toBe(SEED.mission.id);
      expect(result.summary.initialStock).toEqual({ emergency_kit: 100 });
      expect(result.summary.distributed).toEqual({ emergency_kit: 4 });
      expect(result.summary.remaining).toEqual({ emergency_kit: 96 });
      expect(result.summary.uniqueTokensServed).toBe(3);
      expect(result.summary.totalPhysicalHandouts).toBe(4);
    });

    it('produces exactly 1 duplicate_entitlement exception', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      expect(result.exceptions.length).toBe(1);
      expect(result.exceptions[0]!.type).toBe('duplicate_entitlement');
    });

    it('exception references HH-042 token hash', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      expect(result.exceptions[0]!.tokenHash).toBe(vectors.tokenHashes['HH-042']);
    });

    it('exception contains both events as peers (sorted)', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      const exc = result.exceptions[0]!;
      expect(exc.eventIds.length).toBe(2);
      expect(exc.eventIds).toEqual([...exc.eventIds].sort());
      // Both event IDs for HH-042
      expect(exc.eventIds).toContain('e0e0e0e0-0000-4000-8000-000000000002');
      expect(exc.eventIds).toContain('e0e0e0e0-0000-4000-8000-000000000004');
    });

    it('exception references both devices', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      const exc = result.exceptions[0]!;
      expect(exc.deviceIds.length).toBe(2);
      expect(exc.deviceIds).toContain(SEED.devices.alpha.id);
      expect(exc.deviceIds).toContain(SEED.devices.bravo.id);
    });

    it('has NO winner/original/duplicate designation', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      const exc = result.exceptions[0]! as Record<string, unknown>;
      expect(exc).not.toHaveProperty('winnerId');
      expect(exc).not.toHaveProperty('originalId');
      expect(exc).not.toHaveProperty('primaryEventId');
      expect(exc).not.toHaveProperty('duplicateEventId');
    });

    it('eventSetDigest matches frozen vector', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      expect(result.eventSetDigest).toBe(vectors.eventSetDigest);
    });

    it('has no computedAt or environmental time in result', async () => {
      const events = await buildSeed42Events();
      const input = buildSeed42Input(events);
      const result = await reconcile(input);

      const resultObj = result as Record<string, unknown>;
      expect(resultObj).not.toHaveProperty('computedAt');
      const summaryObj = result.summary as Record<string, unknown>;
      expect(summaryObj).not.toHaveProperty('computedAt');
    });
  });

  describe('Edge cases', () => {
    it('empty event set produces zero-distributed summary', async () => {
      const input: ReconciliationInput = {
        policy: SEED.policy as MissionPolicy,
        events: [],
        devices: [],
        initialStock: { emergency_kit: 100 },
      };
      const result = await reconcile(input);

      expect(result.summary.distributed).toEqual({});
      expect(result.summary.remaining).toEqual({ emergency_kit: 100 });
      expect(result.summary.totalPhysicalHandouts).toBe(0);
      expect(result.summary.uniqueTokensServed).toBe(0);
      expect(result.exceptions.length).toBe(0);
    });

    it('single event produces no exceptions', async () => {
      const events = await buildSeed42Events();
      const input: ReconciliationInput = {
        policy: SEED.policy as MissionPolicy,
        events: [events[0]!],
        devices: [{ deviceId: SEED.devices.alpha.id, allocation: SEED.devices.alpha.allocation }],
        initialStock: { emergency_kit: 100 },
      };
      const result = await reconcile(input);

      expect(result.summary.distributed).toEqual({ emergency_kit: 1 });
      expect(result.summary.remaining).toEqual({ emergency_kit: 99 });
      expect(result.exceptions.length).toBe(0);
    });
  });
});
