import { SEED_42 } from '@/lib/content';

export function FieldOperatorPreview() {
  return (
    <section className="mx-auto max-w-wide px-6 py-28">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Copy */}
        <div className="max-w-prose">
          <p className="eyebrow">Field experience</p>
          <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
            Record handouts
            <br />
            <span className="text-muted">under pressure.</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Large touch targets, offline-first operation, and status language
            that never overstates what the system knows. The operator sees
            exactly what is stored locally and what is still pending sync.
          </p>
          <a
            href="#how-it-works"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-border decoration-2 underline-offset-4 transition-colors hover:decoration-mint"
          >
            See the field workflow
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Device preview */}
        <div className="relative">
          <div className="absolute -top-2.5 right-6 z-10 rounded-full border border-border bg-canvas px-2.5 py-1">
            <span className="mono text-[9px] uppercase tracking-wider text-muted">
              Marketing preview
            </span>
          </div>

          <div className="mx-auto max-w-[340px] rounded-feature border border-border bg-surface p-6">
            {/* Mission header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <p className="text-[13px] font-heading leading-tight">
                  {SEED_42.mission.name}
                </p>
                <p className="mono mt-1 text-[10px] text-muted">
                  Device {SEED_42.devices.alpha.label} ·{' '}
                  {SEED_42.devices.alpha.allocation} kits
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-mint-wash px-2.5 py-1">
                <span className="h-1 w-1 rounded-full bg-mint" />
                <span className="text-[10px] font-medium text-mint-dark">
                  Offline-ready
                </span>
              </div>
            </div>

            {/* Token entry */}
            <div className="mt-5 space-y-3">
              <div>
                <label className="mono text-[10px] uppercase tracking-wider text-muted">
                  Entitlement token
                </label>
                <div className="mt-1.5 rounded-control border border-border bg-canvas px-3.5 py-3">
                  <span className="mono text-sm text-ink">
                    {SEED_42.conflictToken}
                  </span>
                </div>
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-wider text-muted">
                  Quantity
                </label>
                <div className="mt-1.5 rounded-control border border-border bg-canvas px-3.5 py-3">
                  <span className="text-sm text-ink">
                    1 × {SEED_42.mission.itemType}
                  </span>
                </div>
              </div>

              <div className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-evidence text-[13px] font-medium text-white">
                Confirm physical handout
              </div>
            </div>

            {/* Receipt */}
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-mint" />
                <p className="text-[11px] font-medium text-mint-dark">
                  Recorded on this device — pending sync
                </p>
              </div>
              <p className="mono mt-2 text-[10px] text-muted">
                queue: 1 event · seq 001
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
