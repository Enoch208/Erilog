/**
 * Browser-safe entry point.
 *
 * Identical reconciliation logic to the package root, minus the Node-only
 * ZIP writer (`archive.ts`), which imports `node:fs`/`node:stream` and
 * `archiver`. Importing this module keeps bundlers free of Node built-ins,
 * so the browser verifier can run the same deterministic reconciliation
 * the server and headless proof run.
 */

export { reconcile } from './reconcile.js';
export { computeStock } from './stock.js';
export { canonicalSortEvents, sortedUnique } from './normalize.js';
export {
  detectDuplicateEntitlements,
  detectEventOverspend,
  detectDeviceOverspend,
} from './exceptions.js';
export {
  processSync,
  createSyncEngineState,
} from './sync-engine.js';
export { generateBundle } from './bundle.js';
export type {
  ReconciliationInput,
  ReconciliationResult,
  StockSummary,
  ExceptionRecord,
  ExceptionType,
} from './types.js';
export type {
  SyncResultItem,
  MissionState,
  SyncEngineState,
} from './sync-engine.js';
export type { BundleInput, BundleOutput } from './bundle.js';
