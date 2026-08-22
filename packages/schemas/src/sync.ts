import { z } from 'zod';
import { UUIDSchema } from './common.js';
import { HandoutEventSchema } from './event.js';

export const SyncRequestSchema = z.object({
  deviceId: UUIDSchema,
  missionId: UUIDSchema,
  events: z.array(HandoutEventSchema).min(1).max(100),
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;

export const SyncResultStatus = z.enum(['accepted', 'already_seen', 'quarantined']);

export const SyncResultItemSchema = z.object({
  eventId: UUIDSchema,
  status: SyncResultStatus,
  reason: z.string().optional(),
});

export const SyncResponseSchema = z.object({
  results: z.array(SyncResultItemSchema),
  serverTime: z.string().datetime(),
});

export type SyncResponse = z.infer<typeof SyncResponseSchema>;
export type SyncResultItem = z.infer<typeof SyncResultItemSchema>;
