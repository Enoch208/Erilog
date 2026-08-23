import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/server/db';
import { missions, policyVersions, devices, events, reconciliationSnapshots } from '@/lib/server/schema';
import { createSession, validateSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEED_42_MISSION = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  name: 'Emergency Distribution Alpha',
  totalStock: { emergency_kit: 100 },
};

const SEED_42_POLICY = {
  items: [{ type: 'emergency_kit', unit: 'kit' }],
  allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
  tokenSalt: 'seed42salt000000000000000000000000',
};

const SEED_42_DEVICES = [
  { id: 'a1b2c3d4-0000-4000-8000-aaa000000001', label: 'Alpha', allocation: { emergency_kit: 50 } },
  { id: 'a1b2c3d4-0000-4000-8000-bbb000000002', label: 'Bravo', allocation: { emergency_kit: 50 } },
];

async function sha256Hex(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function seedMission(): Promise<string> {
  const policyHash = await sha256Hex(JSON.stringify(SEED_42_POLICY));

  await db.transaction(async (tx) => {
    await tx
      .insert(missions)
      .values({
        id: SEED_42_MISSION.id,
        name: SEED_42_MISSION.name,
        status: 'active',
        totalStock: SEED_42_MISSION.totalStock,
        activatedAt: new Date(),
      })
      .onConflictDoNothing();

    await tx
      .insert(policyVersions)
      .values({
        missionId: SEED_42_MISSION.id,
        version: 0,
        policy: SEED_42_POLICY,
        policyHash,
        activatedAt: new Date(),
      })
      .onConflictDoNothing();

    await tx
      .insert(devices)
      .values(SEED_42_DEVICES.map((device) => ({
        id: device.id,
        missionId: SEED_42_MISSION.id,
        label: device.label,
        allocation: device.allocation,
        provisionedAt: new Date(),
      })))
      .onConflictDoNothing();
  });

  return SEED_42_MISSION.id;
}

export async function GET(request: NextRequest) {
  try {
    const missionId = await seedMission();
    const { sessionId } = await createSession(missionId);

    return NextResponse.redirect(new URL(`/judge/${sessionId}`, request.nextUrl.origin));
  } catch (error) {
    console.error('Judge session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await validateSession();
    if (!session.valid || session.missionId !== SEED_42_MISSION.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(reconciliationSnapshots).where(eq(reconciliationSnapshots.missionId, SEED_42_MISSION.id));
    await db.delete(events).where(eq(events.missionId, SEED_42_MISSION.id));

    return NextResponse.json({ success: true, message: 'Session reset to seed-42 initial state' });
  } catch (error) {
    console.error('Reset failed:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
