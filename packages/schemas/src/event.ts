import { z } from 'zod';
import { UUIDSchema, SHA256HexSchema, ISO8601Schema } from './common.js';

export const HandoutEventSchema = z.object({
  id: UUIDSchema,
  missionId: UUIDSchema,
  deviceId: UUIDSchema,
  policyVersion: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative(),
  tokenHash: SHA256HexSchema,
  itemType: z.string().min(1),
  quantity: z.number().int().positive(),
  deviceTime: ISO8601Schema,
  previousHash: z.string().min(1), // 64-char hex or "GENESIS"
  eventHash: SHA256HexSchema,
});

export type HandoutEvent = z.infer<typeof HandoutEventSchema>;

/**
 * Fields included in event hash computation.
 * The hash is computed over the RFC 8785 canonical JSON of an object
 * containing exactly these fields (eventHash excluded — it is the output).
 */
export interface EventHashInput {
  id: string;
  missionId: string;
  deviceId: string;
  policyVersion: number;
  sequence: number;
  tokenHash: string;
  itemType: string;
  quantity: number;
  deviceTime: string;
  previousHash: string;
}
