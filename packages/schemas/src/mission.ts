import { z } from 'zod';
import { UUIDSchema } from './common.js';

export const MissionPolicySchema = z.object({
  items: z.array(z.object({
    type: z.string().min(1),
    unit: z.string().min(1),
  })).min(1),
  allowances: z.array(z.object({
    itemType: z.string().min(1),
    maxPerEntitlement: z.number().int().positive(),
  })).min(1),
  tokenSalt: z.string().min(32),
});

export type MissionPolicy = z.infer<typeof MissionPolicySchema>;

export const MissionSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  status: z.enum(['draft', 'active', 'closed']),
  totalStock: z.record(z.string(), z.number().int().positive()),
  activatedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type Mission = z.infer<typeof MissionSchema>;
