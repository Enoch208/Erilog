import type { HandoutEvent } from '@erilog/schemas';

/**
 * Canonical sort order for events: (tokenHash ASC, deviceId ASC, sequence ASC).
 * This ensures deterministic processing regardless of input order.
 */
export function canonicalSortEvents(events: HandoutEvent[]): HandoutEvent[] {
  return [...events].sort((a, b) => {
    const tokenCmp = a.tokenHash.localeCompare(b.tokenHash);
    if (tokenCmp !== 0) return tokenCmp;
    const deviceCmp = a.deviceId.localeCompare(b.deviceId);
    if (deviceCmp !== 0) return deviceCmp;
    return a.sequence - b.sequence;
  });
}

/**
 * Extract unique values from an array, sorted.
 */
export function sortedUnique(arr: string[]): string[] {
  return [...new Set(arr)].sort();
}
