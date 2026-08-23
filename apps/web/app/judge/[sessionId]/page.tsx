import Link from 'next/link';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function JudgeSessionPage({ params }: Props) {
  const { sessionId } = await params;

  const navItems = [
    { label: 'Overview', href: `/judge/${sessionId}`, active: true },
    { label: 'Coordinator', href: `/judge/${sessionId}/coordinator` },
    { label: 'Device Alpha', href: `/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-aaa000000001` },
    { label: 'Device Bravo', href: `/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-bbb000000002` },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-white/[0.06] px-3 py-5">
        <div className="flex items-center gap-2.5 px-3 pb-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint/15">
            <span className="text-[11px] font-semibold text-mint">E</span>
          </div>
          <span className="text-[13px] font-semibold">Erilog</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-[13px] transition-colors ${
                item.active
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3">
          <p className="text-[12px] font-medium text-mint">seed-42</p>
          <p className="mt-0.5 text-[11px] text-white/30">Emergency Distribution Alpha</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-10 py-8">
        <div className="max-w-4xl">
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="mt-1 text-[13px] text-white/35">Seed-42 scenario · 2 devices, 100 kits</p>

          {/* Metric cards */}
          <div className="mt-8 grid grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/40">Total stock</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                  <svg className="h-3.5 w-3.5 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold">100</p>
              <p className="mt-1 text-[11px] text-white/25">emergency kits available</p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/40">Devices</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                  <svg className="h-3.5 w-3.5 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" /></svg>
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold">2</p>
              <p className="mt-1 text-[11px] text-white/25">Alpha and Bravo</p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/40">Policy</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                  <svg className="h-3.5 w-3.5 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold">v0</p>
              <p className="mt-1 text-[11px] text-white/25">1 kit per entitlement</p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/40">Conflict token</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                  <svg className="h-3.5 w-3.5 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                </span>
              </div>
              <p className="mt-4 font-mono text-2xl font-semibold">HH-042</p>
              <p className="mt-1 text-[11px] text-white/25">used on both devices</p>
            </div>
          </div>

          {/* Demo flow */}
          <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <p className="mono text-[10px] uppercase tracking-[0.15em] text-white/25">Demo Flow</p>

            <div className="mt-5 space-y-4">
              {[
                { step: '1', text: 'Open Alpha → record HH-040 and HH-042 offline' },
                { step: '2', text: 'Open Bravo → record HH-041 and HH-042 offline' },
                { step: '3', text: 'Sync both devices' },
                { step: '4', text: 'Coordinator shows 4 distributed, 96 remaining, 1 exception' },
                { step: '5', text: 'Export audit bundle → verify PASS' },
                { step: '6', text: 'Tamper quantity 1→2 → verify FAIL' },
              ].map((item) => (
                <div key={item.step} className="flex items-baseline gap-4">
                  <span className="mono text-[11px] text-white/20">{item.step}.</span>
                  <span className="text-[13px] text-white/50">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
