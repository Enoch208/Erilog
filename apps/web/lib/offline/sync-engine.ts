'use client';

import { localDb, type LocalEvent } from '@/lib/db/client';

const MAX_BATCH_SIZE = 100;
const INITIAL_BACKOFF = 2000;
const MAX_BACKOFF = 60000;

export interface SyncResult {
  eventId: string;
  status: 'accepted' | 'already_seen' | 'quarantined';
  reason?: string;
}

/**
 * Syncs pending events for a device to the server.
 * Implements batching and exponential backoff.
 */
export async function syncDevice(deviceId: string, missionId: string): Promise<{
  synced: number;
  quarantined: number;
  errors: string[];
}> {
  let backoff = INITIAL_BACKOFF;
  let synced = 0;
  let quarantined = 0;
  const errors: string[] = [];

  // Get pending events ordered by sequence
  const pending = await localDb.events
    .where('syncStatus')
    .equals('pending')
    .filter((e) => e.deviceId === deviceId)
    .sortBy('sequence');

  if (pending.length === 0) {
    return { synced: 0, quarantined: 0, errors: [] };
  }

  // Process in batches
  for (let i = 0; i < pending.length; i += MAX_BATCH_SIZE) {
    const batch = pending.slice(i, i + MAX_BATCH_SIZE);
    const payload = {
      deviceId,
      missionId,
      events: batch.map((e) => ({
        id: e.id,
        missionId: e.missionId,
        deviceId: e.deviceId,
        policyVersion: e.policyVersion,
        sequence: e.sequence,
        tokenHash: e.tokenHash,
        itemType: e.itemType,
        quantity: e.quantity,
        deviceTime: e.deviceTime,
        previousHash: e.previousHash,
        eventHash: e.eventHash,
      })),
    };

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          errors.push('Session expired. Please refresh.');
          break;
        }
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();
      const results: SyncResult[] = data.results;

      for (const result of results) {
        if (result.status === 'accepted' || result.status === 'already_seen') {
          await localDb.events.update(result.eventId, { syncStatus: 'synced' });
          synced++;
        } else if (result.status === 'quarantined') {
          await localDb.events.update(result.eventId, {
            syncStatus: 'quarantined',
            quarantineReason: result.reason,
          });
          quarantined++;
        }
      }

      // Reset backoff on success
      backoff = INITIAL_BACKOFF;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      errors.push(message);
      // Wait with backoff before retrying
      await new Promise((r) => setTimeout(r, backoff));
      backoff = Math.min(backoff * 2, MAX_BACKOFF);
      break; // Stop processing further batches on error
    }
  }

  return { synced, quarantined, errors };
}
