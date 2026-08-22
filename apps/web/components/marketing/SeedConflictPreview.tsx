import { SEED_42 } from '@/lib/content';

export function SeedConflictPreview() {
  return (
    <section className="section-container pb-20" id="product">
      <div className="bg-evidence rounded-feature-lg p-8 sm:p-12 overflow-hidden">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Device Alpha */}
          <div className="bg-[#151C18] rounded-card p-6 border border-[#2A3530]">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-mint" />
              <span className="text-sm font-medium text-white/80 mono">
                Device {SEED_42.devices.alpha.label}
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/50 mono">seq 0 · HH-040 · qty 1</div>
              <div className="text-xs text-white/50 mono">
                seq 1 · <span className="text-amber">{SEED_42.conflictToken}</span> · qty 1
              </div>
            </div>
            <div className="mt-4 text-xs text-white/40">
              Recorded on this device — pending sync
            </div>
          </div>

          {/* Device Bravo */}
          <div className="bg-[#151C18] rounded-card p-6 border border-[#2A3530]">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-mint" />
              <span className="text-sm font-medium text-white/80 mono">
                Device {SEED_42.devices.bravo.label}
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/50 mono">seq 0 · HH-041 · qty 1</div>
              <div className="text-xs text-white/50 mono">
                seq 1 · <span className="text-amber">{SEED_42.conflictToken}</span> · qty 1
              </div>
            </div>
            <div className="mt-4 text-xs text-white/40">
              Recorded on this device — pending sync
            </div>
          </div>

          {/* Reconciliation Result */}
          <div className="bg-[#151C18] rounded-card p-6 border border-mint/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-mint">Reconciled</span>
            </div>
            <div className="space-y-3 text-xs text-white/70 mono">
              <div>{SEED_42.result.distributed} physical handouts</div>
              <div>{SEED_42.result.remaining} remaining</div>
              <div>{SEED_42.events.uniqueTokens} unique tokens</div>
              <div className="text-amber">
                {SEED_42.result.exceptions} exception · {SEED_42.conflictToken} · {SEED_42.result.exceptionPeerCount} peer events
              </div>
              <div className="text-white/40">No winner selected</div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2A3530]">
              <div className="text-xs text-mint mono">✓ Bundle verified</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
