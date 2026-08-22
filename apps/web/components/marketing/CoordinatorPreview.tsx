import Link from 'next/link';
import { SEED_42, ROUTES } from '@/lib/content';

export function CoordinatorPreview() {
  return (
    <section className="bg-surface border-y border-border py-24 sm:py-32">
      <div className="section-container grid lg:grid-cols-2 gap-12 items-center">
        {/* Marketing preview — clearly labelled */}
        <div className="relative order-2 lg:order-1">
          <div className="absolute -top-3 left-4 text-[10px] font-medium text-muted bg-surface px-2 py-0.5 rounded border border-border z-10">
            Marketing preview
          </div>
          <div className="rounded-card-lg border border-border bg-canvas p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-heading">Mission Summary</span>
              <span className="text-xs text-muted mono">seed-42</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 rounded-control bg-surface border border-border">
                <div className="text-2xl font-heading">{SEED_42.result.distributed}</div>
                <div className="text-[10px] text-muted">distributed</div>
              </div>
              <div className="text-center p-3 rounded-control bg-surface border border-border">
                <div className="text-2xl font-heading">{SEED_42.result.remaining}</div>
                <div className="text-[10px] text-muted">remaining</div>
              </div>
              <div className="text-center p-3 rounded-control bg-surface border border-border">
                <div className="text-2xl font-heading text-amber">{SEED_42.result.exceptions}</div>
                <div className="text-[10px] text-muted">exception</div>
              </div>
            </div>

            <div className="rounded-control border border-amber/30 bg-[#FFF8F0] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-amber">Duplicate entitlement</span>
              </div>
              <div className="text-xs text-muted mono">
                {SEED_42.conflictToken} · 2 peer events · unresolved
              </div>
              <div className="text-[10px] text-muted mt-1">
                No winner selected — both events preserved
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-4">
            Coordination
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-6">
            See what happened. Not what you hoped.
          </h2>
          <p className="text-muted leading-relaxed mb-6">
            Physical stock accounting, device synchronization status,
            explicit exceptions, and exportable evidence.
            Every number traces back to immutable events.
          </p>
          <Link href={ROUTES.judge} className="btn-primary text-sm">
            Open Judge Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
