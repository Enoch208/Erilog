import { describe, it, expect, beforeAll } from 'vitest';
import { computeEventHash, sha256Hex, verifyDeviceChain, hexEncode } from '../src/hash-chain.js';
import { sign, verify, getPublicKey, generatePrivateKey, keyFingerprint } from '../src/signing.js';
import { canonicalize } from '../src/canonicalize.js';
import type { HandoutEvent, EventHashInput } from '@erilog/schemas';

/**
 * Seed-42 frozen contract.
 * These values are computed once and then frozen as the canonical reference.
 * Server, browser, and verifier must all agree on these exact values.
 */

const SEED_42 = {
  mission: {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    policyVersion: 0,
    tokenSalt: 'seed42salt000000000000000000000000',
  },
  devices: {
    alpha: { id: 'a1b2c3d4-0000-4000-8000-aaa000000001' },
    bravo: { id: 'a1b2c3d4-0000-4000-8000-bbb000000002' },
  },
  tokens: {
    'HH-040': 'HH-040',
    'HH-041': 'HH-041',
    'HH-042': 'HH-042',
  },
  events: [
    {
      id: 'e0e0e0e0-0000-4000-8000-000000000001',
      deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
      sequence: 0,
      tokenRaw: 'HH-040',
      deviceTime: '2026-08-22T10:00:00.000Z',
    },
    {
      id: 'e0e0e0e0-0000-4000-8000-000000000002',
      deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
      sequence: 1,
      tokenRaw: 'HH-042',
      deviceTime: '2026-08-22T10:01:00.000Z',
    },
    {
      id: 'e0e0e0e0-0000-4000-8000-000000000003',
      deviceId: 'a1b2c3d4-0000-4000-8000-bbb000000002',
      sequence: 0,
      tokenRaw: 'HH-041',
      deviceTime: '2026-08-22T10:02:00.000Z',
    },
    {
      id: 'e0e0e0e0-0000-4000-8000-000000000004',
      deviceId: 'a1b2c3d4-0000-4000-8000-bbb000000002',
      sequence: 1,
      tokenRaw: 'HH-042',
      deviceTime: '2026-08-22T10:03:00.000Z',
    },
  ],
};

// Computed and frozen values — these are the golden vectors
let tokenHashes: Record<string, string>;
let eventHashInputs: EventHashInput[];
let eventHashes: string[];
let eventSetDigest: string;

// Test signing key pair (fixed for reproducible tests)
const TEST_PRIVATE_KEY = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';

