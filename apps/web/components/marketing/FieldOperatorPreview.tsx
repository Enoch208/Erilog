import { SEED_42 } from '@/lib/content';

export function FieldOperatorPreview() {
  return (
    <section className="section-container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-4">
            Field experience
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-6">
            Record handouts under pressure.
          </h2>
          <p className="text-muted leading-relaxed mb-6">
            Large touch targets, offline-first operation, and clear status language.
            The operator knows exactly what has been recorded locally and what
            is still pending sync.
          </p>
          <a href="#how-it-works" className="btn-secondary text-sm">
            See the field workflow
          </a>
        </div>

        {/* Marketing preview — clearly labelled */}
        <div className="relative">
          <div className="absolute -top-3 right-4 text-[10px] font-medium text-muted bg-canvas px-2 py-0.5 rounded border border-border z-10">
            Marketing preview
          </div>
          <div className="rounded-card-lg border border-border bg-surface p-6 max-w-[320px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted mono">
                {SEED_42.mission.name}
              </span>
              <span className="text-xs font-medium text-mint-dark bg-mint-wash px-2 py-0.5 rounded-control">
                Offline-ready
              </span>
            </div>
            <div className="text-xs text-muted mb-1">Device Alpha · {SEED_42.devices.alpha.allocation} kits</div>

            <div className="mt-4 space-y-3">
              <div className="border border-border rounded-control p-3">
                <div className="text-xs text-muted mb-1">Entitlement token</div>
                <div className="mono text-sm">{SEED_42.conflictToken}</div>
              </div>
              <div className="border border-border rounded-control p-3">
                <div className="text-xs text-muted mb-1">Quantity</div>
                <div className="text-sm">1 × {SEED_42.mission.itemType}</div>
              </div>
              <button className="w-full btn-primary text-xs py-3" disabled>
                Confirm physical handout
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-xs text-mint-dark">
                Recorded on this device — pending sync
              </div>
              <div className="text-[10px] text-muted mt-1 mono">
                1 event queued
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
