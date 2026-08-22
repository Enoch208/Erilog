import * as fc from 'fast-check';
import type { HandoutEvent, MissionPolicy, DeviceAllocation } from '@erilog/schemas';
import type { ReconciliationInput } from '../src/types.js';
import { computeEventHash } from '@erilog/crypto';

const ITEM_TYPES = ['emergency_kit', 'blanket', 'water_pack'] as const;
const SALT = 'testsalt0000000000000000000000000';

/**
 * Generate a valid UUID v4 string.
 */
export const arbUUID = fc.uuid().map((u) => u.toLowerCase());

/**
 * Generate a valid SHA-256 hex hash (64 lowercase hex chars).
 */
export const arbSHA256 = fc.hexaString({ minLength: 64, maxLength: 64 }).map((s) => s.toLowerCase());

/**
 * Generate a valid token hash.
 */
export const arbTokenHash = arbSHA256;

/**
 * Generate a valid item type.
 */
export const arbItemType = fc.constantFrom(...ITEM_TYPES);

/**
 * Build a set of HandoutEvents with valid hash chains for one or more devices.
 * Returns events and the policy/devices/stock needed for a ReconciliationInput.
 */
export function arbitraryReconciliationInput(opts: {
  minEvents?: number;
  maxEvents?: number;
  maxDevices?: number;
  forceDuplicateToken?: boolean;
} = {}): fc.Arbitrary<ReconciliationInput> {
  const minEvents = opts.minEvents ?? 1;
  const maxEvents = opts.maxEvents ?? 10;
  const maxDevices = opts.maxDevices ?? 3;

  return fc.integer({ min: 1, max: maxDevices }).chain((numDevices) =>
    fc.integer({ min: minEvents, max: maxEvents }).chain((numEvents) =>
      fc.tuple(
        // Device IDs
        fc.array(arbUUID, { minLength: numDevices, maxLength: numDevices }),
        // Token hashes to use (some may repeat for duplicates)
        fc.array(arbTokenHash, { minLength: 1, maxLength: Math.max(1, numEvents - 1) }),
        // Event UUIDs
        fc.array(arbUUID, { minLength: numEvents, maxLength: numEvents }),
        // Quantities (1 each for simplicity)
        fc.array(fc.integer({ min: 1, max: 1 }), { minLength: numEvents, maxLength: numEvents }),
      ).map(([deviceIds, tokenPool, eventIds, quantities]) => {
        // Distribute events across devices
        const events: Omit<HandoutEvent, 'eventHash'>[] = [];
        const deviceSeqs = new Map<string, number>();

        for (let i = 0; i < numEvents; i++) {
          const deviceIdx = i % numDevices;
          const deviceId = deviceIds[deviceIdx]!;
          const seq = deviceSeqs.get(deviceId) ?? 0;
          deviceSeqs.set(deviceId, seq + 1);

          const tokenHash = opts.forceDuplicateToken && i > 0
            ? tokenPool[0]! // Force duplicate
            : tokenPool[i % tokenPool.length]!;

          events.push({
            id: eventIds[i]!,
            missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
            deviceId,
            policyVersion: 0,
            sequence: seq,
            tokenHash,
            itemType: 'emergency_kit',
            quantity: quantities[i]!,
            deviceTime: new Date(2026, 7, 22, 10, i).toISOString(),
            previousHash: 'GENESIS', // Simplified — not computing real chains for property tests
          });
        }

        // Build full events with placeholder hashes (property tests don't validate chains)
        const fullEvents: HandoutEvent[] = events.map((e) => ({
          ...e,
          eventHash: 'a'.repeat(64), // Placeholder — reconcile doesn't verify hashes
        }));

        const devices: DeviceAllocation[] = deviceIds.map((id) => ({
          deviceId: id,
          allocation: { emergency_kit: 1000 }, // Large so no device overspend
        }));

        const policy: MissionPolicy = {
          items: [{ type: 'emergency_kit', unit: 'kit' }],
          allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
          tokenSalt: SALT,
        };

        return {
          policy,
          events: fullEvents,
          devices,
          initialStock: { emergency_kit: 10000 },
        };
      })
    )
  );
}

/**
 * Generate input that guarantees at least one duplicate token across events.
 */
export function arbitraryInputWithDuplicateToken(opts: {
  minDups?: number;
  maxDups?: number;
} = {}): fc.Arbitrary<ReconciliationInput> {
  const minDups = opts.minDups ?? 2;
  const maxDups = opts.maxDups ?? 4;

  return fc.integer({ min: minDups, max: maxDups }).chain((numDups) =>
    fc.tuple(
      arbTokenHash, // The shared token
      fc.array(arbUUID, { minLength: numDups, maxLength: numDups }), // Event IDs
      fc.array(arbUUID, { minLength: numDups, maxLength: numDups }), // Device IDs
    ).map(([sharedToken, eventIds, deviceIds]) => {
      const events: HandoutEvent[] = eventIds.map((id, i) => ({
        id,
        missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
        deviceId: deviceIds[i]!,
        policyVersion: 0,
        sequence: 0,
        tokenHash: sharedToken,
        itemType: 'emergency_kit',
        quantity: 1,
        deviceTime: new Date(2026, 7, 22, 10, i).toISOString(),
        previousHash: 'GENESIS',
        eventHash: 'a'.repeat(64),
      }));

      const devices: DeviceAllocation[] = deviceIds.map((id) => ({
        deviceId: id,
        allocation: { emergency_kit: 1000 },
      }));

      return {
        policy: {
          items: [{ type: 'emergency_kit', unit: 'kit' }],
          allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
          tokenSalt: SALT,
        },
        events,
        devices,
        initialStock: { emergency_kit: 10000 },
      };
    })
  );
}
