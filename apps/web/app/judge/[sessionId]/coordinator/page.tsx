'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface MissionData {
  mission: { id: string; name: string; status: string; totalStock: Record<string, number> };
  policy: { items: { type: string; unit: string }[]; allowances: { itemType: string; maxPerEntitlement: number }[]; tokenSalt: string } | null;
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
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
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
        a.download = `erilog-audit-bundle.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all events? This clears reconciliation state.')) return;
    await fetch('/api/judge', { method: 'DELETE' });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-evidence">
        <div className="flex items-center gap-3 text-white/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-mint/30 border-t-mint" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-evidence">
        <p className="text-sm text-white/40">Failed to load. Check session.</p>
      </div>
    );
  }

  const { mission, devices: missionDevices, events: missionEvents, snapshot } = data;
  const distributed = snapshot?.summary?.distributed?.emergency_kit ?? 0;
  const remaining = snapshot?.summary?.remaining?.emergency_kit ?? 0;
  const uniqueTokens = snapshot?.summary?.uniqueTokensServed ?? 0;
  const exceptions = snapshot?.exceptions ?? [];

  return (
    <div className="min-h-screen bg-evidence text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/judge/${sessionId}`} className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-mint transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="font-heading text-[15px]">Coordinator</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/40 transition hover:border-red/30 hover:text-red">
              Reset
            </button>
            <button onClick={fetchData} className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/40 transition hover:border-mint/30 hover:text-mint">
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Stock', value: mission.totalStock.emergency_kit ?? 0, color: 'text-white' },
            { label: 'Distributed', value: distributed, color: 'text-mint' },
            { label: 'Remaining', value: remaining, color: 'text-white' },
            { label: 'Unique Tokens', value: uniqueTokens, color: 'text-white' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="mono text-[9px] uppercase tracking-[0.16em] text-white/30">{metric.label}</p>
              <p className={`mt-2 font-heading text-2xl ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Devices */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {missionDevices.map((device) => {
            const deviceEvents = missionEvents.filter((e) => e.deviceId === device.id);
            return (
              <div key={device.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                    <span className="text-[12px] font-medium text-white/60">{device.label[0]}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">{device.label}</p>
                    <p className="mono text-[10px] text-white/30">{device.allocation.emergency_kit} kits</p>
                  </div>
                </div>
                <span className="mono text-[11px] text-white/30">{deviceEvents.length} events</span>
              </div>
            );
          })}
        </div>

        {/* Exceptions */}
        {exceptions.length > 0 && (
          <div className="mt-8">
            <h3 className="flex items-center gap-2 text-[13px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              Exceptions ({exceptions.length})
            </h3>
            <div className="mt-3 space-y-2">
              {exceptions.map((exc) => (
                <div key={exc.id} className="rounded-xl border border-amber/15 bg-amber/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[11px] font-medium text-amber">{exc.type}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/30">{exc.status}</span>
                  </div>
                  {exc.tokenHash && (
                    <p className="mono mt-2 text-[10px] text-white/30">Token: {exc.tokenHash.slice(0, 20)}...</p>
                  )}
                  <p className="mt-1 text-[11px] text-white/40">
                    {exc.eventIds.length} peer events across {exc.deviceIds.length} device(s)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events table */}
        {missionEvents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[13px] font-medium">Accepted Events ({missionEvents.length})</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-4 py-3 font-medium text-white/30">Device</th>
                    <th className="px-4 py-3 font-medium text-white/30">Seq</th>
                    <th className="px-4 py-3 font-medium text-white/30">Token</th>
                    <th className="px-4 py-3 font-medium text-white/30">Qty</th>
                    <th className="px-4 py-3 font-medium text-white/30">Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {missionEvents.map((event) => {
                    const device = missionDevices.find((d) => d.id === event.deviceId);
                    return (
                      <tr key={event.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white/70">{device?.label ?? '—'}</td>
                        <td className="px-4 py-3 mono text-white/40">{event.sequence}</td>
                        <td className="px-4 py-3 mono text-white/40">{event.tokenHash.slice(0, 12)}...</td>
                        <td className="px-4 py-3 text-white/70">{event.quantity}</td>
                        <td className="px-4 py-3 mono text-white/30">{event.eventHash.slice(0, 12)}...</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {missionEvents.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12">
            <p className="text-sm text-white/30">No events synced yet</p>
            <p className="mt-1 text-[12px] text-white/20">Record handouts from operator views, then sync</p>
          </div>
        )}

        {/* Export */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleExport}
            disabled={missionEvents.length === 0 || exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-3 text-[13px] font-medium text-evidence transition hover:bg-mint/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? 'Exporting...' : 'Export Audit Bundle'}
          </button>
          <span className="text-[11px] text-white/25">Signed ZIP · independently verifiable</span>
        </div>
      </main>
    </div>
  );
}
