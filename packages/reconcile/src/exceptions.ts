import type { HandoutEvent, MissionPolicy, DeviceAllocation } from '@erilog/schemas';
import type { ExceptionRecord } from './types.js';
import { sha256Hex } from '@erilog/crypto';
import { sortedUnique } from './normalize.js';

/**
 * Derive a deterministic exception ID from sorted event IDs and type.
 * This ensures the same exception is always identified the same way
 * regardless of sync order or recomputation timing.
 */
async function deriveExceptionId(eventIds: string[], type: string): Promise<string> {
  const sorted = [...eventIds].sort();
  return sha256Hex(sorted.join('\n') + '\n' + type);
}

/**
 * Detect duplicate-entitlement exceptions.
 *
 * When 2+ events reference the same token under a policy allowing at most N
 * redemptions, and event count exceeds N, ALL events are peers in the exception.
 * The system does NOT choose a winner.
 */
export async function detectDuplicateEntitlements(
  events: HandoutEvent[],
  policy: MissionPolicy
): Promise<ExceptionRecord[]> {
  const exceptions: ExceptionRecord[] = [];

  // Group by (tokenHash + itemType)
  const groups = new Map<string, HandoutEvent[]>();
  for (const event of events) {
    const key = event.tokenHash + '\x00' + event.itemType;
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }

  for (const [, group] of groups) {
    if (group.length === 0) continue;

    const itemType = group[0]!.itemType;
    const allowance = policy.allowances.find((a) => a.itemType === itemType);
    const maxAllowed = allowance?.maxPerEntitlement ?? 1;

    if (group.length > maxAllowed) {
      const sortedIds = group.map((e) => e.id).sort();
      const id = await deriveExceptionId(sortedIds, 'duplicate_entitlement');

      // Order quantities and timestamps by sorted event IDs
      const eventsById = new Map(group.map((e) => [e.id, e]));

      exceptions.push({
        id,
        type: 'duplicate_entitlement',
        tokenHash: group[0]!.tokenHash,
        eventIds: sortedIds,
        deviceIds: sortedUnique(group.map((e) => e.deviceId)),
        quantities: sortedIds.map((eid) => eventsById.get(eid)!.quantity),
        timestamps: sortedIds.map((eid) => eventsById.get(eid)!.deviceTime),
        status: 'unresolved',
      });
    }
  }

  return exceptions;
}

/**
 * Detect per-event overspend: a single event's quantity exceeds the allowance.
 */
export async function detectEventOverspend(
  events: HandoutEvent[],
  policy: MissionPolicy
): Promise<ExceptionRecord[]> {
  const exceptions: ExceptionRecord[] = [];

  for (const event of events) {
    const allowance = policy.allowances.find((a) => a.itemType === event.itemType);
    const maxAllowed = allowance?.maxPerEntitlement ?? 1;

    if (event.quantity > maxAllowed) {
      const id = await deriveExceptionId([event.id], 'event_overspend');
      exceptions.push({
        id,
        type: 'event_overspend',
        eventIds: [event.id],
        deviceIds: [event.deviceId],
        quantities: [event.quantity],
        timestamps: [event.deviceTime],
        status: 'unresolved',
      });
    }
  }

  return exceptions;
}

/**
 * Detect device overspend: total quantity synced by a device exceeds its allocation.
 */
export async function detectDeviceOverspend(
  events: HandoutEvent[],
  devices: DeviceAllocation[]
): Promise<ExceptionRecord[]> {
  const exceptions: ExceptionRecord[] = [];

  // Group events by device
  const byDevice = new Map<string, HandoutEvent[]>();
  for (const event of events) {
    const group = byDevice.get(event.deviceId) ?? [];
    group.push(event);
    byDevice.set(event.deviceId, group);
  }

  for (const device of devices) {
    const deviceEvents = byDevice.get(device.deviceId) ?? [];

    // Check each item type
    const byItemType = new Map<string, HandoutEvent[]>();
    for (const event of deviceEvents) {
      const group = byItemType.get(event.itemType) ?? [];
      group.push(event);
      byItemType.set(event.itemType, group);
    }

    for (const [itemType, itemEvents] of byItemType) {
      const total = itemEvents.reduce((sum, e) => sum + e.quantity, 0);
      const allocated = device.allocation[itemType] ?? 0;

      if (total > allocated) {
        const sortedIds = itemEvents.map((e) => e.id).sort();
        const id = await deriveExceptionId(sortedIds, 'device_overspend');
        const eventsById = new Map(itemEvents.map((e) => [e.id, e]));

        exceptions.push({
          id,
          type: 'device_overspend',
          eventIds: sortedIds,
          deviceIds: [device.deviceId],
          quantities: sortedIds.map((eid) => eventsById.get(eid)!.quantity),
          timestamps: sortedIds.map((eid) => eventsById.get(eid)!.deviceTime),
          status: 'unresolved',
        });
      }
    }
  }

  return exceptions;
}
