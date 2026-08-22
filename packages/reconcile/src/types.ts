import type { HandoutEvent, MissionPolicy, DeviceAllocation } from '@erilog/schemas';

export interface ReconciliationInput {
  policy: MissionPolicy;
  events: HandoutEvent[];
  devices: DeviceAllocation[];
  initialStock: Record<string, number>;
}

export interface ReconciliationResult {
  summary: StockSummary;
  exceptions: ExceptionRecord[];
  eventSetDigest: string;
}

export interface StockSummary {
  missionId: string;
  initialStock: Record<string, number>;
  distributed: Record<string, number>;
  remaining: Record<string, number>;
  uniqueTokensServed: number;
  totalPhysicalHandouts: number;
}

export type ExceptionType =
  | 'duplicate_entitlement'
  | 'device_overspend'
  | 'event_overspend'
  | 'chain_fork';

export interface ExceptionRecord {
  id: string;
  type: ExceptionType;
  tokenHash?: string;
  eventIds: string[];
  deviceIds: string[];
  quantities: number[];
  timestamps: string[];
  status: 'unresolved';
}
