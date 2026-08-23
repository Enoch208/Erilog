import { redirect } from 'next/navigation';

/**
 * /judge — entry point for Judge Mode.
 * Redirects to the API endpoint that seeds the mission,
 * creates a session with a cookie, and redirects to /judge/[sessionId].
 */
export default function JudgeEntryPage() {
  redirect('/api/judge');
}
