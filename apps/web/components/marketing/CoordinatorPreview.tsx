import Link from 'next/link';
import { SEED_42, ROUTES } from '@/lib/content';

export function CoordinatorPreview() {
  return (
    <section className="border-y border-border bg-surface py-28">
      <div className="mx-auto grid max-w-wide items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
        {/* Dashboard preview */}
        <div className="relative order-2 lg:order-1">
          <div className="absolute -top-2.5 left-6 z-10 rounded-full border border-border bg-surface px-2.5 py-1">
            <span className="mono text-[9px] uppercase tracking-wider text-muted">
              Marketing preview
            </span>
          </div>

          <div className="rounded-feature border border-border bg-canvas p-7">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-[13px] font-heading">Mission summary</p>
              <span className="mono text-[10px] text-muted">seed-42</span>
            </div>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                { v: SEED_42.result.distributed, l: 'handed out' },
                { v: SEED_42.result.remaining, l: 'remaining' },
                {
                  v: SEED_42.result.exceptions,
                  l: 'exception',
                  accent: true,
                },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-control border border-border bg-surface px-3 py-4 text-center"
                >
                  <div
                    className={`font-heading text-[26px] leading-none tabular-nums ${
                      s.accent ? 'text-amber' : 'text-ink'
                    }`}
                  >
                    {s.v}
                  </div>
                  <div className="mono mt-2 text-[9px] uppercase tracking-wider text-muted">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Device sync rows */}
            <div className="mb-5 space-y-1.5">
              {[SEED_42.devices.alpha, SEED_42.devices.bravo].map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between rounded-control border border-border bg-surface px-3.5 py-2.5"
                >
                  <span className="mono text-[11px] text-muted">
                    Device {d.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-mint" />
                    <span className="text-[10px] font-medium text-mint-dark">
                      2 events synced
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* Exception */}
            <div className="rounded-control border-l-2 border-amber bg-amber/[0.06] px-4 py-3.5">
              <p className="mono text-[10px] uppercase tracking-wider text-amber">
                duplicate_entitlement
              </p>
              <p className="mono mt-1.5 text-[11px] text-ink">
                {SEED_42.conflictToken} ·{' '}
                {SEED_42.result.exceptionPeerCount} peer events · unresolved
              </p>
              <p className="mt-2 text-[10px] text-muted">
                No winner selected — both events preserved
              </p>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 max-w-prose lg:order-2">
          <p className="eyebrow">Coordination</p>
          <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
            See what happened.
            <br />
            <span className="text-muted">Not what you hoped.</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Physical stock accounting, device synchronization status, explicit
            exceptions, and exportable evidence. Every number traces back to
            immutable events.
          </p>
          <Link href={ROUTES.judge} className="btn-primary mt-8">
            Open Judge Dashboard
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
