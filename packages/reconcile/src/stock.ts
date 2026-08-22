import type { HandoutEvent } from '@erilog/schemas';
import type { StockSummary } from './types.js';

/**
 * Compute physical stock summary from the accepted event set.
 *
 * Every unique accepted handout counts toward stock — regardless of whether
 * those handouts later participate in an exception. Physical stock reflects
 * what physically left the table, not what was "legitimately" redeemed.
 */
export function computeStock(
  missionId: string,
  events: HandoutEvent[],
  initialStock: Record<string, number>
): StockSummary {
  const distributed: Record<string, number> = {};

  for (const event of events) {
    distributed[event.itemType] = (distributed[event.itemType] ?? 0) + event.quantity;
  }

  const remaining: Record<string, number> = {};
  for (const [itemType, initial] of Object.entries(initialStock)) {
    remaining[itemType] = initial - (distributed[itemType] ?? 0);
  }

  // Count unique token hashes served
  const uniqueTokens = new Set(events.map((e) => e.tokenHash));

  return {
    missionId,
    initialStock: { ...initialStock },
    distributed,
    remaining,
    uniqueTokensServed: uniqueTokens.size,
    totalPhysicalHandouts: events.length,
  };
}
