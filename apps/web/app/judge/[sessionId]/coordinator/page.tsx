'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface MissionData {
  mission: { id: string; name: string; status: string; totalStock: Record<string, number> };
  devices: { id: string; label: string; allocation: Record<string, number> }[];
  events: { id: string; deviceId: string; tokenHash: string; itemType: string; quantity: number; sequence: number; eventHash: string; deviceTime: string }[];
  snapshot: { summary: { distributed: Record<string, number>; remaining: Record<string, number>; uniqueTokensServed: number; totalPhysicalHandouts: number }; exceptions: { id: string; type: string; tokenHash?: string; eventIds: string[]; deviceIds: string[]; quantities: number[]; status: string }[]; eventSetDigest: string } | null;
}

export default function CoordinatorPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [data, setData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/missions');
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'erilog-audit-bundle.zip';
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally { setExporting(false); }
  };

  const handleReset = async () => {
    if (!confirm('Reset all events?')) return;
    await fetch('/api/judge', { method: 'DELETE' });
    fetchData();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]"><p className="text-sm text-white/30">Loading...</p></div>;
  }
  if (!data) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]"><p className="text-sm text-white/30">Failed to load.</p></div>;
  }

  const { mission, devices: missionDevices, events: missionEvents, snapshot } = data;
  const distributed = snapshot?.summary?.distributed?.emergency_kit ?? 0;
  const remaining = snapshot?.summary?.remaining?.emergency_kit ?? 0;
  const uniqueTokens = snapshot?.summary?.uniqueTokensServed ?? 0;
  const exceptions = snapshot?.exceptions ?? [];

  const navItems = [
    { label: 'Overview', href: `/judge/${sessionId}` },
    { label: 'Coordinator', href: `/judge/${sessionId}/coordinator`, active: true },
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
            <Link key={item.label} href={item.href} className={`rounded-lg px-3 py-2 text-[13px] transition-colors ${'active' in item && item.active ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3">
          <p className="text-[12px] font-medium text-mint">seed-42</p>
          <p className="mt-0.5 text-[11px] text-white/30">{mission.name}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-10 py-8">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Coordinator</h1>
              <p className="mt-1 text-[13px] text-white/35">Reconciled state after sync</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/35 hover:text-white/60">Reset</button>
              <button onClick={fetchData} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/35 hover:text-white/60">Refresh</button>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-8 grid grid-cols-4 gap-3">
            {[
              { label: 'Distributed', value: distributed, sub: 'kits handed out', accent: true },
              { label: 'Remaining', value: remaining, sub: 'kits in stock' },
              { label: 'Unique tokens', value: uniqueTokens, sub: 'beneficiaries served' },
              { label: 'Exceptions', value: exceptions.length, sub: exceptions.length > 0 ? 'unresolved' : 'none detected', warn: exceptions.length > 0 },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <span className="text-[12px] text-white/40">{m.label}</span>
                <p className={`mt-3 text-3xl font-semibold ${m.accent ? 'text-mint' : m.warn ? 'text-amber' : 'text-white'}`}>{m.value}</p>
                <p className="mt-1 text-[11px] text-white/25">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Exceptions */}
          {exceptions.length > 0 && (
            <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="mono text-[10px] uppercase tracking-[0.15em] text-white/25">Exceptions</p>
              <div className="mt-4 space-y-3">
                {exceptions.map((exc) => (
                  <div key={exc.id} className="flex items-center justify-between border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-[13px] text-white/70">{exc.type.replace('_', ' ')}</p>
                      {exc.tokenHash && <p className="mono mt-0.5 text-[11px] text-white/25">{exc.tokenHash.slice(0, 24)}...</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-white/40">{exc.eventIds.length} peer events</p>
                      <p className="mono text-[10px] text-white/20">{exc.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <p className="mono text-[10px] uppercase tracking-[0.15em] text-white/25">Accepted Events</p>
              <span className="text-[12px] text-white/25">{missionEvents.length} total</span>
            </div>

            {missionEvents.length === 0 ? (
              <p className="mt-6 text-center text-[13px] text-white/20">No events synced yet</p>
            ) : (
              <table className="mt-4 w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-2 font-normal text-white/25">Device</th>
                    <th className="pb-2 font-normal text-white/25">Seq</th>
                    <th className="pb-2 font-normal text-white/25">Token hash</th>
                    <th className="pb-2 text-right font-normal text-white/25">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {missionEvents.map((event) => {
                    const device = missionDevices.find((d) => d.id === event.deviceId);
                    return (
                      <tr key={event.id} className="border-b border-white/[0.03] last:border-0">
                        <td className="py-2.5 text-white/60">{device?.label ?? '—'}</td>
                        <td className="py-2.5 mono text-white/35">{event.sequence}</td>
                        <td className="py-2.5 mono text-white/30">{event.tokenHash.slice(0, 16)}...</td>
                        <td className="py-2.5 text-right text-white/60">{event.quantity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Export */}
          <div className="mt-6">
            <button
              onClick={handleExport}
              disabled={missionEvents.length === 0 || exporting}
              className="rounded-lg bg-white/[0.08] px-4 py-2.5 text-[13px] text-white/70 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {exporting ? 'Exporting...' : 'Export audit bundle'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
