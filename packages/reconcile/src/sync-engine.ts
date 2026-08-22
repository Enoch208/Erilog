/**
 * Headless sync engine.
 *
 * Implements the server-side sync protocol from design.md Section 5.4
 * as a pure in-memory module. This is the same logic that runs against
 * PostgreSQL in the real server — extracted for testability and the
 * headless demo.
 *
 * Validates: schema, mission membership, device authorization, policy version,
 * sequence continuity, hash-chain integrity, idempotency, and EVENT_ID_COLLISION.
 */

import type { HandoutEvent, MissionPolicy, DeviceAllocation } from '@erilog/schemas';
import { HandoutEventSchema } from '@erilog/schemas';
import { computeEventHash, toHashInput, canonicalize } from '@erilog/crypto';
import { reconcile } from './reconcile.js';
import type { ReconciliationResult } from './types.js';

export interface SyncResultItem {
  eventId: string;
  status: 'accepted' | 'already_seen' | 'quarantined';
  reason?: string;
}

export interface MissionState {
  missionId: string;
  policy: MissionPolicy;
  policyVersion: number;
  devices: DeviceAllocation[];
  initialStock: Record<string, number>;
  /** All device IDs belonging to this mission */
  deviceIds: Set<string>;
  /** Token hashes that are valid for this mission */
  validTokenHashes: Set<string>;
}

export interface SyncEngineState {
  /** Accepted events, keyed by event ID */
  acceptedEvents: Map<string, HandoutEvent>;
  /** Per-device: highest accepted sequence number */
  deviceSequences: Map<string, number>;
  /** Latest reconciliation result */
  latestReconciliation: ReconciliationResult | null;
}

/**
 * Create a fresh sync engine state.
 */
export function createSyncEngineState(): SyncEngineState {
  return {
    acceptedEvents: new Map(),
    deviceSequences: new Map(),
    latestReconciliation: null,
  };
}

/**
 * Process a batch of events through the sync protocol.
 *
 * Returns per-event results and updates state in place.
 * Authorization must be checked by the caller before calling this.
 */
export async function processSync(
  events: HandoutEvent[],
  mission: MissionState,
  state: SyncEngineState,
  requestDeviceId: string
): Promise<SyncResultItem[]> {
  const results: SyncResultItem[] = [];

  for (const event of events) {
    const result = await processSingleEvent(event, mission, state, requestDeviceId);
    results.push(result);
  }

  // If any event was accepted, recompute reconciliation
  const anyAccepted = results.some((r) => r.status === 'accepted');
  if (anyAccepted) {
    const allEvents = [...state.acceptedEvents.values()];
    state.latestReconciliation = await reconcile({
      policy: mission.policy,
      events: allEvents,
      devices: mission.devices,
      initialStock: mission.initialStock,
    });
  }

  return results;
}

async function processSingleEvent(
  event: HandoutEvent,
  mission: MissionState,
  state: SyncEngineState,
  requestDeviceId: string
): Promise<SyncResultItem> {
  // Step 1: Schema validation
  const parsed = HandoutEventSchema.safeParse(event);
  if (!parsed.success) {
    return { eventId: event.id, status: 'quarantined', reason: 'SCHEMA_INVALID' };
  }

  // Step 2: Mission membership
  if (event.missionId !== mission.missionId) {
    return { eventId: event.id, status: 'quarantined', reason: 'MISSION_MISMATCH' };
  }

  // Step 3: Device authorization
  if (event.deviceId !== requestDeviceId) {
    return { eventId: event.id, status: 'quarantined', reason: 'DEVICE_MISMATCH' };
  }

  if (!mission.deviceIds.has(event.deviceId)) {
    return { eventId: event.id, status: 'quarantined', reason: 'DEVICE_UNKNOWN' };
  }

  // Step 4: Policy version
  if (event.policyVersion !== mission.policyVersion) {
    return { eventId: event.id, status: 'quarantined', reason: 'POLICY_VERSION_UNKNOWN' };
  }

  // Step 5: Idempotency check (three-way)
  const existing = state.acceptedEvents.get(event.id);
  if (existing) {
    // Same ID exists — check content equality
    const existingCanonical = canonicalize(toHashInput(existing));
    const submittedCanonical = canonicalize(toHashInput(event));

    if (existingCanonical === submittedCanonical && existing.eventHash === event.eventHash) {
      return { eventId: event.id, status: 'already_seen' };
    } else {
      return { eventId: event.id, status: 'quarantined', reason: 'EVENT_ID_COLLISION' };
    }
  }

  // Step 6: Sequence validation
  const lastSeq = state.deviceSequences.get(event.deviceId) ?? -1;
  const expectedSeq = lastSeq + 1;
  if (event.sequence !== expectedSeq) {
    return { eventId: event.id, status: 'quarantined', reason: 'SEQUENCE_GAP' };
  }

  // Step 7: Chain validation
  if (event.sequence === 0) {
    if (event.previousHash !== 'GENESIS') {
      return { eventId: event.id, status: 'quarantined', reason: 'CHAIN_BREAK' };
    }
  } else {
    // Find the previous event for this device
    const prevEvent = [...state.acceptedEvents.values()]
      .find((e) => e.deviceId === event.deviceId && e.sequence === event.sequence - 1);
    if (!prevEvent) {
      return { eventId: event.id, status: 'quarantined', reason: 'CHAIN_BREAK' };
    }
    if (event.previousHash !== prevEvent.eventHash) {
      return { eventId: event.id, status: 'quarantined', reason: 'CHAIN_BREAK' };
    }
  }

  // Step 8: Hash verification
  const computedHash = await computeEventHash(toHashInput(event));
  if (computedHash !== event.eventHash) {
    return { eventId: event.id, status: 'quarantined', reason: 'HASH_MISMATCH' };
  }

  // Step 9: Accept
  state.acceptedEvents.set(event.id, event);
  state.deviceSequences.set(event.deviceId, event.sequence);

  return { eventId: event.id, status: 'accepted' };
}
