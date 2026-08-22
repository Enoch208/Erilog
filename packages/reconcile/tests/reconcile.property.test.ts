import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { reconcile } from '../src/reconcile.js';
import { canonicalize } from '@erilog/crypto';
import type { ReconciliationInput } from '../src/types.js';
import { arbitraryReconciliationInput, arbitraryInputWithDuplicateToken } from './arbitraries.js';

describe('Property-Based Tests', () => {
  // INV-003: Merge-order independence
  it('P1: produces identical output for any permutation of the same event set', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryReconciliationInput({ minEvents: 2, maxEvents: 8 }),
        async (input) => {
          const reference = await reconcile(input);
          const referenceCanonical = canonicalize(reference);

          // Create 10 random permutations
          for (let i = 0; i < 10; i++) {
            const shuffled = [...input.events].sort(() => Math.random() - 0.5);
            const permutedInput: ReconciliationInput = { ...input, events: shuffled };
            const result = await reconcile(permutedInput);
            expect(canonicalize(result)).toBe(referenceCanonical);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // INV-002: Idempotent replay
  it('P2: reconciling with a duplicated event ID yields the same result', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryReconciliationInput({ minEvents: 2, maxEvents: 8 }),
        fc.nat({ max: 100 }),
        async (input, pickIdx) => {
          const idx = pickIdx % input.events.length;
          const duplicatedEvent = input.events[idx]!;

          // Deduplicate by event ID (what the server does)
          const withDup = [...input.events, duplicatedEvent];
          const deduped = [...new Map(withDup.map((e) => [e.id, e])).values()];

          expect(deduped.length).toBe(input.events.length);

          const original = await reconcile(input);
          const afterDedup = await reconcile({ ...input, events: deduped });
          expect(canonicalize(afterDedup)).toBe(canonicalize(original));
        }
      ),
      { numRuns: 100 }
    );
  });

  // INV-004: Physical stock conservation
  it('P3: remaining = initial - sum(all event quantities)', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryReconciliationInput({ minEvents: 1, maxEvents: 20 }),
        async (input) => {
          const result = await reconcile(input);

          for (const itemType of Object.keys(input.initialStock)) {
            const eventTotal = input.events
              .filter((e) => e.itemType === itemType)
              .reduce((sum, e) => sum + e.quantity, 0);

            expect(result.summary.distributed[itemType] ?? 0).toBe(eventTotal);
            expect(result.summary.remaining[itemType])
              .toBe(input.initialStock[itemType]! - eventTotal);
          }

          expect(result.summary.totalPhysicalHandouts).toBe(input.events.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  // INV-005: Duplicate visibility
  it('P4: all events sharing a token beyond allowance appear as peers in one exception', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryInputWithDuplicateToken({ minDups: 2, maxDups: 4 }),
        async (input) => {
          const result = await reconcile(input);

          // Find which tokens have duplicates
          const tokenCounts = new Map<string, string[]>();
          for (const event of input.events) {
            const key = event.tokenHash + '\x00' + event.itemType;
            const ids = tokenCounts.get(key) ?? [];
            ids.push(event.id);
            tokenCounts.set(key, ids);
          }

          for (const [key, ids] of tokenCounts) {
            if (ids.length <= 1) continue;
            const tokenHash = key.split('\x00')[0]!;

            const exception = result.exceptions.find(
              (ex) => ex.type === 'duplicate_entitlement' && ex.tokenHash === tokenHash
            );

            expect(exception).toBeDefined();
            expect(exception!.eventIds).toEqual(ids.sort());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // INV-001: Event preservation
  it('P5: every event contributes its full quantity to distributed stock', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryReconciliationInput({ minEvents: 1, maxEvents: 15 }),
        async (input) => {
          const result = await reconcile(input);

          // Sum distributed must equal sum of all event quantities
          const expectedByType = new Map<string, number>();
          for (const event of input.events) {
            expectedByType.set(
              event.itemType,
              (expectedByType.get(event.itemType) ?? 0) + event.quantity
            );
          }

          for (const [itemType, expected] of expectedByType) {
            expect(result.summary.distributed[itemType]).toBe(expected);
          }

          // Events in exceptions are NOT excluded from stock
          const exceptedEventIds = new Set(
            result.exceptions.flatMap((ex) => ex.eventIds)
          );
          const exceptedQuantity = input.events
            .filter((e) => exceptedEventIds.has(e.id))
            .reduce((sum, e) => sum + e.quantity, 0);

          const totalDistributed = Object.values(result.summary.distributed)
            .reduce((a, b) => a + b, 0);
          expect(totalDistributed).toBeGreaterThanOrEqual(exceptedQuantity);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Erilog-specific: No winner selection
  it('P6: duplicate_entitlement exceptions never designate a winner', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryInputWithDuplicateToken({ minDups: 2, maxDups: 4 }),
        async (input) => {
          const result = await reconcile(input);

          const dupExceptions = result.exceptions.filter(
            (ex) => ex.type === 'duplicate_entitlement'
          );

          for (const exception of dupExceptions) {
            expect(exception.eventIds.length).toBeGreaterThanOrEqual(2);
            expect(exception.eventIds).toEqual([...exception.eventIds].sort());

            // Quantities and timestamps ordered by same sorted eventIds
            const eventsById = new Map(input.events.map((e) => [e.id, e]));
            const expectedQuantities = exception.eventIds.map(
              (id) => eventsById.get(id)!.quantity
            );
            const expectedTimestamps = exception.eventIds.map(
              (id) => eventsById.get(id)!.deviceTime
            );
            expect(exception.quantities).toEqual(expectedQuantities);
            expect(exception.timestamps).toEqual(expectedTimestamps);

            // No structural favoritism
            const exKeys = Object.keys(exception);
            expect(exKeys).not.toContain('winnerId');
            expect(exKeys).not.toContain('originalId');
            expect(exKeys).not.toContain('primaryEventId');
            expect(exKeys).not.toContain('duplicateEventId');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // INV-007: Resolution append-only
  it('P7: reconciliation result unchanged by re-running with same events', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryInputWithDuplicateToken({ minDups: 2, maxDups: 3 }),
        async (input) => {
          const result1 = await reconcile(input);
          const result2 = await reconcile(input);

          // Same input = same output (resolution is external, not in input)
          expect(canonicalize(result1)).toBe(canonicalize(result2));

          // ReconciliationInput has no 'resolutions' field
          expect(input).not.toHaveProperty('resolutions');
        }
      ),
      { numRuns: 50 }
    );
  });

  // Deterministic exception IDs
  it('P8: exception IDs are deterministic across runs', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryInputWithDuplicateToken({ minDups: 2, maxDups: 3 }),
        async (input) => {
          const result1 = await reconcile(input);
          const result2 = await reconcile(input);

          expect(result1.exceptions.map((e) => e.id))
            .toEqual(result2.exceptions.map((e) => e.id));
        }
      ),
      { numRuns: 50 }
    );
  });
});
