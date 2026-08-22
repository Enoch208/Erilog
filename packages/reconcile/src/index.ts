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
