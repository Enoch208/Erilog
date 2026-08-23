import Link from 'next/link';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function JudgeSessionPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <div className="min-h-screen bg-evidence text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15">
              <span className="font-heading text-sm text-mint">E</span>
            </div>
            <span className="font-heading text-[15px]">Erilog</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            <span className="mono text-[10px] text-white/50">seed-42</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-mint">Judge Mode</p>
          <h1 className="mt-4 text-3xl font-heading tracking-tight sm:text-4xl">
            Emergency Distribution Alpha
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/45">
            2 devices · 100 emergency kits · 1 conflict token (HH-042)
          </p>
        </div>

        {/* Role cards */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {/* Coordinator */}
          <Link
            href={`/judge/${sessionId}/coordinator`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-mint/30 hover:bg-white/[0.05]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/10">
              <svg className="h-5 w-5 text-mint" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h3 className="mt-5 font-heading text-[15px] group-hover:text-mint transition-colors">
              Coordinator
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/40">
              Reconciled stock, exceptions, and audit export.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-mint/70">
              <span>Open</span>
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          {/* Operator Alpha */}
          <Link
            href={`/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-aaa000000001`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-mint/30 hover:bg-white/[0.05]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
              <span className="font-heading text-sm text-white/70">A</span>
            </div>
            <h3 className="mt-5 font-heading text-[15px] group-hover:text-mint transition-colors">
              Operator Alpha
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/40">
              50 kits allocated. Record handouts offline.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/30">
              <span>Open</span>
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          {/* Operator Bravo */}
          <Link
            href={`/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-bbb000000002`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-mint/30 hover:bg-white/[0.05]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
              <span className="font-heading text-sm text-white/70">B</span>
            </div>
            <h3 className="mt-5 font-heading text-[15px] group-hover:text-mint transition-colors">
              Operator Bravo
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/40">
              50 kits allocated. Record handouts offline.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/30">
              <span>Open</span>
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Demo steps */}
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.02] p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint/10">
              <svg className="h-4 w-4 text-mint" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
            </div>
            <h3 className="font-heading text-[14px]">Demo Flow</h3>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              'Record HH-040, HH-042 on Alpha (offline)',
              'Record HH-041, HH-042 on Bravo (offline)',
              'Sync both devices',
              'Coordinator: 4 distributed, 96 remaining',
              'Export audit bundle → verify PASS',
              'Tamper quantity → verify FAIL',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] text-white/40">
                  {i + 1}
                </span>
                <span className="text-[13px] text-white/50">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
