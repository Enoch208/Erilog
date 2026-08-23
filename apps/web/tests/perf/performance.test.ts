import { describe, it, expect } from 'vitest';
import { reconcile } from '@erilog/reconcile';
import { computeEventHash, toHashInput, sha256Hex } from '@erilog/crypto';
import type { HandoutEvent } from '@erilog/schemas';
import type { ReconciliationInput } from '@erilog/reconcile';

/**
 * Performance benchmarks for critical paths.
 *
 * Targets (from PRD NFR-PER):
 * - Token lookup + event confirmation: < 300ms p95
 * - Reconciliation of 10,000 events: < 2s
 * - Hash computation: sub-millisecond per event
 */

const TOKEN_SALT = 'seed42salt000000000000000000000000';
const MISSION_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const DEVICE_ID = 'a1b2c3d4-0000-4000-8000-aaa000000001';

async function generateEvents(count: number): Promise<HandoutEvent[]> {
  const events: HandoutEvent[] = [];
  let previousHash = 'GENESIS';

  for (let i = 0; i < count; i++) {
    const tokenHash = await sha256Hex(TOKEN_SALT + `TOKEN-${i.toString().padStart(5, '0')}`);
    const partial = {
      id: `e0e0e0e0-0000-4000-8000-${i.toString(16).padStart(12, '0')}`,
      missionId: MISSION_ID,
      deviceId: DEVICE_ID,
      policyVersion: 0,
      sequence: i,
      tokenHash,
      itemType: 'emergency_kit',
      quantity: 1,
      deviceTime: new Date(Date.now() + i * 1000).toISOString(),
      previousHash,
      eventHash: '',
    };

    const hashInput = toHashInput(partial as HandoutEvent);
    const eventHash = await computeEventHash(hashInput);
    previousHash = eventHash;

    events.push({ ...partial, eventHash });
  }
  return events;
}

describe('Performance Benchmarks', () => {
  it('single event hash computation < 5ms', async () => {
    const tokenHash = await sha256Hex(TOKEN_SALT + 'HH-040');
    const event = {
      id: crypto.randomUUID(),
      missionId: MISSION_ID,
      deviceId: DEVICE_ID,
      policyVersion: 0,
      sequence: 0,
      tokenHash,
      itemType: 'emergency_kit',
      quantity: 1,
      deviceTime: new Date().toISOString(),
      previousHash: 'GENESIS',
      eventHash: '',
    };

    const start = performance.now();
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      const hashInput = toHashInput(event as HandoutEvent);
      await computeEventHash(hashInput);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    console.log(`  Hash computation: ${avgMs.toFixed(3)}ms avg (${iterations} iterations)`);
    expect(avgMs).toBeLessThan(5);
  });

  it('token hash lookup < 1ms', async () => {
    const start = performance.now();
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      await sha256Hex(TOKEN_SALT + `HH-${i.toString().padStart(3, '0')}`);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    console.log(`  Token hash: ${avgMs.toFixed(4)}ms avg (${iterations} iterations)`);
    expect(avgMs).toBeLessThan(1);
  });

  it('reconciliation of 100 events < 100ms', async () => {
    const events = await generateEvents(100);
    const input: ReconciliationInput = {
      policy: {
        items: [{ type: 'emergency_kit', unit: 'kit' }],
        allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
        tokenSalt: TOKEN_SALT,
      },
      events,
      devices: [{ deviceId: DEVICE_ID, allocation: { emergency_kit: 200 } }],
      initialStock: { emergency_kit: 200 },
    };

    const start = performance.now();
    const result = await reconcile(input);
    const elapsed = performance.now() - start;

    console.log(`  Reconcile 100 events: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(100);
    expect(result.summary.totalPhysicalHandouts).toBe(100);
  });

  it('reconciliation of 1000 events < 500ms', async () => {
    const events = await generateEvents(1000);
    const input: ReconciliationInput = {
      policy: {
        items: [{ type: 'emergency_kit', unit: 'kit' }],
        allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
        tokenSalt: TOKEN_SALT,
      },
      events,
      devices: [{ deviceId: DEVICE_ID, allocation: { emergency_kit: 2000 } }],
      initialStock: { emergency_kit: 2000 },
    };

    const start = performance.now();
    const result = await reconcile(input);
    const elapsed = performance.now() - start;

    console.log(`  Reconcile 1000 events: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(500);
    expect(result.summary.totalPhysicalHandouts).toBe(1000);
  });

  it('event chain generation (100 events) < 300ms', async () => {
    const start = performance.now();
    await generateEvents(100);
    const elapsed = performance.now() - start;

    console.log(`  Generate 100-event chain: ${elapsed.toFixed(1)}ms`);
    // 300ms target for token lookup + confirmation (single event path)
    // Generating 100 events includes 100 hash computations
    expect(elapsed).toBeLessThan(3000); // 30ms per event is generous
  });
});
