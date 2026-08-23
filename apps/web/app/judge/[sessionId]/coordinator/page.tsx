'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { JudgeShell, MetricCard, Panel } from '@/components/judge/JudgeShell';

interface MissionData {
  mission: { id: string; name: string; status: string; totalStock: Record<string, number> };
  devices: { id: string; label: string; allocation: Record<string, number> }[];
  events: { id: string; deviceId: string; tokenHash: string; itemType: string; quantity: number; sequence: number; eventHash: string; deviceTime: string }[];
  snapshot: {
    summary: { distributed: Record<string, number>; remaining: Record<string, number>; uniqueTokensServed: number; totalPhysicalHandouts: number };
    exceptions: { id: string; type: string; tokenHash?: string; eventIds: string[]; deviceIds: string[]; quantities: number[]; status: string }[];
    eventSetDigest: string;
  } | null;
}

export default function CoordinatorPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [data, setData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/missions');
      if (response.ok) setData(await response.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/export');
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'erilog-audit-bundle.zip';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all accepted events and reconciliation state?')) return;
    await fetch('/api/judge', { method: 'DELETE' });
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-muted">Loading mission state</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Mission state could not be loaded.</p>
      </div>
    );
  }

  const { mission, devices, events, snapshot } = data;
  const distributed = snapshot?.summary.distributed.emergency_kit ?? 0;
  const remaining = snapshot?.summary.remaining.emergency_kit ?? mission.totalStock.emergency_kit;
  const uniqueTokens = snapshot?.summary.uniqueTokensServed ?? 0;
  const exceptions = snapshot?.exceptions ?? [];

  return (
    <JudgeShell
      sessionId={sessionId}
      activePage="coordinator"
      title="Coordinator"
      description="Authoritative mission state derived from every accepted event. Exceptions remain visible and no peer is silently selected as the winner."
      actions={
        <>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-10 rounded-control border border-border bg-surface px-4 text-[12px] text-muted transition-colors hover:border-red/30 hover:text-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          >
            Reset scenario
          </button>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="min-h-10 rounded-control bg-ink px-4 text-[12px] font-medium text-white transition-colors hover:bg-evidence focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2"
          >
            Refresh
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Distributed" value={distributed} detail="Accepted physical handouts" tone="positive" />
        <MetricCard label="Remaining" value={remaining} detail="Kits still in mission stock" />
        <MetricCard label="Unique tokens" value={uniqueTokens} detail="Distinct entitlement hashes" />
        <MetricCard label="Exceptions" value={exceptions.length} detail={exceptions.length === 0 ? 'No conflicts detected' : 'Require human explanation'} tone={exceptions.length > 0 ? 'warning' : 'default'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel
          eyebrow="Device intake"
          title="Sync status"
          description="Accepted event counts by provisioned device."
        >
          <div className="space-y-0">
            {devices.map((device, index) => {
              const deviceEvents = events.filter((event) => event.deviceId === device.id);
              return (
                <div key={device.id} className={`flex items-center justify-between py-4 first:pt-0 last:pb-0 ${index > 0 ? 'border-t border-border' : ''}`}>
                  <div>
                    <p className="text-[13px] font-medium text-ink">Device {device.label}</p>
                    <p className="mono mt-1 text-[9px] text-muted">{device.id.slice(0, 22)}…</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-heading text-ink">{deviceEvents.length}</p>
                    <p className="text-[10px] text-muted">accepted events</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          eyebrow="Exception register"
          title={exceptions.length === 0 ? 'No exceptions detected' : `${exceptions.length} unresolved exception${exceptions.length === 1 ? '' : 's'}`}
          description="Exception records are deterministic projections of the immutable event set."
        >
          {exceptions.length === 0 ? (
            <div className="border-l-2 border-mint bg-mint-wash/60 px-4 py-3">
              <p className="text-[12px] text-mint-dark">All accepted events currently reconcile without a policy conflict.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {exceptions.map((exception, index) => (
                <div key={exception.id} className={`grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] ${index > 0 ? 'border-t border-border' : ''}`}>
                  <div>
                    <p className="mono text-[10px] text-amber">{exception.type}</p>
                    {exception.tokenHash && <p className="mono mt-2 break-all text-[9px] leading-relaxed text-muted">token {exception.tokenHash}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[12px] font-medium text-ink">{exception.eventIds.length} peer events</p>
                    <p className="mt-1 text-[10px] text-muted">{exception.deviceIds.length} devices · {exception.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        eyebrow="Evidence ledger"
        title="Accepted events"
        description={`${events.length} immutable event${events.length === 1 ? '' : 's'} currently contribute to mission stock.`}
        className="mt-6"
      >
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-muted">No events have been accepted yet.</p>
            <p className="mt-1 text-[11px] text-muted/70">Record offline handouts on Alpha and Bravo, then sync each device.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted">
                  <th className="pb-3 font-normal">Device</th>
                  <th className="pb-3 font-normal">Sequence</th>
                  <th className="pb-3 font-normal">Token hash</th>
                  <th className="pb-3 font-normal">Event hash</th>
                  <th className="pb-3 text-right font-normal">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const device = devices.find((candidate) => candidate.id === event.deviceId);
                  return (
                    <tr key={event.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 text-[12px] font-medium text-ink">{device?.label ?? 'Unknown'}</td>
                      <td className="mono py-3 text-[10px] text-muted">{event.sequence}</td>
                      <td className="mono py-3 text-[10px] text-muted">{event.tokenHash.slice(0, 18)}…</td>
                      <td className="mono py-3 text-[10px] text-muted">{event.eventHash.slice(0, 18)}…</td>
                      <td className="py-3 text-right text-[12px] text-ink">{event.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-ink">Portable audit evidence</p>
          <p className="mt-1 text-[11px] text-muted">Canonical JSON, per-file checksums, and an Ed25519 manifest signature.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={events.length === 0 || exporting}
          className="min-h-10 rounded-control bg-ink px-5 text-[12px] font-medium text-white transition-colors hover:bg-evidence disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2"
        >
          {exporting ? 'Preparing bundle…' : 'Export Audit Bundle'}
        </button>
      </div>
    </JudgeShell>
  );
}
