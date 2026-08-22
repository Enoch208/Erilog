import { z } from 'zod';
import { UUIDSchema } from './common.js';

export const DeviceSchema = z.object({
  id: UUIDSchema,
  missionId: UUIDSchema,
  label: z.string().min(1),
  allocation: z.record(z.string(), z.number().int().nonnegative()),
  packageHash: z.string().optional(),
  provisionedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type Device = z.infer<typeof DeviceSchema>;

/**
 * Minimal device allocation info needed by the reconciliation engine.
 */
export interface DeviceAllocation {
  deviceId: string;
  allocation: Record<string, number>;
}
