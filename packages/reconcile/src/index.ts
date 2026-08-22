export { reconcile } from './reconcile.js';
export { computeStock } from './stock.js';
export { canonicalSortEvents, sortedUnique } from './normalize.js';
export {
  detectDuplicateEntitlements,
  detectEventOverspend,
  detectDeviceOverspend,
} from './exceptions.js';
export type {
  ReconciliationInput,
  ReconciliationResult,
  StockSummary,
  ExceptionRecord,
  ExceptionType,
} from './types.js';
