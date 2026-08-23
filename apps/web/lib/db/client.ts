import Dexie, { type Table } from 'dexie';

export interface LocalEvent {
  id: string;
  missionId: string;
  deviceId: string;
  policyVersion: number;
  sequence: number;
  tokenHash: string;
  itemType: string;
  quantity: number;
  deviceTime: string;
  previousHash: string;
  eventHash: string;
  syncStatus: 'pending' | 'synced' | 'quarantined';
  quarantineReason?: string;
  createdAt: string;
}

export interface LocalMission {
  id: string;
  name: string;
  status: string;
  totalStock: Record<string, number>;
  policy: {
    items: { type: string; unit: string }[];
    allowances: { itemType: string; maxPerEntitlement: number }[];
    tokenSalt: string;
  };
  policyVersion: number;
  devices: { id: string; label: string; allocation: Record<string, number> }[];
}

export interface LocalMeta {
  key: string;
  value: string;
}

class ErilogDB extends Dexie {
  events!: Table<LocalEvent, string>;
  missions!: Table<LocalMission, string>;
  meta!: Table<LocalMeta, string>;

  constructor() {
    super('erilog');
    this.version(1).stores({
      events: 'id, missionId, deviceId, sequence, tokenHash, syncStatus, [deviceId+sequence]',
      missions: 'id',
      meta: 'key',
    });
  }
}

export const localDb = new ErilogDB();
