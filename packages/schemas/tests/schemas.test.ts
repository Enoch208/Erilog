import { describe, it, expect } from 'vitest';
import {
  HandoutEventSchema,
  MissionPolicySchema,
  PolicyVersionSchema,
  DeviceSchema,
  SyncRequestSchema,
  SyncResponseSchema,
} from '../src/index.js';

describe('@erilog/schemas', () => {
  const validEvent = {
    id: 'e0e0e0e0-0000-4000-8000-000000000001',
    missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
    deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
    policyVersion: 0,
    sequence: 0,
    tokenHash: 'a'.repeat(64),
    itemType: 'emergency_kit',
    quantity: 1,
    deviceTime: '2026-08-22T10:00:00.000Z',
    previousHash: 'GENESIS',
    eventHash: 'b'.repeat(64),
  };

  describe('HandoutEventSchema', () => {
    it('accepts a valid seed-42 event', () => {
      const result = HandoutEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('rejects negative quantity', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, quantity: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects zero quantity', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, quantity: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects decimal quantity', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, quantity: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid UUID', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects short tokenHash', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, tokenHash: 'abc' });
      expect(result.success).toBe(false);
    });

    it('rejects uppercase hex in tokenHash', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, tokenHash: 'A'.repeat(64) });
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const { id, ...noId } = validEvent;
      const result = HandoutEventSchema.safeParse(noId);
      expect(result.success).toBe(false);
    });

    it('accepts sequence 0 (first event on device)', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, sequence: 0 });
      expect(result.success).toBe(true);
    });

    it('rejects negative sequence', () => {
      const result = HandoutEventSchema.safeParse({ ...validEvent, sequence: -1 });
      expect(result.success).toBe(false);
    });

    it('has no PII fields', () => {
      const shape = HandoutEventSchema.shape;
      const keys = Object.keys(shape);
      const piiFields = ['name', 'phone', 'email', 'address', 'biometric', 'location'];
      for (const pii of piiFields) {
        expect(keys).not.toContain(pii);
      }
    });
  });

  describe('MissionPolicySchema', () => {
    const validPolicy = {
      items: [{ type: 'emergency_kit', unit: 'kit' }],
      allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
      tokenSalt: 'seed42salt000000000000000000000000',
    };

    it('accepts a valid policy', () => {
      const result = MissionPolicySchema.safeParse(validPolicy);
      expect(result.success).toBe(true);
    });

    it('rejects zero maxPerEntitlement', () => {
      const bad = { ...validPolicy, allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 0 }] };
      const result = MissionPolicySchema.safeParse(bad);
      expect(result.success).toBe(false);
    });

    it('rejects short tokenSalt', () => {
      const result = MissionPolicySchema.safeParse({ ...validPolicy, tokenSalt: 'short' });
      expect(result.success).toBe(false);
    });

    it('rejects empty items array', () => {
      const result = MissionPolicySchema.safeParse({ ...validPolicy, items: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('DeviceSchema', () => {
    const validDevice = {
      id: 'a1b2c3d4-0000-4000-8000-aaa000000001',
      missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
      label: 'Alpha',
      allocation: { emergency_kit: 50 },
      createdAt: '2026-08-22T09:00:00.000Z',
    };

    it('accepts a valid device', () => {
      const result = DeviceSchema.safeParse(validDevice);
      expect(result.success).toBe(true);
    });

    it('rejects empty label', () => {
      const result = DeviceSchema.safeParse({ ...validDevice, label: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('SyncRequestSchema', () => {
    it('accepts valid sync request with 1 event', () => {
      const result = SyncRequestSchema.safeParse({
        deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
        missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
        events: [validEvent],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty events array', () => {
      const result = SyncRequestSchema.safeParse({
        deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
        missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
        events: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SyncResponseSchema', () => {
    it('accepts valid sync response', () => {
      const result = SyncResponseSchema.safeParse({
        results: [
          { eventId: 'e0e0e0e0-0000-4000-8000-000000000001', status: 'accepted' },
          { eventId: 'e0e0e0e0-0000-4000-8000-000000000002', status: 'already_seen' },
          { eventId: 'e0e0e0e0-0000-4000-8000-000000000003', status: 'quarantined', reason: 'CHAIN_BREAK' },
        ],
        serverTime: '2026-08-22T12:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });
});
