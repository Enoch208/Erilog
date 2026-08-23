import { v4 as uuidv4 } from 'uuid';
import { computeEventHash, toHashInput } from '@erilog/crypto';
import { localDb, type LocalEvent } from '@/lib/db/client';

export interface CreateEventInput {
  missionId: string;
  deviceId: string;
  policyVersion: number;
  tokenHash: string;
  itemType: string;
  quantity: number;
}

/**
 * Creates a new event in the local database with proper hash chain.
 * Returns the event or throws on write failure.
 */
export async function createLocalEvent(input: CreateEventInput): Promise<LocalEvent> {
  // Get previous event for this device to build chain
  const previousEvents = await localDb.events
    .where('[deviceId+sequence]')
    .between(
      [input.deviceId, Dexie.minKey],
      [input.deviceId, Dexie.maxKey]
    )
    .sortBy('sequence');

  const lastEvent = previousEvents[previousEvents.length - 1];
  const sequence = lastEvent ? lastEvent.sequence + 1 : 0;
  const previousHash = lastEvent ? lastEvent.eventHash : 'GENESIS';

  const id = uuidv4();
  const deviceTime = new Date().toISOString();

  // Compute event hash using RFC 8785 canonicalization
  const hashInput = toHashInput({
    id,
    missionId: input.missionId,
    deviceId: input.deviceId,
    policyVersion: input.policyVersion,
    sequence,
    tokenHash: input.tokenHash,
    itemType: input.itemType,
    quantity: input.quantity,
    deviceTime,
    previousHash,
    eventHash: '', // Not part of hash input
  });

  const eventHash = await computeEventHash(hashInput);

  const event: LocalEvent = {
    id,
    missionId: input.missionId,
    deviceId: input.deviceId,
    policyVersion: input.policyVersion,
    sequence,
    tokenHash: input.tokenHash,
    itemType: input.itemType,
    quantity: input.quantity,
    deviceTime,
    previousHash,
    eventHash,
    syncStatus: 'pending',
    createdAt: deviceTime,
  };

  // Write to IndexedDB — if this fails, no state change occurs
  await localDb.events.add(event);

  return event;
}

/**
 * Check if this token has already been used on this device.
 */
export async function checkDuplicateToken(
  deviceId: string,
  tokenHash: string
): Promise<boolean> {
  const existing = await localDb.events
    .where('tokenHash')
    .equals(tokenHash)
    .filter((e) => e.deviceId === deviceId)
    .count();

  return existing > 0;
}

/**
 * Get all pending events for a device, ordered by sequence.
 */
export async function getPendingEvents(deviceId: string): Promise<LocalEvent[]> {
  return localDb.events
    .where('syncStatus')
    .equals('pending')
    .filter((e) => e.deviceId === deviceId)
    .sortBy('sequence');
}

/**
 * Get all events for a device.
 */
export async function getDeviceEvents(deviceId: string): Promise<LocalEvent[]> {
  return localDb.events
    .where('deviceId')
    .equals(deviceId)
    .sortBy('sequence');
}

/**
 * Compute local stock for a device.
 */
export async function getLocalStock(
  deviceId: string,
  allocation: Record<string, number>
): Promise<Record<string, number>> {
  const deviceEvents = await localDb.events
    .where('deviceId')
    .equals(deviceId)
    .toArray();

  const stock: Record<string, number> = { ...allocation };
  for (const event of deviceEvents) {
    stock[event.itemType] = (stock[event.itemType] ?? 0) - event.quantity;
  }
  return stock;
}

// Dexie is needed for the compound index query
import Dexie from 'dexie';
