import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { validateSession } from '@/lib/server/session';

interface JudgeSessionLayoutProps {
  children: ReactNode;
  params: Promise<{ sessionId: string }>;
}

export default async function JudgeSessionLayout({ children, params }: JudgeSessionLayoutProps) {
  const [{ sessionId }, session] = await Promise.all([
    params,
    validateSession(),
  ]);

  if (!session.valid || session.sessionId !== sessionId) {
    redirect('/api/judge');
  }

  return children;
}
