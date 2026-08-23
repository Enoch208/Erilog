import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from './db';
import { judgeSessions } from './schema';

const SESSION_COOKIE = '__Host-session';

async function sha256(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSession(missionId: string): Promise<{ sessionId: string; token: string }> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const [session] = await db
    .insert(judgeSessions)
    .values({
      tokenHash,
      missionId,
      seed: 42,
      expiresAt,
    })
    .returning();

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });

  return { sessionId: session.id, token };
}

export async function validateSession(): Promise<{
  valid: boolean;
  sessionId?: string;
  missionId?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return { valid: false };

  const tokenHash = await sha256(token);
  const [session] = await db
    .select()
    .from(judgeSessions)
    .where(eq(judgeSessions.tokenHash, tokenHash));

  if (!session) return { valid: false };
  if (new Date() > session.expiresAt) return { valid: false };

  return {
    valid: true,
    sessionId: session.id,
    missionId: session.missionId ?? undefined,
  };
}
