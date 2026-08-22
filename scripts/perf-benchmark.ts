/**
 * Erilog Performance Benchmark
 *
 * Measures reconciliation engine performance under load.
 * Reports p50 and p95 latencies for the hackathon performance targets.
 *
 * Targets from PRD:
 * - NFR-PER-003: 10,000 events reconciled within 2 seconds
 *
 * Usage: pnpm tsx scripts/perf-benchmark.ts
 */

import { reconcile } from '@erilog/reconcile';
import type { ReconciliationInput } from '@erilog/reconcile';
import type { HandoutEvent, MissionPolicy } from '@erilog/schemas';
import { performance } from 'node:perf_hooks';
import { randomUUID } from 'node:crypto';

const RUNS = 10;
const EVENT_COUNTS = [100, 1000, 5000, 10000];

function generateSyntheticEvents(count: number): HandoutEvent[] {
  const events: HandoutEvent[] = [];
  const deviceIds = [randomUUID(), randomUUID(), randomUUID()];

  for (let i = 0; i < count; i++) {
    events.push({
      id: randomUUID(),
      missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
      deviceId: deviceIds[i % 3]!,
      policyVersion: 0,
      sequence: Math.floor(i / 3),
      tokenHash: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
      itemType: 'emergency_kit',
      quantity: 1,
      deviceTime: new Date(2026, 7, 22, 10, i % 60, Math.floor(i / 60)).toISOString(),
      previousHash: 'GENESIS',
      eventHash: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
    });
  }

  return events;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function benchmark(eventCount: number): Promise<{ p50: number; p95: number; mean: number }> {
  const events = generateSyntheticEvents(eventCount);

  const policy: MissionPolicy = {
    items: [{ type: 'emergency_kit', unit: 'kit' }],
    allowances: [{ itemType: 'emergency_kit', maxPerEntitlement: 1 }],
    tokenSalt: 'benchmarksalt00000000000000000000',
  };

  const input: ReconciliationInput = {
    policy,
    events,
    devices: [
      { deviceId: events[0]!.deviceId, allocation: { emergency_kit: 100000 } },
      { deviceId: events[1]!.deviceId, allocation: { emergency_kit: 100000 } },
      { deviceId: events[2]!.deviceId, allocation: { emergency_kit: 100000 } },
    ],
    initialStock: { emergency_kit: 1000000 },
  };

  const durations: number[] = [];

  for (let run = 0; run < RUNS; run++) {
    const start = performance.now();
    await reconcile(input);
    const end = performance.now();
    durations.push(end - start);
  }

  durations.sort((a, b) => a - b);

  return {
    p50: percentile(durations, 50),
    p95: percentile(durations, 95),
    mean: durations.reduce((a, b) => a + b, 0) / durations.length,
  };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         ERILOG PERFORMANCE BENCHMARK                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`Runtime: Node.js ${process.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log(`Runs per benchmark: ${RUNS}\n`);

  console.log('┌────────────┬──────────┬──────────┬──────────┬────────┐');
  console.log('│ Events     │ p50 (ms) │ p95 (ms) │ mean(ms) │ Target │');
  console.log('├────────────┼──────────┼──────────┼──────────┼────────┤');

  for (const count of EVENT_COUNTS) {
    const result = await benchmark(count);
    const target = count === 10000 ? '< 2000ms' : '—';
    const pass = count === 10000 ? (result.p95 < 2000 ? '✓' : '✗') : ' ';
    console.log(
      `│ ${String(count).padStart(10)} │ ${result.p50.toFixed(1).padStart(8)} │ ${result.p95.toFixed(1).padStart(8)} │ ${result.mean.toFixed(1).padStart(8)} │ ${target.padStart(6)} ${pass}│`
    );
  }

  console.log('└────────────┴──────────┴──────────┴──────────┴────────┘');
  console.log('\nNotes:');
  console.log('- Reconciliation is a pure function of (policy + events + devices + stock).');
  console.log('- No I/O, no database calls during measurement.');
  console.log('- Synthetic events with unique token hashes (worst case for grouping).');
  console.log('- Target NFR-PER-003: 10,000 events < 2 seconds at p95.');
}

main().catch(console.error);
