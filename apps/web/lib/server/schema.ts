import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  unique,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Missions
export const missions = pgTable('missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  totalStock: jsonb('total_stock').notNull().$type<Record<string, number>>(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('status_check', sql`${table.status} IN ('draft', 'active', 'closed')`),
]);

// 2. Policy Versions (immutable after activation)
export const policyVersions = pgTable('policy_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  missionId: uuid('mission_id').notNull().references(() => missions.id),
  version: integer('version').notNull(),
  policy: jsonb('policy').notNull().$type<{
    items: { type: string; unit: string }[];
    allowances: { itemType: string; maxPerEntitlement: number }[];
    tokenSalt: string;
  }>(),
  policyHash: text('policy_hash').notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('policy_versions_mission_version').on(table.missionId, table.version),
]);

// 3. Devices
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  missionId: uuid('mission_id').notNull().references(() => missions.id),
  label: text('label').notNull(),
  allocation: jsonb('allocation').notNull().$type<Record<string, number>>(),
  packageHash: text('package_hash'),
  provisionedAt: timestamp('provisioned_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('devices_mission_label').on(table.missionId, table.label),
]);

// 4. Events (append-only)
export const events = pgTable('events', {
  id: uuid('id').primaryKey(),
  missionId: uuid('mission_id').notNull().references(() => missions.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  policyVersion: integer('policy_version').notNull(),
  sequence: integer('sequence').notNull(),
  tokenHash: text('token_hash').notNull(),
  itemType: text('item_type').notNull(),
  quantity: integer('quantity').notNull(),
  deviceTime: timestamp('device_time', { withTimezone: true }).notNull(),
  previousHash: text('previous_hash').notNull(),
  eventHash: text('event_hash').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('events_device_sequence').on(table.deviceId, table.sequence),
  foreignKey({
    columns: [table.missionId, table.policyVersion],
    foreignColumns: [policyVersions.missionId, policyVersions.version],
  }),
  check('sequence_check', sql`${table.sequence} >= 0`),
  check('quantity_check', sql`${table.quantity} > 0`),
]);

// 5. Reconciliation Snapshots (immutable projections)
export const reconciliationSnapshots = pgTable('reconciliation_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  missionId: uuid('mission_id').notNull().references(() => missions.id),
  eventSetDigest: text('event_set_digest').notNull(),
  summary: jsonb('summary').notNull(),
  exceptions: jsonb('exceptions').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('snapshots_mission_digest').on(table.missionId, table.eventSetDigest),
]);

// 6. Resolutions (P1, append-only)
export const resolutions = pgTable('resolutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  missionId: uuid('mission_id').notNull().references(() => missions.id),
  exceptionId: text('exception_id').notNull(),
  snapshotId: uuid('snapshot_id').notNull().references(() => reconciliationSnapshots.id),
  actor: text('actor').notNull(),
  disposition: text('disposition').notNull(),
  reason: text('reason').notNull(),
  sourceEventIds: text('source_event_ids').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('disposition_check', sql`${table.disposition} IN ('explained', 'authorized', 'investigate')`),
]);

// 7. Judge Sessions
export const judgeSessions = pgTable('judge_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  missionId: uuid('mission_id').references(() => missions.id),
  seed: integer('seed').notNull().default(42),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
