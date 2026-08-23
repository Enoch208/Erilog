import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/server/db';
import { missions, policyVersions, devices, events, reconciliationSnapshots } from '@/lib/server/schema';
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

  // Fetch devices
  const missionDevices = await db
    .select()
    .from(devices)
    .where(eq(devices.missionId, missionId));

  // Fetch all events
  const missionEvents = await db
    .select()
    .from(events)
    .where(eq(events.missionId, missionId));

  // Fetch latest snapshot
  const [latestSnapshot] = await db
    .select()
    .from(reconciliationSnapshots)
    .where(eq(reconciliationSnapshots.missionId, missionId))
    .orderBy(desc(reconciliationSnapshots.createdAt))
    .limit(1);

  return NextResponse.json({
    mission,
    policy: policy?.policy ?? null,
    policyVersion: policy?.version ?? null,
    devices: missionDevices,
    events: missionEvents.map((e) => ({
      ...e,
      deviceTime: e.deviceTime.toISOString(),
      acceptedAt: e.acceptedAt.toISOString(),
    })),
    snapshot: latestSnapshot
      ? {
          summary: latestSnapshot.summary,
          exceptions: latestSnapshot.exceptions,
          eventSetDigest: latestSnapshot.eventSetDigest,
        }
      : null,
  });
}
