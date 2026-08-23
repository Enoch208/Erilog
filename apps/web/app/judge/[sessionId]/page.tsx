import Link from 'next/link';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function JudgeSessionPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="font-heading text-lg text-ink">Erilog — Judge Mode</h1>
          <span className="mono text-[10px] text-muted">seed-42</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-heading tracking-tight text-ink">
            Emergency Distribution Alpha
          </h2>
          <p className="mt-3 text-muted">
            Seed-42 scenario: 2 devices, 100 kits, 1 conflict token (HH-042)
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Coordinator view */}
          <Link
            href={`/judge/${sessionId}/coordinator`}
            className="group rounded-feature border border-border bg-surface p-6 transition-all hover:border-mint/40 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-wash">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="mt-4 font-heading text-lg text-ink group-hover:text-mint-dark">
              Coordinator View
            </h3>
            <p className="mt-2 text-sm text-muted">
              See reconciled stock, exceptions, and export audit bundles.
            </p>
          </Link>

          {/* Operator Alpha */}
          <Link
            href={`/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-aaa000000001`}
            className="group rounded-feature border border-border bg-surface p-6 transition-all hover:border-mint/40 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-wash">
              <span className="text-lg">📱</span>
            </div>
            <h3 className="mt-4 font-heading text-lg text-ink group-hover:text-mint-dark">
              Operator Alpha
            </h3>
            <p className="mt-2 text-sm text-muted">
              50 kits allocated. Record handouts offline.
            </p>
          </Link>

          {/* Operator Bravo */}
          <Link
            href={`/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-bbb000000002`}
            className="group rounded-feature border border-border bg-surface p-6 transition-all hover:border-mint/40 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-wash">
              <span className="text-lg">📱</span>
            </div>
            <h3 className="mt-4 font-heading text-lg text-ink group-hover:text-mint-dark">
              Operator Bravo
            </h3>
            <p className="mt-2 text-sm text-muted">
              50 kits allocated. Record handouts offline.
            </p>
          </Link>
        </div>

        <div className="mt-12 rounded-feature border border-border bg-surface p-6">
          <h3 className="font-heading text-sm text-ink">Signature Demo Flow</h3>
          <ol className="mt-4 space-y-2 text-sm text-muted">
            <li>1. Open Alpha operator → record HH-040 and HH-042 offline</li>
            <li>2. Open Bravo operator → record HH-041 and HH-042 offline</li>
            <li>3. Sync both devices</li>
            <li>4. Check coordinator → 4 distributed, 96 remaining, 1 exception</li>
            <li>5. Export audit bundle → verify PASS</li>
            <li>6. Tamper quantity → verify FAIL</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
