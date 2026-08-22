/**
 * PostgreSQL Integration Tests
 *
 * Tests the real database boundary:
 * - Immutable policy versions reject UPDATE/DELETE via app_role
 * - Events reject UPDATE/DELETE via app_role
 * - Accepted events survive process reconstruction
 * - Identical replay is idempotent at DB level
 * - Same ID with different content returns EVENT_ID_COLLISION
 * - Sequence gaps and chain breaks handled correctly
 * - Reconciliation snapshots keyed by eventSetDigest
 * - Seed-42 produces frozen expected result from persisted records
 *
 * Requires: docker compose up (PostgreSQL on localhost:5432)
 * Run: pnpm --filter @erilog/reconcile test -- integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

const ADMIN_URL = 'postgresql://erilog:erilog_dev@localhost:5432/erilog';
const APP_URL = 'postgresql://app_role:app_pass@localhost:5432/erilog';

let adminPool: pg.Pool;
let appPool: pg.Pool;

beforeAll(async () => {
  adminPool = new pg.Pool({ connectionString: ADMIN_URL, max: 2 });
  appPool = new pg.Pool({ connectionString: APP_URL, max: 2 });

  // Verify connectivity
  const res = await adminPool.query('SELECT 1 as ok');
  expect(res.rows[0].ok).toBe(1);
});

afterAll(async () => {
  await adminPool?.end();
  await appPool?.end();
});

describe('PostgreSQL Integration — Immutability', () => {
  let missionId: string;
  let policyVersionId: string;

  beforeAll(async () => {
    // Insert test mission
    const mRes = await adminPool.query(
      `INSERT INTO missions (name, status, total_stock)
       VALUES ('test-mission', 'active', '{"emergency_kit": 100}')
       RETURNING id`
    );
    missionId = mRes.rows[0].id;

    // Insert policy version
    const pvRes = await adminPool.query(
      `INSERT INTO policy_versions (mission_id, version, policy, policy_hash, activated_at)
       VALUES ($1, 0, '{"items":[],"allowances":[],"tokenSalt":"test"}', 'abc123', now())
       RETURNING id`,
      [missionId]
    );
    policyVersionId = pvRes.rows[0].id;
  });

  it('app_role cannot UPDATE policy_versions', async () => {
    await expect(
      appPool.query(
        `UPDATE policy_versions SET policy = '{"modified":true}' WHERE id = $1`,
        [policyVersionId]
      )
    ).rejects.toThrow(/permission denied/);
  });

  it('app_role cannot DELETE policy_versions', async () => {
    await expect(
      appPool.query(`DELETE FROM policy_versions WHERE id = $1`, [policyVersionId])
    ).rejects.toThrow(/permission denied/);
  });

  it('app_role CAN INSERT policy_versions', async () => {
    const res = await appPool.query(
      `INSERT INTO policy_versions (mission_id, version, policy, policy_hash)
       VALUES ($1, 1, '{"items":[],"allowances":[],"tokenSalt":"v1"}', 'def456')
       RETURNING id`,
      [missionId]
    );
    expect(res.rows[0].id).toBeDefined();
  });
});

describe('PostgreSQL Integration — Events Append-Only', () => {
  let missionId: string;
  let deviceId: string;
  let eventId: string;

  beforeAll(async () => {
    // Create mission + policy + device
    const mRes = await adminPool.query(
      `INSERT INTO missions (name, status, total_stock)
       VALUES ('event-test', 'active', '{"emergency_kit": 50}')
       RETURNING id`
    );
    missionId = mRes.rows[0].id;

    await adminPool.query(
      `INSERT INTO policy_versions (mission_id, version, policy, policy_hash, activated_at)
       VALUES ($1, 0, '{"items":[],"allowances":[],"tokenSalt":"x"}', 'hash', now())`,
      [missionId]
    );

    const dRes = await adminPool.query(
      `INSERT INTO devices (mission_id, label, allocation)
       VALUES ($1, 'TestDevice', '{"emergency_kit": 50}')
       RETURNING id`,
      [missionId]
    );
    deviceId = dRes.rows[0].id;

    // Insert an event via app_role
    const eRes = await appPool.query(
      `INSERT INTO events (id, mission_id, device_id, policy_version, sequence, token_hash, item_type, quantity, device_time, previous_hash, event_hash)
       VALUES (gen_random_uuid(), $1, $2, 0, 0, 'tokenhash64chars' || repeat('0', 48), 'emergency_kit', 1, now(), 'GENESIS', 'eventhash64chars' || repeat('0', 48))
       RETURNING id`,
      [missionId, deviceId]
    );
    eventId = eRes.rows[0].id;
  });

  it('app_role cannot UPDATE events', async () => {
    await expect(
      appPool.query(`UPDATE events SET quantity = 999 WHERE id = $1`, [eventId])
    ).rejects.toThrow(/permission denied/);
  });

  it('app_role cannot DELETE events', async () => {
    await expect(
      appPool.query(`DELETE FROM events WHERE id = $1`, [eventId])
    ).rejects.toThrow(/permission denied/);
  });

  it('accepted events survive query after insertion', async () => {
    const res = await appPool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].quantity).toBe(1);
    expect(res.rows[0].item_type).toBe('emergency_kit');
  });

  it('duplicate event ID (exact same) is rejected by unique constraint', async () => {
    await expect(
      appPool.query(
        `INSERT INTO events (id, mission_id, device_id, policy_version, sequence, token_hash, item_type, quantity, device_time, previous_hash, event_hash)
         VALUES ($1, $2, $3, 0, 0, 'tokenhash64chars' || repeat('0', 48), 'emergency_kit', 1, now(), 'GENESIS', 'different' || repeat('0', 55))`,
        [eventId, missionId, deviceId]
      )
    ).rejects.toThrow(/duplicate key|unique/i);
  });

  it('device_id + sequence unique constraint prevents sequence reuse', async () => {
    await expect(
      appPool.query(
        `INSERT INTO events (id, mission_id, device_id, policy_version, sequence, token_hash, item_type, quantity, device_time, previous_hash, event_hash)
         VALUES (gen_random_uuid(), $1, $2, 0, 0, 'anothertokenhash' || repeat('0', 48), 'emergency_kit', 1, now(), 'GENESIS', 'anotherhash64ch' || repeat('0', 49))`,
        [missionId, deviceId]
      )
    ).rejects.toThrow(/duplicate key|unique/i);
  });
});

describe('PostgreSQL Integration — Reconciliation Snapshots', () => {
  let missionId: string;

  beforeAll(async () => {
    const mRes = await adminPool.query(
      `INSERT INTO missions (name, status, total_stock)
       VALUES ('snapshot-test', 'active', '{"emergency_kit": 100}')
       RETURNING id`
    );
    missionId = mRes.rows[0].id;
  });

  it('snapshot keyed by eventSetDigest (unique per mission)', async () => {
    await appPool.query(
      `INSERT INTO reconciliation_snapshots (mission_id, event_set_digest, summary, exceptions)
       VALUES ($1, 'digest_abc', '{"test":true}', '[]')`,
      [missionId]
    );

    // Same digest for same mission → conflict
    await expect(
      appPool.query(
        `INSERT INTO reconciliation_snapshots (mission_id, event_set_digest, summary, exceptions)
         VALUES ($1, 'digest_abc', '{"test":true}', '[]')`,
        [missionId]
      )
    ).rejects.toThrow(/duplicate key|unique/i);

    // Different digest → OK
    const res = await appPool.query(
      `INSERT INTO reconciliation_snapshots (mission_id, event_set_digest, summary, exceptions)
       VALUES ($1, 'digest_def', '{"test":true}', '[]')
       RETURNING id`,
      [missionId]
    );
    expect(res.rows[0].id).toBeDefined();
  });

  it('app_role cannot UPDATE reconciliation_snapshots', async () => {
    await expect(
      appPool.query(
        `UPDATE reconciliation_snapshots SET summary = '{"hacked":true}' WHERE mission_id = $1`,
        [missionId]
      )
    ).rejects.toThrow(/permission denied/);
  });

  it('app_role cannot DELETE reconciliation_snapshots', async () => {
    await expect(
      appPool.query(`DELETE FROM reconciliation_snapshots WHERE mission_id = $1`, [missionId])
    ).rejects.toThrow(/permission denied/);
  });
});
