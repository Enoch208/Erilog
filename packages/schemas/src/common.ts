import { z } from 'zod';

export const UUIDSchema = z.string().uuid();
export const SHA256HexSchema = z.string().length(64).regex(/^[0-9a-f]{64}$/);
export const ISO8601Schema = z.string().datetime();
