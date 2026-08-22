import { SEED_42 } from '@/lib/content';

function EventRow({
  seq,
  token,
  qty,
  conflict = false,
}: {
  seq: number;
  token: string;
  qty: number;
  conflict?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-2.5 last:border-0">
      <div className="flex items-center gap-3">
        <span className="mono text-[10px] tabular-nums text-white/30">
          {String(seq).padStart(2, '0')}
        </span>
        <span
          className={`mono text-xs ${conflict ? 'text-amber' : 'text-white/70'}`}
        >
          {token}
        </span>
      </div>
      <span className="mono text-[10px] text-white/40">×{qty}</span>
    </div>
  );
}

export function SeedConflictPreview() {
  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-24" id="product">
      <div
        className="relative overflow-hidden rounded-feature-lg px-6 py-10 sm:px-12 sm:py-14"
        style={{
          background:
            'radial-gradient(at 50% 120%, #16241D 0%, #0F1713 45%, #0A0F0C 100%)',
        }}
      >
        {/* Caption */}
        <div className="mb-10 text-center">
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            Seed 42 · deterministic scenario
          </p>
          <h2 className="mt-3 text-xl font-heading text-white/95 sm:text-2xl">
            Two devices. One entitlement. Nothing hidden.
          </h2>
        </div>

        {/* Evidence grid */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.15fr]">
          {/* Device Alpha */}
          <div className="rounded-card border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                <span className="text-xs font-medium text-white/80">
                  Device {SEED_42.devices.alpha.label}
                </span>
              </div>
              <span className="mono text-[10px] text-white/25">
                {SEED_42.devices.alpha.allocation} kits
              </span>
            </div>
            <div>
              <EventRow seq={0} token="HH-040" qty={1} />
              <EventRow
                seq={1}
                token={SEED_42.conflictToken}
                qty={1}
                conflict
              />
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-white/35">
              Recorded offline. Cannot see Bravo.
            </p>
          </div>

          {/* Device Bravo */}
          <div className="rounded-card border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                <span className="text-xs font-medium text-white/80">
                  Device {SEED_42.devices.bravo.label}
                </span>
              </div>
              <span className="mono text-[10px] text-white/25">
                {SEED_42.devices.bravo.allocation} kits
              </span>
            </div>
            <div>
              <EventRow seq={0} token="HH-041" qty={1} />
              <EventRow
                seq={1}
                token={SEED_42.conflictToken}
                qty={1}
                conflict
              />
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-white/35">
              Recorded offline. Cannot see Alpha.
            </p>
          </div>

          {/* Reconciled result */}
          <div className="rounded-card border border-mint/25 bg-mint/[0.04] p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs font-medium text-mint">
                After synchronization
              </span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { v: SEED_42.result.distributed, l: 'handed out' },
                { v: SEED_42.result.remaining, l: 'remaining' },
                { v: SEED_42.result.exceptions, l: 'exception', amber: true },
              ].map((stat) => (
                <div key={stat.l}>
                  <div
                    className={`font-heading text-2xl tabular-nums ${
                      stat.amber ? 'text-amber' : 'text-white/90'
                    }`}
                  >
                    {stat.v}
                  </div>
                  <div className="mono text-[9px] uppercase tracking-wider text-white/30">
                    {stat.l}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-control border border-amber/25 bg-amber/[0.06] p-3">
              <div className="mono text-[10px] text-amber">
                duplicate_entitlement
              </div>
              <div className="mono mt-1 text-[10px] text-white/45">
                {SEED_42.conflictToken} · {SEED_42.result.exceptionPeerCount}{' '}
                peer events
              </div>
              <div className="mt-2 text-[10px] text-white/35">
                Both preserved. No winner selected.
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
              <span className="text-mint" aria-hidden="true">
                ✓
              </span>
              <span className="mono text-[10px] text-mint/90">
                Signed bundle verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
