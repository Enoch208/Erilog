'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { JudgeShell, MetricCard, Panel } from '@/components/judge/JudgeShell';
import type { LocalEvent } from '@/lib/db/client';
import { checkDuplicateToken, createLocalEvent, getDeviceEvents, getLocalStock } from '@/lib/offline/event-queue';
import { syncDevice } from '@/lib/offline/sync-engine';

const missionId = 'a1b2c3d4-0000-4000-8000-000000000001';
const policySalt = 'seed42salt000000000000000000000000';

const devices: Record<string, { label: 'Alpha' | 'Bravo'; allocation: Record<string, number> }> = {
  'a1b2c3d4-0000-4000-8000-aaa000000001': { label: 'Alpha', allocation: { emergency_kit: 50 } },
  'a1b2c3d4-0000-4000-8000-bbb000000002': { label: 'Bravo', allocation: { emergency_kit: 50 } },
};

async function sha256Hex(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function OperatorPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const deviceId = params.deviceId as string;
  const device = devices[deviceId];

  const [tokenInput, setTokenInput] = useState('');
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    if (!device) return;
    const deviceEvents = await getDeviceEvents(deviceId);
    setEvents(deviceEvents);
    setStock(await getLocalStock(deviceId, device.allocation));
  }, [device, deviceId]);

  useEffect(() => {
    void refreshState();
    setIsOnline(navigator.onLine);
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, [refreshState]);

  const recordEvent = async (allowDuplicate: boolean) => {
    const rawToken = tokenInput.trim().toUpperCase();
    if (!rawToken) {
      setError('Enter an entitlement token.');
      return;
    }

    setError(null);
    const tokenHash = await sha256Hex(policySalt + rawToken);
    if (!allowDuplicate && await checkDuplicateToken(deviceId, tokenHash)) {
      setDuplicateWarning(true);
      return;
    }

    try {
      await createLocalEvent({
        missionId,
        deviceId,
        policyVersion: 0,
        tokenHash,
        itemType: 'emergency_kit',
        quantity: 1,
      });
      setReceipt(rawToken);
      setTokenInput('');
      setDuplicateWarning(false);
      setSyncResult(null);
      await refreshState();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The event could not be written to local storage.');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncDevice(deviceId, missionId);
      setSyncResult(result.errors.length > 0
        ? `Sync stopped: ${result.errors[0]}`
        : `${result.synced} event${result.synced === 1 ? '' : 's'} accepted${result.quarantined > 0 ? ` · ${result.quarantined} quarantined` : ''}`);
      await refreshState();
    } finally {
      setSyncing(false);
    }
  };

  if (!device) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Unknown provisioned device.</p>
      </div>
    );
  }

  const remaining = stock.emergency_kit ?? device.allocation.emergency_kit;
  const pendingCount = events.filter((event) => event.syncStatus === 'pending').length;
  const syncedCount = events.filter((event) => event.syncStatus === 'synced').length;
  const quarantinedCount = events.filter((event) => event.syncStatus === 'quarantined').length;
  const activePage = device.label === 'Alpha' ? 'alpha' : 'bravo';

  return (
    <JudgeShell
      sessionId={sessionId}
      activePage={activePage}
      title={`Operator ${device.label}`}
      description="Record physical handouts into the device-local append-only queue. Local receipts remain provisional until the events are synchronized."
      actions={
        <div className={`flex min-h-10 items-center gap-2 rounded-control border bg-surface px-3 text-[11px] ${isOnline ? 'border-mint/25 text-mint-dark' : 'border-amber/25 text-amber'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-mint' : 'bg-amber'}`} aria-hidden="true" />
          {isOnline ? 'Network available' : 'Working offline'}
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Local stock" value={remaining} detail={`of ${device.allocation.emergency_kit} allocated kits`} />
        <MetricCard label="Pending queue" value={pendingCount} detail="Stored locally, not authoritative" tone={pendingCount > 0 ? 'warning' : 'default'} />
        <MetricCard label="Accepted" value={syncedCount} detail="Acknowledged by the server" tone="positive" />
        <MetricCard label="Quarantined" value={quarantinedCount} detail="Rejected with a named reason" tone={quarantinedCount > 0 ? 'warning' : 'default'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel
          eyebrow="Local recorder"
          title="Confirm physical handout"
          description="The token is salted and hashed before the event is written. No beneficiary identity is stored."
        >
          <label htmlFor="token-input" className="text-[11px] font-medium text-ink">Entitlement token</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="token-input"
              type="text"
              value={tokenInput}
              onChange={(event) => {
                setTokenInput(event.target.value);
                setDuplicateWarning(false);
                setError(null);
                setReceipt(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void recordEvent(false);
              }}
              placeholder="e.g. HH-040"
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 flex-1 rounded-control border border-border bg-canvas px-3.5 mono text-[12px] uppercase text-ink outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/15"
            />
            <button
              type="button"
              onClick={() => void recordEvent(false)}
              disabled={remaining <= 0 || !tokenInput.trim()}
              className="min-h-11 rounded-control bg-ink px-5 text-[12px] font-medium text-white transition-colors hover:bg-evidence disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2"
            >
              Confirm Handout
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(device.label === 'Alpha' ? ['HH-040', 'HH-042'] : ['HH-041', 'HH-042']).map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => setTokenInput(token)}
                className="rounded-control border border-border bg-canvas px-2.5 py-1.5 mono text-[9px] text-muted transition-colors hover:border-mint/30 hover:text-mint-dark"
              >
                Use {token}
              </button>
            ))}
          </div>

          {error && <p className="mt-4 border-l-2 border-red bg-red/[0.05] px-3 py-2 text-[11px] text-red">{error}</p>}

          {duplicateWarning && (
            <div className="mt-4 border-l-2 border-amber bg-amber/[0.06] px-3 py-3">
              <p className="text-[11px] font-medium text-amber">This token already exists on this device.</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">The event is not rejected automatically. Continue only to demonstrate a same-device duplicate.</p>
              <div className="mt-3 flex gap-3">
                <button type="button" onClick={() => void recordEvent(true)} className="text-[11px] font-medium text-amber hover:underline">Record anyway</button>
                <button type="button" onClick={() => { setDuplicateWarning(false); setTokenInput(''); }} className="text-[11px] text-muted hover:text-ink">Cancel</button>
              </div>
            </div>
          )}

          {receipt && (
            <div className="mt-4 border-l-2 border-mint bg-mint-wash/60 px-3 py-3">
              <p className="text-[11px] font-medium text-mint-dark">Recorded {receipt} on this device</p>
              <p className="mt-1 text-[10px] text-muted">Pending sync · this is not global approval.</p>
            </div>
          )}
        </Panel>

        <Panel
          eyebrow="Append-only queue"
          title="Device event log"
          description="Sequence and sync state for every locally retained event."
        >
          {events.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] text-muted">No events recorded on Device {device.label}.</p>
              <p className="mt-1 text-[11px] text-muted">Use the recorder to append the first handout.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {events.map((event, index) => (
                <div key={event.id} className={`grid gap-3 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[44px_1fr_auto] sm:items-center ${index > 0 ? 'border-t border-border' : ''}`}>
                  <span className="mono text-[9px] text-muted">SEQ {String(event.sequence).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <p className="mono truncate text-[10px] text-ink">{event.tokenHash}</p>
                    <p className="mono mt-1 truncate text-[9px] text-muted">{event.eventHash}</p>
                  </div>
                  <span className={`flex items-center gap-2 text-[10px] ${event.syncStatus === 'synced' ? 'text-mint-dark' : event.syncStatus === 'quarantined' ? 'text-red' : 'text-amber'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${event.syncStatus === 'synced' ? 'bg-mint' : event.syncStatus === 'quarantined' ? 'bg-red' : 'bg-amber'}`} aria-hidden="true" />
                    {event.syncStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-ink">Synchronize local evidence</p>
          <p className="mt-1 text-[11px] text-muted">Accepted and already-seen events leave the pending queue. Quarantined events remain inspectable.</p>
        </div>
        <div className="flex items-center gap-3">
          {syncResult && <p className={`text-[11px] ${syncResult.startsWith('Sync stopped') ? 'text-red' : 'text-mint-dark'}`}>{syncResult}</p>}
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={pendingCount === 0 || syncing || !isOnline}
            className="min-h-10 rounded-control border border-border bg-surface px-5 text-[12px] font-medium text-ink transition-colors hover:border-mint/30 hover:text-mint-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          >
            {syncing ? 'Synchronizing…' : `Sync ${pendingCount} event${pendingCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </JudgeShell>
  );
}
