import { z } from 'zod';
import { UUIDSchema, SHA256HexSchema } from './common.js';
import { MissionPolicySchema } from './mission.js';

export const PolicyVersionSchema = z.object({
  id: UUIDSchema,
  missionId: UUIDSchema,
  version: z.number().int().nonnegative(),
  policy: MissionPolicySchema,
  policyHash: SHA256HexSchema,
  activatedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type PolicyVersion = z.infer<typeof PolicyVersionSchema>;
