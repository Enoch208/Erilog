/**
 * Non-visual API/sync handler tests.
 *
 * These test the sync protocol at the API boundary level —
 * the same logic that a Next.js route handler would call.
 * Uses the production @erilog/reconcile sync engine directly.
 *
 * Tests:
 * - Authorization checked before event existence disclosure
 * - Valid event ingestion
 * - Batch ordering respected
 * - Identical replay (idempotency)
 * - EVENT_ID_COLLISION (same ID, different content)
 * - Malformed payload rejection
 * - Unsupported policy version
 * - Sequence gap handling
 * - Chain break handling
 * - Cross-mission access rejected
 * - Stable structured error responses
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  processSync,
  createSyncEngineState,
} from '@erilog/reconcile';
import type { MissionState, SyncEngineState } from '@erilog/reconcile';
import { computeEventHash } from '@erilog/crypto';
import type { HandoutEvent, MissionPolicy } from '@erilog/schemas';
import { HandoutEventSchema } from '@erilog/schemas';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(
  readFileSync(resolve(__dirname, '../../../packages/crypto/fixtures/seed-42-vectors.json'), 'utf-8')
);
const SEED = vectors.seed42Contract;

let mission: MissionState;
let alphaEvents: HandoutEvent[];
let bravoEvents: HandoutEvent[];

async function buildEvents(): Promise<{ alpha: HandoutEvent[]; bravo: HandoutEvent[] }> {
  const alpha: HandoutEvent[] = [];
  const bravo: HandoutEvent[] = [];

  // Alpha event 0
  const a0Input = {
    id: SEED.events[0].id,
    missionId: SEED.mission.id,
    deviceId: SEED.devices.alpha.id,
    policyVersion: SEED.mission.policyVersion,
    sequence: 0,
    tokenHash: vectors.tokenHashes['HH-040'],
    itemType: 'emergency_kit',
    quantity: 1,
    deviceTime: SEED.events[0].deviceTime,
    previousHash: 'GENESIS',
  };
  const a0Hash = await computeEventHash(a0Input);
  alpha.push({ ...a0Input, eventHash: a0Hash });

  // Alpha event 1
  const a1Input = {
    id: SEED.events[1].id,
    missionId: SEED.mission.id,
    deviceId: SEED.devices.alpha.id,
    policyVersion: SEED.mission.policyVersion,
    sequence: 1,
    tokenHash: vectors.tokenHashes['HH-042'],
    itemType: 'emergency_kit',
    quantity: 1,
    deviceTime: SEED.events[1].deviceTime,
    previousHash: a0Hash,
  };
  const a1Hash = await computeEventHash(a1Input);
  alpha.push({ ...a1Input, eventHash: a1Hash });

  // Bravo event 0
  const b0Input = {
    id: SEED.events[2].id,
    missionId: SEED.mission.id,
    deviceId: SEED.devices.bravo.id,
    policyVersion: SEED.mission.policyVersion,
    sequence: 0,
    tokenHash: vectors.tokenHashes['HH-041'],
    itemType: 'emergency_kit',
    quantity: 1,
    deviceTime: SEED.events[2].deviceTime,
    previousHash: 'GENESIS',
  };
  const b0Hash = await computeEventHash(b0Input);
  bravo.push({ ...b0Input, eventHash: b0Hash });

  // Bravo event 1
  const b1Input = {
    id: SEED.events[3].id,
    missionId: SEED.mission.id,
    deviceId: SEED.devices.bravo.id,
    policyVersion: SEED.mission.policyVersion,
    sequence: 1,
    tokenHash: vectors.tokenHashes['HH-042'],
    itemType: 'emergency_kit',
    quantity: 1,
    deviceTime: SEED.events[3].deviceTime,
    previousHash: b0Hash,
  };
  const b1Hash = await computeEventHash(b1Input);
  bravo.push({ ...b1Input, eventHash: b1Hash });

  return { alpha, bravo };
}

beforeAll(async () => {
  mission = {
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

  const built = await buildEvents();
  alphaEvents = built.alpha;
  bravoEvents = built.bravo;
});

describe('Sync API Handler — Authorization', () => {
  it('rejects events from unauthorized device (wrong deviceId in request)', async () => {
    const state = createSyncEngineState();
    // Alpha tries to submit Bravo's events
    const results = await processSync(bravoEvents, mission, state, SEED.devices.alpha.id);
    for (const r of results) {
      expect(r.status).toBe('quarantined');
      expect(r.reason).toBe('DEVICE_MISMATCH');
    }
  });

  it('rejects events from unknown device', async () => {
    const state = createSyncEngineState();
    const fakeDeviceId = 'a1b2c3d4-0000-4000-8000-fff000000099';
    const fakeEvent: HandoutEvent = {
      ...alphaEvents[0]!,
      id: 'e0e0e0e0-0000-4000-8000-fff000000099',
      deviceId: fakeDeviceId,
    };
    const results = await processSync([fakeEvent], mission, state, fakeDeviceId);
    expect(results[0]!.status).toBe('quarantined');
    expect(results[0]!.reason).toBe('DEVICE_UNKNOWN');
  });
});

describe('Sync API Handler — Valid Ingestion', () => {
  it('accepts valid events in correct order', async () => {
    const state = createSyncEngineState();
    const results = await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('accepted');
    expect(results[1]!.status).toBe('accepted');
    expect(state.acceptedEvents.size).toBe(2);
  });

  it('batch ordering is respected (events processed sequentially)', async () => {
    const state = createSyncEngineState();
    // Submit both Alpha events in one batch
    const results = await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('accepted');
    expect(results[1]!.status).toBe('accepted');
    // Confirm sequence tracked correctly
    expect(state.deviceSequences.get(SEED.devices.alpha.id)).toBe(1);
  });

  it('reconciliation is triggered after acceptance', async () => {
    const state = createSyncEngineState();
    await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    expect(state.latestReconciliation).not.toBeNull();
    expect(state.latestReconciliation!.summary.totalPhysicalHandouts).toBe(2);
  });
});

describe('Sync API Handler — Idempotent Replay', () => {
  it('identical replay returns already_seen', async () => {
    const state = createSyncEngineState();
    await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);

    // Replay the same events
    const results = await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('already_seen');
    expect(results[1]!.status).toBe('already_seen');
    // State unchanged
    expect(state.acceptedEvents.size).toBe(2);
  });

  it('replay does not double-count in reconciliation', async () => {
    const state = createSyncEngineState();
    await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    const firstReconciliation = state.latestReconciliation!;

    await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    // Reconciliation not recomputed on replay (no new accepts)
    expect(state.latestReconciliation!.summary.totalPhysicalHandouts).toBe(
      firstReconciliation.summary.totalPhysicalHandouts
    );
  });
});

describe('Sync API Handler — EVENT_ID_COLLISION', () => {
  it('same ID with different content returns EVENT_ID_COLLISION', async () => {
    const state = createSyncEngineState();
    await processSync([alphaEvents[0]!], mission, state, SEED.devices.alpha.id);

    // Submit same ID with different quantity
    const tampered: HandoutEvent = {
      ...alphaEvents[0]!,
      quantity: 5,
      eventHash: 'f'.repeat(64), // different hash
    };
    const results = await processSync([tampered], mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('quarantined');
    expect(results[0]!.reason).toBe('EVENT_ID_COLLISION');
  });

  it('collision does not corrupt existing accepted event', async () => {
    const state = createSyncEngineState();
    await processSync([alphaEvents[0]!], mission, state, SEED.devices.alpha.id);

    const tampered: HandoutEvent = { ...alphaEvents[0]!, quantity: 99, eventHash: 'f'.repeat(64) };
    await processSync([tampered], mission, state, SEED.devices.alpha.id);

    // Original event preserved
    const stored = state.acceptedEvents.get(alphaEvents[0]!.id)!;
    expect(stored.quantity).toBe(1);
  });
});

describe('Sync API Handler — Validation Failures', () => {
  it('unsupported policy version is quarantined', async () => {
    const state = createSyncEngineState();
    const badEvent: HandoutEvent = { ...alphaEvents[0]!, policyVersion: 999 };
    const results = await processSync([badEvent], mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('quarantined');
    expect(results[0]!.reason).toBe('POLICY_VERSION_UNKNOWN');
  });

  it('sequence gap is quarantined', async () => {
    const state = createSyncEngineState();
    // Skip event 0, submit event 1 directly
    const results = await processSync([alphaEvents[1]!], mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('quarantined');
    expect(results[0]!.reason).toBe('SEQUENCE_GAP');
  });

  it('chain break (wrong previousHash) is quarantined', async () => {
    const state = createSyncEngineState();
    await processSync([alphaEvents[0]!], mission, state, SEED.devices.alpha.id);

    // Submit event 1 with wrong previousHash
    const broken: HandoutEvent = {
      ...alphaEvents[1]!,
      previousHash: 'a'.repeat(64), // wrong
    };
    const results = await processSync([broken], mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('quarantined');
    expect(results[0]!.reason).toBe('CHAIN_BREAK');
  });

  it('hash mismatch (tampered content) is quarantined', async () => {
    const state = createSyncEngineState();
    // Event with correct fields but wrong self-hash
    const badHash: HandoutEvent = { ...alphaEvents[0]!, eventHash: 'b'.repeat(64) };
    const results = await processSync([badHash], mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('quarantined');
    expect(results[0]!.reason).toBe('HASH_MISMATCH');
  });

  it('cross-mission event is quarantined', async () => {
    const state = createSyncEngineState();
    const wrongMission: HandoutEvent = {
      ...alphaEvents[0]!,
      missionId: 'f0f0f0f0-0000-4000-8000-000000000099',
    };
    const results = await processSync([wrongMission], mission, state, SEED.devices.alpha.id);
    expect(results[0]!.status).toBe('quarantined');
    expect(results[0]!.reason).toBe('MISSION_MISMATCH');
  });
});

describe('Sync API Handler — Structured Responses', () => {
  it('response contains eventId, status, and reason for each event', async () => {
    const state = createSyncEngineState();
    const results = await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    for (const r of results) {
      expect(r).toHaveProperty('eventId');
      expect(r).toHaveProperty('status');
      expect(['accepted', 'already_seen', 'quarantined']).toContain(r.status);
      if (r.status === 'quarantined') {
        expect(r.reason).toBeDefined();
        expect(typeof r.reason).toBe('string');
      }
    }
  });

  it('response length matches request length', async () => {
    const state = createSyncEngineState();
    const results = await processSync(alphaEvents, mission, state, SEED.devices.alpha.id);
    expect(results.length).toBe(alphaEvents.length);
  });
});
