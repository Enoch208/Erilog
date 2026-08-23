import { NextResponse } from 'next/server';
import { eq, desc, asc } from 'drizzle-orm';
import { reconcile, generateBundle, writeBundleToBuffer } from '@erilog/reconcile';
import type { ReconciliationInput } from '@erilog/reconcile';
import type { HandoutEvent } from '@erilog/schemas';
import { getPublicKey } from '@erilog/crypto';
import { db } from '@/lib/server/db';
import { missions, policyVersions, devices, events } from '@/lib/server/schema';
import { validateSession } from '@/lib/server/session';

export async function GET() {
  const session = await validateSession();
  if (!session.valid || !session.missionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const missionId = session.missionId;

  // Fetch mission
  const [mission] = await db
    .select()
    .from(missions)
    .where(eq(missions.id, missionId));

  if (!mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  }

  // Fetch policy
  const [policy] = await db
    .select()
    .from(policyVersions)
    .where(eq(policyVersions.missionId, missionId))
    .orderBy(desc(policyVersions.version))
    .limit(1);

  if (!policy) {
    return NextResponse.json({ error: 'No policy found' }, { status: 404 });
  }

  // Fetch events
  const missionEvents = await db
    .select()
    .from(events)
    .where(eq(events.missionId, missionId))
    .orderBy(asc(events.deviceId), asc(events.sequence));

  if (missionEvents.length === 0) {
    return NextResponse.json({ error: 'No events to export' }, { status: 400 });
  }

  // Fetch devices
  const missionDevices = await db
    .select()
    .from(devices)
    .where(eq(devices.missionId, missionId));

  // Get signing key
  const privateKeyHex = process.env.ERILOG_SIGNING_PRIVATE_KEY;
  if (!privateKeyHex) {
    return NextResponse.json({ error: 'Signing key not configured' }, { status: 500 });
  }

  const publicKeyHex = await getPublicKey(privateKeyHex);

  // Build events for reconciliation
  const bundleEvents: HandoutEvent[] = missionEvents.map((e) => ({
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

  // Reconcile to get the result
  const policyData = policy.policy as ReconciliationInput['policy'];
  const reconciliationResult = await reconcile({
    policy: policyData,
    events: bundleEvents,
    devices: missionDevices.map((d) => ({
      deviceId: d.id,
      allocation: d.allocation,
    })),
    initialStock: mission.totalStock,
  });

  // Generate signed bundle
  const bundle = await generateBundle({
    missionId,
    policyVersion: policy.version,
    policy: policyData,
    events: bundleEvents,
    reconciliationResult,
    privateKeyHex,
    publicKeyHex,
    exportedAt: new Date().toISOString(),
  });

  const zipBuffer = await writeBundleToBuffer(bundle);

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="erilog-audit-${missionId.slice(0, 8)}.zip"`,
    },
  });
}
