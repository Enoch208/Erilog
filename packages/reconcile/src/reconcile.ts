import type { ReconciliationInput, ReconciliationResult } from './types.js';
import { sha256Hex } from '@erilog/crypto';
import { computeStock } from './stock.js';
import { canonicalSortEvents } from './normalize.js';
import {
  detectDuplicateEntitlements,
  detectEventOverspend,
  detectDeviceOverspend,
} from './exceptions.js';

/**
 * Pure reconciliation function.
 *
 * Takes (policy + events + devices + initialStock) and produces
 * (summary + exceptions + eventSetDigest) deterministically.
 *
 * Properties:
 * - Same inputs, any order → same output (merge-order independence).
 * - No timestamps or environmental data in result.
 * - All events count toward physical stock regardless of exception status.
 * - All events in a duplicate exception are peers (no winner).
 * - Exception IDs derived deterministically from sorted event IDs + type.
 */
export async function reconcile(input: ReconciliationInput): Promise<ReconciliationResult> {
  const { policy, events, devices, initialStock } = input;

  // Step 1: Compute event set digest (deterministic: sorted IDs joined by newline)
  const sortedEventIds = events.map((e) => e.id).sort();
  const eventSetDigest = await sha256Hex(sortedEventIds.join('\n'));

  // Step 2: Canonical sort for deterministic processing
  const sortedEvents = canonicalSortEvents(events);

  // Step 3: Get mission ID from events (all should share one)
  const missionId = events.length > 0 ? events[0]!.missionId : '';

  // Step 4: Physical stock computation — every event counts
  const summary = computeStock(missionId, sortedEvents, initialStock);

  // Step 5: Exception detection
  const duplicateExceptions = await detectDuplicateEntitlements(sortedEvents, policy);
  const eventOverspendExceptions = await detectEventOverspend(sortedEvents, policy);
  const deviceOverspendExceptions = await detectDeviceOverspend(sortedEvents, devices);

  // Step 6: Combine and sort exceptions by ID for deterministic output
  const allExceptions = [
    ...duplicateExceptions,
    ...eventOverspendExceptions,
    ...deviceOverspendExceptions,
  ].sort((a, b) => a.id.localeCompare(b.id));

  return {
    summary,
    exceptions: allExceptions,
    eventSetDigest,
  };
}
