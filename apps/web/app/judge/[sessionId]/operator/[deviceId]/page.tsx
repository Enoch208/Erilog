'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { localDb, type LocalEvent, type LocalMission } from '@/lib/db/client';
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
    if (!tokenInput.trim()) {
      setError('Enter a token ID');
      return;
    }

    setError(null);
    setDuplicateWarning(false);

    const tokenHash = await sha256Hex(SEED_42_POLICY.tokenSalt + tokenInput.trim());

    // Check for duplicate on this device
    const isDuplicate = await checkDuplicateToken(deviceId, tokenHash);
    if (isDuplicate) {
      setDuplicateWarning(true);
      return;
    }

    try {
      await createLocalEvent({
        missionId: SEED_42_MISSION_ID,
        deviceId,
        policyVersion: 0,
        tokenHash,
        itemType: 'emergency_kit',
        quantity: 1,
      });
      setTokenInput('');
      setSyncResult(null);
      await refreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record event');
    }
  };

  const handleForceDuplicate = async () => {
    const tokenHash = await sha256Hex(SEED_42_POLICY.tokenSalt + tokenInput.trim());
    setDuplicateWarning(false);
    try {
      await createLocalEvent({
        missionId: SEED_42_MISSION_ID,
        deviceId,
        policyVersion: 0,
        tokenHash,
        itemType: 'emergency_kit',
        quantity: 1,
      });
      setTokenInput('');
      await refreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record event');
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
        setSyncResult(`Synced ${result.synced} event(s)${result.quarantined > 0 ? `, ${result.quarantined} quarantined` : ''}`);
      }
      await refreshState();
    } finally {
      setSyncing(false);
    }
  };

  if (!device) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-muted">Unknown device</p>
      </div>
    );
  }

  const remainingStock = stock.emergency_kit ?? device.allocation.emergency_kit;
  const pendingCount = events.filter((e) => e.syncStatus === 'pending').length;
  const syncedCount = events.filter((e) => e.syncStatus === 'synced').length;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/judge/${sessionId}`} className="text-sm text-mint hover:text-mint-dark">
              ← Back
            </Link>
            <h1 className="font-heading text-lg text-ink">Operator {device.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-[11px] ${isOnline ? 'text-mint' : 'text-amber'}`}>
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-mint' : 'bg-amber'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Stock indicator */}
        <div className="flex items-center gap-6 rounded-feature border border-border bg-surface p-5">
          <div>
            <p className="mono text-[9px] uppercase tracking-wider text-muted">Local Stock</p>
            <p className="mt-1 font-heading text-3xl text-ink">{remainingStock}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="mono text-[9px] uppercase tracking-wider text-muted">Pending Sync</p>
            <p className="mt-1 font-heading text-xl text-amber">{pendingCount}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="mono text-[9px] uppercase tracking-wider text-muted">Synced</p>
            <p className="mt-1 font-heading text-xl text-mint">{syncedCount}</p>
          </div>
        </div>

        {/* Token input */}
        <div className="mt-6 rounded-feature border border-border bg-surface p-5">
          <label htmlFor="token-input" className="mono text-[10px] uppercase tracking-wider text-muted">
            Entitlement Token
          </label>
          <div className="mt-2 flex gap-3">
            <input
              id="token-input"
              type="text"
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value); setDuplicateWarning(false); setError(null); }}
              placeholder="e.g. HH-040"
              className="flex-1 rounded-control border border-border bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted/50 focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmHandout()}
            />
            <button
              onClick={handleConfirmHandout}
              disabled={remainingStock <= 0 || !tokenInput.trim()}
              className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Handout
            </button>
          </div>

          {error && (
            <p className="mt-2 text-[12px] text-red">{error}</p>
          )}

          {duplicateWarning && (
            <div className="mt-3 rounded-control border border-amber/30 bg-amber/[0.06] p-3">
              <p className="text-[12px] text-amber">
                This token was already used on this device.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleForceDuplicate}
                  className="rounded-full border border-amber/30 px-3 py-1 text-[11px] text-amber hover:bg-amber/10"
                >
                  Record anyway
                </button>
                <button
                  onClick={() => { setDuplicateWarning(false); setTokenInput(''); }}
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-muted hover:bg-canvas"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {remainingStock <= 0 && (
            <p className="mt-2 text-[12px] text-red">No remaining stock. Cannot record handouts.</p>
          )}
        </div>

        {/* Sync button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={pendingCount === 0 || syncing}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : `Sync ${pendingCount} event(s)`}
          </button>
          {syncResult && (
            <p className={`text-[12px] ${syncResult.startsWith('Error') ? 'text-red' : 'text-mint'}`}>
              {syncResult}
            </p>
          )}
        </div>

        {/* Event log */}
        <h3 className="mt-8 font-heading text-sm text-ink">Event Log ({events.length})</h3>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No events recorded yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-control border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="mono text-[10px] text-muted">#{event.sequence}</span>
                  <span className="mono text-[11px] text-ink">{event.tokenHash.slice(0, 16)}...</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    event.syncStatus === 'synced'
                      ? 'bg-mint-wash text-mint-dark'
                      : event.syncStatus === 'quarantined'
                        ? 'bg-red/10 text-red'
                        : 'bg-amber/10 text-amber'
                  }`}
                >
                  {event.syncStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
