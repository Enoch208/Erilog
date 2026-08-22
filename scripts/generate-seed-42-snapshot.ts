/**
 * Generate the frozen seed-42 expected reconciliation result.
 * Run: pnpm tsx scripts/generate-seed-42-snapshot.ts
 */
import { reconcile } from '@erilog/reconcile';
import { computeEventHash } from '@erilog/crypto';
import type { HandoutEvent, MissionPolicy } from '@erilog/schemas';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(
  readFileSync(resolve(__dirname, '../packages/crypto/fixtures/seed-42-vectors.json'), 'utf-8')
);

const SEED = vectors.seed42Contract;

async function main() {
  const events: HandoutEvent[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < SEED.events.length; i++) {
    const ev = SEED.events[i];
    const tokenHash = vectors.tokenHashes[ev.tokenRaw];
    const previousHash = ev.previousHash
      ? ev.previousHash
      : hashes[i === 1 ? 0 : 2];

    const hashInput = {
      id: ev.id,
      missionId: SEED.mission.id,
      deviceId: ev.deviceId,
      policyVersion: SEED.mission.policyVersion,
      sequence: ev.sequence,
      tokenHash,
      itemType: ev.itemType,
      quantity: ev.quantity,
      deviceTime: ev.deviceTime,
      previousHash,
    };

    const eventHash = await computeEventHash(hashInput);
    hashes.push(eventHash);
    events.push({ ...hashInput, eventHash });
  }

  const input = {
    policy: SEED.policy as MissionPolicy,
    events,
    devices: [
      { deviceId: SEED.devices.alpha.id, allocation: SEED.devices.alpha.allocation },
      { deviceId: SEED.devices.bravo.id, allocation: SEED.devices.bravo.allocation },
    ],
    initialStock: SEED.mission.totalStock,
  };

  const result = await reconcile(input);

  const outPath = resolve(__dirname, '../packages/reconcile/fixtures/seed-42-expected.json');
  writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
  console.log('Written:', outPath);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
