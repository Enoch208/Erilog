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
      // Network error — will retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    if (!confirm('Reset all events? This will clear the reconciliation state.')) return;
    await fetch('/api/judge', { method: 'DELETE' });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-muted">Loading mission data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-muted">Failed to load mission. Check your session.</p>
      </div>
    );
  }

  const { mission, devices: missionDevices, events: missionEvents, snapshot } = data;
  const distributed = snapshot?.summary?.distributed?.emergency_kit ?? 0;
  const remaining = snapshot?.summary?.remaining?.emergency_kit ?? 0;
  const uniqueTokens = snapshot?.summary?.uniqueTokensServed ?? 0;
  const exceptions = snapshot?.exceptions ?? [];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/judge/${sessionId}`} className="text-sm text-mint hover:text-mint-dark">
              ← Back
            </Link>
            <h1 className="font-heading text-lg text-ink">Coordinator</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="rounded-full border border-border px-3 py-1.5 text-[12px] text-muted transition hover:border-red hover:text-red"
            >
              Reset
            </button>
            <button
              onClick={fetchData}
              className="rounded-full border border-border px-3 py-1.5 text-[12px] text-muted transition hover:border-mint hover:text-mint"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Mission header */}
        <div className="rounded-feature border border-border bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl text-ink">{mission.name}</h2>
              <p className="mono mt-1 text-[10px] text-muted">
                {mission.id}
              </p>
            </div>
            <span className="rounded-full bg-mint-wash px-2.5 py-1 text-[11px] font-medium text-mint-dark">
              {mission.status}
            </span>
          </div>
        </div>

        {/* Stock summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-feature border border-border bg-surface p-5 text-center">
            <p className="font-heading text-2xl text-ink">
              {mission.totalStock.emergency_kit ?? 0}
            </p>
            <p className="mono mt-1 text-[9px] uppercase tracking-wider text-muted">Total Stock</p>
          </div>
          <div className="rounded-feature border border-border bg-surface p-5 text-center">
            <p className="font-heading text-2xl text-mint-dark">{distributed}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-wider text-muted">Distributed</p>
          </div>
          <div className="rounded-feature border border-border bg-surface p-5 text-center">
            <p className="font-heading text-2xl text-ink">{remaining}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-wider text-muted">Remaining</p>
          </div>
          <div className="rounded-feature border border-border bg-surface p-5 text-center">
            <p className="font-heading text-2xl text-ink">{uniqueTokens}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-wider text-muted">Unique Tokens</p>
          </div>
        </div>

        {/* Devices */}
        <h3 className="mt-8 font-heading text-sm text-ink">Devices</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {missionDevices.map((device) => {
            const deviceEvents = missionEvents.filter((e) => e.deviceId === device.id);
            return (
              <div key={device.id} className="rounded-feature border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="font-heading text-sm text-ink">{device.label}</p>
                  <span className="mono text-[9px] text-muted">{deviceEvents.length} events</span>
                </div>
                <p className="mono mt-2 text-[9px] text-muted">
                  Allocation: {device.allocation.emergency_kit ?? 0} kits
                </p>
              </div>
            );
          })}
        </div>

        {/* Exceptions */}
        <h3 className="mt-8 font-heading text-sm text-ink">
          Exceptions {exceptions.length > 0 && <span className="text-amber">({exceptions.length})</span>}
        </h3>
        {exceptions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No exceptions detected yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {exceptions.map((exc) => (
              <div key={exc.id} className="rounded-feature border border-amber/25 bg-amber/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] font-medium text-amber">{exc.type}</span>
                  <span className="mono text-[9px] text-muted">{exc.status}</span>
                </div>
                {exc.tokenHash && (
                  <p className="mono mt-2 text-[10px] text-muted">
                    Token: {exc.tokenHash.slice(0, 16)}...
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted">
                  {exc.eventIds.length} peer events · {exc.deviceIds.length} device(s)
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Events */}
        <h3 className="mt-8 font-heading text-sm text-ink">
          Accepted Events ({missionEvents.length})
        </h3>
        {missionEvents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No events synced yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-feature border border-border">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-border bg-canvas">
                <tr>
                  <th className="px-4 py-2 font-medium text-muted">Device</th>
                  <th className="px-4 py-2 font-medium text-muted">Seq</th>
                  <th className="px-4 py-2 font-medium text-muted">Token</th>
                  <th className="px-4 py-2 font-medium text-muted">Qty</th>
                  <th className="px-4 py-2 font-medium text-muted">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {missionEvents.map((event) => {
                  const device = missionDevices.find((d) => d.id === event.deviceId);
                  return (
                    <tr key={event.id}>
                      <td className="px-4 py-2 text-ink">{device?.label ?? '—'}</td>
                      <td className="px-4 py-2 mono text-muted">{event.sequence}</td>
                      <td className="px-4 py-2 mono text-muted">{event.tokenHash.slice(0, 12)}...</td>
                      <td className="px-4 py-2 text-ink">{event.quantity}</td>
                      <td className="px-4 py-2 mono text-muted">{event.eventHash.slice(0, 12)}...</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Export */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleExport}
            disabled={missionEvents.length === 0 || exporting}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export Audit Bundle'}
          </button>
          <span className="text-[11px] text-muted">
            Signed ZIP · verifiable offline
          </span>
        </div>
      </main>
    </div>
  );
}
