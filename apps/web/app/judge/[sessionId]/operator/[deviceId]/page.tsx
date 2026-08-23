'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { localDb, type LocalEvent } from '@/lib/db/client';
import { createLocalEvent, checkDuplicateToken, getDeviceEvents, getLocalStock } from '@/lib/offline/event-queue';
import { syncDevice } from '@/lib/offline/sync-engine';

const SEED_42_POLICY = {
  items: [{ type: 'emergency_kit', unit: 'kit' }],
  allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
  tokenSalt: 'seed42salt000000000000000000000000',
};

const SEED_42_MISSION_ID = 'a1b2c3d4-0000-4000-8000-000000000001';

const DEVICES: Record<string, { label: string; allocation: Record<string, number> }> = {
  'a1b2c3d4-0000-4000-8000-aaa000000001': { label: 'Alpha', allocation: { emergency_kit: 50 } },
  'a1b2c3d4-0000-4000-8000-bbb000000002': { label: 'Bravo', allocation: { emergency_kit: 50 } },
};

async function sha256Hex(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function OperatorPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const deviceId = params.deviceId as string;

  const device = DEVICES[deviceId];
  const [tokenInput, setTokenInput] = useState('');
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [lastRecorded, setLastRecorded] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    if (!device) return;
    const deviceEvents = await getDeviceEvents(deviceId);
    setEvents(deviceEvents);
    const localStock = await getLocalStock(deviceId, device.allocation);
    setStock(localStock);
  }, [deviceId, device]);

  useEffect(() => {
    refreshState();
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshState]);

  const handleConfirmHandout = async () => {
    if (!tokenInput.trim()) { setError('Enter a token ID'); return; }
    setError(null);
    setDuplicateWarning(false);

    const tokenHash = await sha256Hex(SEED_42_POLICY.tokenSalt + tokenInput.trim());
    const isDuplicate = await checkDuplicateToken(deviceId, tokenHash);
    if (isDuplicate) { setDuplicateWarning(true); return; }

    try {
      await createLocalEvent({
        missionId: SEED_42_MISSION_ID,
        deviceId,
        policyVersion: 0,
        tokenHash,
        itemType: 'emergency_kit',
        quantity: 1,
      });
      setLastRecorded(tokenInput.trim());
      setTokenInput('');
      setSyncResult(null);
      await refreshState();
      setTimeout(() => setLastRecorded(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record');
    }
  };

  const handleForceDuplicate = async () => {
    const tokenHash = await sha256Hex(SEED_42_POLICY.tokenSalt + tokenInput.trim());
    setDuplicateWarning(false);
    try {
      await createLocalEvent({
        missionId: SEED_42_MISSION_ID, deviceId, policyVersion: 0,
        tokenHash, itemType: 'emergency_kit', quantity: 1,
      });
      setTokenInput('');
      await refreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncDevice(deviceId, SEED_42_MISSION_ID);
      if (result.errors.length > 0) {
        setSyncResult(`Error: ${result.errors[0]}`);
      } else {
        setSyncResult(`${result.synced} synced${result.quarantined > 0 ? `, ${result.quarantined} quarantined` : ''}`);
      }
      await refreshState();
    } finally {
      setSyncing(false);
    }
  };

  if (!device) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-evidence">
        <p className="text-sm text-white/40">Unknown device</p>
      </div>
    );
  }

  const remainingStock = stock.emergency_kit ?? device.allocation.emergency_kit;
  const pendingCount = events.filter((e) => e.syncStatus === 'pending').length;
  const syncedCount = events.filter((e) => e.syncStatus === 'synced').length;

  return (
    <div className="min-h-screen bg-evidence text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/judge/${sessionId}`} className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-mint transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="font-heading text-[15px]">Device {device.label}</h1>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] ${isOnline ? 'bg-mint/10 text-mint' : 'bg-amber/10 text-amber'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-mint' : 'bg-amber'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Stock bar */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          <div className="flex-1 rounded-lg bg-white/[0.03] px-4 py-4 text-center">
            <p className="font-heading text-2xl">{remainingStock}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-wider text-white/30">remaining</p>
          </div>
          <div className="flex-1 rounded-lg bg-white/[0.03] px-4 py-4 text-center">
            <p className="font-heading text-2xl text-amber">{pendingCount}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-wider text-white/30">pending</p>
          </div>
          <div className="flex-1 rounded-lg bg-white/[0.03] px-4 py-4 text-center">
            <p className="font-heading text-2xl text-mint">{syncedCount}</p>
            <p className="mono mt-1 text-[9px] uppercase tracking-wider text-white/30">synced</p>
          </div>
        </div>

        {/* Success toast */}
        {lastRecorded && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-mint/20 bg-mint/[0.06] px-4 py-3">
            <svg className="h-4 w-4 text-mint" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="text-[12px] text-mint">Recorded {lastRecorded} — pending sync</span>
          </div>
        )}

        {/* Token input */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <label htmlFor="token-input" className="mono text-[10px] uppercase tracking-[0.16em] text-white/30">
            Entitlement Token
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="token-input"
              type="text"
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value); setDuplicateWarning(false); setError(null); }}
              placeholder="e.g. HH-040"
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-mint/40 focus:outline-none focus:ring-1 focus:ring-mint/30"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmHandout()}
            />
            <button
              onClick={handleConfirmHandout}
              disabled={remainingStock <= 0 || !tokenInput.trim()}
              className="rounded-lg bg-mint px-5 py-3 text-[13px] font-medium text-evidence transition hover:bg-mint/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Confirm
            </button>
          </div>

          {error && <p className="mt-3 text-[12px] text-red">{error}</p>}

          {duplicateWarning && (
            <div className="mt-3 rounded-lg border border-amber/20 bg-amber/[0.06] p-3">
              <p className="text-[12px] text-amber">Token already used on this device.</p>
              <div className="mt-2 flex gap-2">
                <button onClick={handleForceDuplicate} className="rounded-lg border border-amber/25 px-3 py-1.5 text-[11px] text-amber hover:bg-amber/10">
                  Record anyway
                </button>
                <button onClick={() => { setDuplicateWarning(false); setTokenInput(''); }} className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/40 hover:bg-white/[0.04]">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {remainingStock <= 0 && (
            <p className="mt-3 text-[12px] text-red">No remaining stock.</p>
          )}
        </div>

        {/* Sync */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={pendingCount === 0 || syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-[13px] text-white/60 transition hover:border-mint/30 hover:text-mint disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {syncing ? 'Syncing...' : `Sync ${pendingCount} event(s)`}
          </button>
          {syncResult && (
            <span className={`text-[12px] ${syncResult.startsWith('Error') ? 'text-red' : 'text-mint'}`}>
              {syncResult}
            </span>
          )}
        </div>

        {/* Event log */}
        <div className="mt-8">
          <h3 className="text-[13px] font-medium text-white/60">Event Log ({events.length})</h3>
          {events.length === 0 ? (
            <div className="mt-3 flex flex-col items-center rounded-xl border border-dashed border-white/10 py-10">
              <p className="text-[13px] text-white/25">No events recorded</p>
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-[10px] text-white/40">
                      {event.sequence}
                    </span>
                    <span className="mono text-[11px] text-white/50">{event.tokenHash.slice(0, 16)}...</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    event.syncStatus === 'synced'
                      ? 'bg-mint/10 text-mint'
                      : event.syncStatus === 'quarantined'
                        ? 'bg-red/10 text-red'
                        : 'bg-amber/10 text-amber'
                  }`}>
                    {event.syncStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