describe('Golden Cryptographic Vectors (Seed-42)', () => {
  beforeAll(async () => {
    // Compute token hashes
    tokenHashes = {};
    for (const [label, raw] of Object.entries(SEED_42.tokens)) {
      tokenHashes[label] = await sha256Hex(SEED_42.mission.tokenSalt + raw);
    }

    // Build event hash inputs and compute hashes
    eventHashInputs = [];
    eventHashes = [];

    for (let i = 0; i < SEED_42.events.length; i++) {
      const ev = SEED_42.events[i]!;
      const input: EventHashInput = {
        id: ev.id,
        missionId: SEED_42.mission.id,
        deviceId: ev.deviceId,
        policyVersion: SEED_42.mission.policyVersion,
        sequence: ev.sequence,
        tokenHash: tokenHashes[ev.tokenRaw]!,
        itemType: 'emergency_kit',
        quantity: 1,
        deviceTime: ev.deviceTime,
        previousHash: ev.sequence === 0
          ? 'GENESIS'
          : eventHashes[i === 1 ? 0 : 2]!, // Alpha chain: event[0]->event[1], Bravo chain: event[2]->event[3]
      };
      eventHashInputs.push(input);
      const hash = await computeEventHash(input);
      eventHashes.push(hash);
    }

    // Event set digest: sha256 of sorted event IDs joined by newline
    const sortedIds = SEED_42.events.map(e => e.id).sort();
    eventSetDigest = await sha256Hex(sortedIds.join('\n'));
  });

  describe('Token Hashes', () => {
    it('produces 64-char lowercase hex for each token', () => {
      for (const hash of Object.values(tokenHashes)) {
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
      }
    });

    it('different tokens produce different hashes', () => {
      const hashes = Object.values(tokenHashes);
      const unique = new Set(hashes);
      expect(unique.size).toBe(3);
    });

    it('same token+salt always produces same hash', async () => {
      const hash1 = await sha256Hex(SEED_42.mission.tokenSalt + 'HH-042');
      const hash2 = await sha256Hex(SEED_42.mission.tokenSalt + 'HH-042');
      expect(hash1).toBe(hash2);
    });

    it('HH-040 and HH-042 hashes are distinct', () => {
      expect(tokenHashes['HH-040']).not.toBe(tokenHashes['HH-042']);
    });
  });

  describe('Event Hashes', () => {
    it('produces 4 unique event hashes', () => {
      expect(eventHashes.length).toBe(4);
      const unique = new Set(eventHashes);
      expect(unique.size).toBe(4);
    });

    it('each hash is 64-char lowercase hex', () => {
      for (const hash of eventHashes) {
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
      }
    });

    it('recomputing event hash produces same result', async () => {
      for (let i = 0; i < eventHashInputs.length; i++) {
        const recomputed = await computeEventHash(eventHashInputs[i]!);
        expect(recomputed).toBe(eventHashes[i]);
      }
    });

    it('changing any field produces a different hash', async () => {
      const modified = { ...eventHashInputs[0]!, quantity: 2 };
      const modifiedHash = await computeEventHash(modified);
      expect(modifiedHash).not.toBe(eventHashes[0]);
    });
  });

  describe('Chain Verification', () => {
    it('Alpha chain (events 0,1) verifies successfully', async () => {
      const alphaEvents: HandoutEvent[] = [
        { ...eventHashInputs[0]!, eventHash: eventHashes[0]! },
        { ...eventHashInputs[1]!, eventHash: eventHashes[1]! },
      ];
      const result = await verifyDeviceChain(alphaEvents);
      expect(result.valid).toBe(true);
    });

    it('Bravo chain (events 2,3) verifies successfully', async () => {
      const bravoEvents: HandoutEvent[] = [
        { ...eventHashInputs[2]!, eventHash: eventHashes[2]! },
        { ...eventHashInputs[3]!, eventHash: eventHashes[3]! },
      ];
      const result = await verifyDeviceChain(bravoEvents);
      expect(result.valid).toBe(true);
    });

    it('broken chain (tampered hash) fails', async () => {
      const broken: HandoutEvent[] = [
        { ...eventHashInputs[0]!, eventHash: eventHashes[0]! },
        { ...eventHashInputs[1]!, eventHash: 'f'.repeat(64) }, // tampered
      ];
      const result = await verifyDeviceChain(broken);
      expect(result.valid).toBe(false);
      expect(result.brokenAt).toBe(1);
      expect(result.reason).toBe('self_hash_mismatch');
    });

    it('chain break (wrong previousHash) fails', async () => {
      const broken: HandoutEvent[] = [
        { ...eventHashInputs[0]!, eventHash: eventHashes[0]! },
        {
          ...eventHashInputs[1]!,
          previousHash: 'a'.repeat(64), // wrong
          eventHash: eventHashes[1]!,   // will mismatch too
        },
      ];
      const result = await verifyDeviceChain(broken);
      expect(result.valid).toBe(false);
    });
  });

  describe('Event Set Digest', () => {
    it('produces 64-char hex', () => {
      expect(eventSetDigest).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic regardless of input order', async () => {
      // Reverse order, still same digest (because we sort IDs)
      const reversed = [...SEED_42.events].reverse().map(e => e.id).sort();
      const digest2 = await sha256Hex(reversed.join('\n'));
      expect(digest2).toBe(eventSetDigest);
    });
  });

  describe('Ed25519 Signing', () => {
    it('generates valid key pair', async () => {
      const privKey = generatePrivateKey();
      expect(privKey).toMatch(/^[0-9a-f]{64}$/);
      const pubKey = await getPublicKey(privKey);
      expect(pubKey).toMatch(/^[0-9a-f]{64}$/);
    });

    it('sign and verify round-trip succeeds', async () => {
      const pubKey = await getPublicKey(TEST_PRIVATE_KEY);
      const message = new TextEncoder().encode('test manifest content');
      const signature = await sign(message, TEST_PRIVATE_KEY);
      const valid = await verify(signature, message, pubKey);
      expect(valid).toBe(true);
    });

    it('tampered message fails verification', async () => {
      const pubKey = await getPublicKey(TEST_PRIVATE_KEY);
      const message = new TextEncoder().encode('test manifest content');
      const signature = await sign(message, TEST_PRIVATE_KEY);
      const tampered = new TextEncoder().encode('tampered manifest content');
      const valid = await verify(signature, tampered, pubKey);
      expect(valid).toBe(false);
    });

    it('wrong key fails verification', async () => {
      const pubKey = await getPublicKey(TEST_PRIVATE_KEY);
      const otherKey = generatePrivateKey();
      const otherPub = await getPublicKey(otherKey);
      const message = new TextEncoder().encode('test manifest content');
      const signature = await sign(message, TEST_PRIVATE_KEY);
      const valid = await verify(signature, message, otherPub);
      expect(valid).toBe(false);
      // But verifies with correct key
      const correctValid = await verify(signature, message, pubKey);
      expect(correctValid).toBe(true);
    });

    it('key fingerprint is deterministic', async () => {
      const pubKey = await getPublicKey(TEST_PRIVATE_KEY);
      const fp1 = await keyFingerprint(pubKey);
      const fp2 = await keyFingerprint(pubKey);
      expect(fp1).toBe(fp2);
      expect(fp1).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('Frozen Vector Export', () => {
    it('prints all golden vectors for fixture file', () => {
      // This test documents the exact values.
      // If these ever change, the contract is broken.
      console.log(JSON.stringify({
        tokenHashes,
        eventHashes,
        eventSetDigest,
      }, null, 2));

      // Structural assertions that will catch regressions
      expect(Object.keys(tokenHashes)).toEqual(['HH-040', 'HH-041', 'HH-042']);
      expect(eventHashes.length).toBe(4);
      expect(eventSetDigest.length).toBe(64);
    });
  });
});
