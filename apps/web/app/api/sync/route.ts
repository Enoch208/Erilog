import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { SyncRequestSchema } from '@erilog/schemas';
import { computeEventHash, toHashInput } from '@erilog/crypto';
import { db } from '@/lib/server/db';
import { events, devices, policyVersions } from '@/lib/server/schema';
import { validateSession } from '@/lib/server/session';
import { runReconciliation } from '@/lib/server/reconcile-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Auth gate
  const session = await validateSession();
  if (!session.valid || !session.missionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate body
  const body = await request.json();
  const parsed = SyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { deviceId, missionId, events: submittedEvents } = parsed.data;

  // 3. Verify mission matches session
  if (missionId !== session.missionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 4. Verify device belongs to this mission
  const [device] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.id, deviceId), eq(devices.missionId, missionId)));

  if (!device) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 5. Process events
  const results: { eventId: string; status: string; reason?: string }[] = [];
  let anyAccepted = false;

  for (const event of submittedEvents) {
    // Validate device match
    if (event.deviceId !== deviceId) {
      results.push({ eventId: event.id, status: 'quarantined', reason: 'DEVICE_MISMATCH' });
      continue;
    }

    // Validate mission match
    if (event.missionId !== missionId) {
      results.push({ eventId: event.id, status: 'quarantined', reason: 'MISSION_MISMATCH' });
      continue;
    }

    // Validate policy version exists
    const [policy] = await db
      .select()
      .from(policyVersions)
      .where(
        and(
          eq(policyVersions.missionId, missionId),
          eq(policyVersions.version, event.policyVersion)
        )
      );

    if (!policy) {
      results.push({ eventId: event.id, status: 'quarantined', reason: 'INVALID_POLICY_VERSION' });
      continue;
    }

    // Check if event already exists
    const [existing] = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id));

    if (existing) {
      if (existing.eventHash === event.eventHash) {
        results.push({ eventId: event.id, status: 'already_seen' });
      } else {
        results.push({ eventId: event.id, status: 'quarantined', reason: 'EVENT_ID_COLLISION' });
      }
      continue;
    }

    // Validate sequence (next expected for this device)
    const [latestEvent] = await db
      .select()
      .from(events)
      .where(and(eq(events.deviceId, deviceId), eq(events.missionId, missionId)))
      .orderBy(desc(events.sequence))
      .limit(1);

    const expectedSequence = latestEvent ? latestEvent.sequence + 1 : 0;
    if (event.sequence !== expectedSequence) {
      results.push({ eventId: event.id, status: 'quarantined', reason: 'SEQUENCE_GAP' });
      continue;
    }

    // Validate chain linkage
    if (event.sequence === 0) {
      if (event.previousHash !== 'GENESIS') {
        results.push({ eventId: event.id, status: 'quarantined', reason: 'CHAIN_BREAK' });
        continue;
      }
    } else {
      if (!latestEvent || event.previousHash !== latestEvent.eventHash) {
        results.push({ eventId: event.id, status: 'quarantined', reason: 'CHAIN_BREAK' });
        continue;
      }
    }

    // Recompute event hash
    const hashInput = toHashInput(event);
    const computedHash = await computeEventHash(hashInput);
    if (computedHash !== event.eventHash) {
      results.push({ eventId: event.id, status: 'quarantined', reason: 'HASH_MISMATCH' });
      continue;
    }

    // Accept event
    await db.insert(events).values({
      id: event.id,
      missionId: event.missionId,
      deviceId: event.deviceId,
      policyVersion: event.policyVersion,
      sequence: event.sequence,
      tokenHash: event.tokenHash,
      itemType: event.itemType,
      quantity: event.quantity,
      deviceTime: new Date(event.deviceTime),
      previousHash: event.previousHash,
      eventHash: event.eventHash,
    });

    results.push({ eventId: event.id, status: 'accepted' });
    anyAccepted = true;
  }

  // 6. Reconcile if any event was accepted
  if (anyAccepted) {
    await runReconciliation(missionId);
  }

  return NextResponse.json({
    results,
    serverTime: new Date().toISOString(),
  });
}
