import { eq, asc } from 'drizzle-orm';
import { reconcile } from '@erilog/reconcile';
import type { ReconciliationInput } from '@erilog/reconcile';
import type { HandoutEvent } from '@erilog/schemas';
import { db } from './db';
import { events, devices, missions, policyVersions, reconciliationSnapshots } from './schema';

/**
 * Runs reconciliation for a mission after new events are accepted.
 * Stores the immutable snapshot keyed by event_set_digest.
 */
export async function runReconciliation(missionId: string): Promise<void> {
  // Fetch all accepted events for this mission
  const missionEvents = await db
    .select()
    .from(events)
    .where(eq(events.missionId, missionId))
    .orderBy(asc(events.deviceId), asc(events.sequence));

  if (missionEvents.length === 0) return;

  // Fetch mission
  const [mission] = await db
    .select()
    .from(missions)
    .where(eq(missions.id, missionId));
  if (!mission) return;

  // Fetch latest active policy
  const [policy] = await db
    .select()
    .from(policyVersions)
    .where(eq(policyVersions.missionId, missionId))
    .orderBy(asc(policyVersions.version));
  if (!policy) return;

  // Fetch devices
  const missionDevices = await db
    .select()
    .from(devices)
    .where(eq(devices.missionId, missionId));

  // Build reconciliation input
  const reconcileEvents: HandoutEvent[] = missionEvents.map((e) => ({
    id: e.id,
    missionId: e.missionId,
    deviceId: e.deviceId,
    policyVersion: e.policyVersion,
    sequence: e.sequence,
    tokenHash: e.tokenHash,
    itemType: e.itemType,
    quantity: e.quantity,
    deviceTime: e.deviceTime.toISOString(),
    previousHash: e.previousHash,
    eventHash: e.eventHash,
  }));

  const input: ReconciliationInput = {
    policy: policy.policy as ReconciliationInput['policy'],
    events: reconcileEvents,
    devices: missionDevices.map((d) => ({
      deviceId: d.id,
      allocation: d.allocation,
    })),
    initialStock: mission.totalStock,
  };

  const result = await reconcile(input);

  // Upsert snapshot (keyed by mission + event_set_digest)
  await db
    .insert(reconciliationSnapshots)
    .values({
      missionId,
      eventSetDigest: result.eventSetDigest,
      summary: result.summary,
      exceptions: result.exceptions,
    })
    .onConflictDoNothing();
}
