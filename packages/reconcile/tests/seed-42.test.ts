import { describe, it, expect } from 'vitest';
import { reconcile } from '../src/reconcile.js';
import type { ReconciliationInput } from '../src/types.js';
import type { HandoutEvent, MissionPolicy } from '@erilog/schemas';
import { computeEventHash, canonicalize } from '@erilog/crypto';
import vectors from '../../crypto/fixtures/seed-42-vectors.json';
import expectedSnapshot from '../fixtures/seed-42-expected.json';

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
    events.push({ ...hashInput, eventHash });
  }

  return events;
}

describe('Seed-42 Determinism Snapshot', () => {
  it('reconcile(seed42Input) produces byte-exact expected output', async () => {
    const events = await buildSeed42Events();
    const input: ReconciliationInput = {
      policy: SEED.policy as MissionPolicy,
      events,
      devices: [
        { deviceId: SEED.devices.alpha.id, allocation: SEED.devices.alpha.allocation },
        { deviceId: SEED.devices.bravo.id, allocation: SEED.devices.bravo.allocation },
      ],
      initialStock: SEED.mission.totalStock,
    };

    const result = await reconcile(input);
    const resultCanonical = canonicalize(result);
    const expectedCanonical = canonicalize(expectedSnapshot);

    expect(resultCanonical).toBe(expectedCanonical);
  });
});
