'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { type LocalEvent } from '@/lib/db/client';
import { createLocalEvent, checkDuplicateToken, getDeviceEvents, getLocalStock } from '@/lib/offline/event-queue';
import { syncDevice } from '@/lib/offline/sync-engine';

const SEED_42_POLICY_SALT = 'seed42salt000000000000000000000000';
const SEED_42_MISSION_ID = 'a1b2c3d4-0000-4000-8000-000000000001';

const DEVICES: Record<string, { label: string; allocation: Record<string, number> }> = {
  'a1b2c3d4-0000-4000-8000-aaa000000001': { label: 'Alpha', allocation: { emergency_kit: 50 } },
  'a1b2c3d4-0000-4000-8000-bbb000000002': { label: 'Bravo', allocation: { emergency_kit: 50 } },
};

async function sha256Hex(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
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
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [refreshState]);

  const handleConfirm = async () => {
    if (!tokenInput.trim()) { setError('Enter a token'); return; }
    setError(null); setDuplicateWarning(false);
    const tokenHash = await sha256Hex(SEED_42_POLICY_SALT + tokenInput.trim());
    if (await checkDuplicateToken(deviceId, tokenHash)) { setDuplicateWarning(true); return; }
    try {
      await createLocalEvent({ missionId: SEED_42_MISSION_ID, deviceId, policyVersion: 0, tokenHash, itemType: 'emergency_kit', quantity: 1 });
      setTokenInput(''); setSyncResult(null); await refreshState();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleForce = async () => {
    const tokenHash = await sha256Hex(SEED_42_POLICY_SALT + tokenInput.trim());
    setDuplicateWarning(false);
    try {
      await createLocalEvent({ missionId: SEED_42_MISSION_ID, deviceId, policyVersion: 0, tokenHash, itemType: 'emergency_kit', quantity: 1 });
      setTokenInput(''); await refreshState();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const r = await syncDevice(deviceId, SEED_42_MISSION_ID);
      setSyncResult(r.errors.length > 0 ? r.errors[0] : `${r.synced} synced`);
      await refreshState();
    } finally { setSyncing(false); }
  };

  if (!device) return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]"><p className="text-sm text-white/30">Unknown device</p></div>;

  const remaining = stock.emergency_kit ?? device.allocation.emergency_kit;
  const pendingCount = events.filter((e) => e.syncStatus === 'pending').length;
  const syncedCount = events.filter((e) => e.syncStatus === 'synced').length;

  const navItems = [
    { label: 'Overview', href: `/judge/${sessionId}` },
    { label: 'Coordinator', href: `/judge/${sessionId}/coordinator` },
    { label: 'Device Alpha', href: `/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-aaa000000001`, active: deviceId === 'a1b2c3d4-0000-4000-8000-aaa000000001' },
    { label: 'Device Bravo', href: `/judge/${sessionId}/operator/a1b2c3d4-0000-4000-8000-bbb000000002`, active: deviceId === 'a1b2c3d4-0000-4000-8000-bbb000000002' },
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
          <p className="text-[12px] font-medium text-mint">Device {device.label}</p>
          <p className="mt-0.5 text-[11px] text-white/30">{isOnline ? 'Online' : 'Offline'} · {remaining} kits left</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-10 py-8">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Device {device.label}</h1>
              <p className="mt-1 text-[13px] text-white/35">Offline handout recording</p>
            </div>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] ${isOnline ? 'border-mint/20 text-mint' : 'border-amber/20 text-amber'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-mint' : 'bg-amber'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <span className="text-[12px] text-white/40">Remaining</span>
              <p className="mt-3 text-3xl font-semibold">{remaining}</p>
              <p className="mt-1 text-[11px] text-white/25">of {device.allocation.emergency_kit} allocated</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <span className="text-[12px] text-white/40">Pending sync</span>
              <p className="mt-3 text-3xl font-semibold text-amber">{pendingCount}</p>
              <p className="mt-1 text-[11px] text-white/25">awaiting connection</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <span className="text-[12px] text-white/40">Synced</span>
              <p className="mt-3 text-3xl font-semibold text-mint">{syncedCount}</p>
              <p className="mt-1 text-[11px] text-white/25">accepted by server</p>
            </div>
          </div>

          {/* Input */}
          <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <p className="mono text-[10px] uppercase tracking-[0.15em] text-white/25">Record Handout</p>
            <div className="mt-4 flex gap-3">
              <input
                id="token-input"
                type="text"
                value={tokenInput}
                onChange={(e) => { setTokenInput(e.target.value); setDuplicateWarning(false); setError(null); }}
                placeholder="Enter token (e.g. HH-040)"
                className="flex-1 rounded-lg border border-white/[0.08] bg-transparent px-4 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
              <button
                onClick={handleConfirm}
                disabled={remaining <= 0 || !tokenInput.trim()}
                className="rounded-lg bg-white/[0.08] px-5 py-2.5 text-[13px] text-white/70 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Confirm
              </button>
            </div>

            {error && <p className="mt-3 text-[12px] text-red">{error}</p>}
            {remaining <= 0 && <p className="mt-3 text-[12px] text-red">No stock remaining</p>}

            {duplicateWarning && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-amber/15 bg-amber/[0.04] px-4 py-3">
                <p className="text-[12px] text-amber">Duplicate token on this device</p>
                <div className="flex gap-2">
                  <button onClick={handleForce} className="text-[11px] text-amber hover:underline">Record anyway</button>
                  <button onClick={() => { setDuplicateWarning(false); setTokenInput(''); }} className="text-[11px] text-white/30 hover:underline">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Sync */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={pendingCount === 0 || syncing}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-[13px] text-white/50 transition hover:border-white/15 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {syncing ? 'Syncing...' : `Sync ${pendingCount} event(s)`}
            </button>
            {syncResult && <span className={`text-[12px] ${syncResult.includes('Error') || syncResult.includes('error') ? 'text-red' : 'text-mint'}`}>{syncResult}</span>}
          </div>

          {/* Event log */}
          <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <p className="mono text-[10px] uppercase tracking-[0.15em] text-white/25">Event Log</p>
              <span className="text-[12px] text-white/20">{events.length} events</span>
            </div>

            {events.length === 0 ? (
              <p className="mt-6 text-center text-[13px] text-white/20">No events recorded yet</p>
            ) : (
              <div className="mt-4 space-y-1">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b border-white/[0.03] py-2.5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="mono text-[11px] text-white/20">{event.sequence}</span>
                      <span className="mono text-[11px] text-white/40">{event.tokenHash.slice(0, 16)}...</span>
                    </div>
                    <span className={`text-[11px] ${
                      event.syncStatus === 'synced' ? 'text-mint' : event.syncStatus === 'quarantined' ? 'text-red' : 'text-amber'
                    }`}>
                      {event.syncStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
