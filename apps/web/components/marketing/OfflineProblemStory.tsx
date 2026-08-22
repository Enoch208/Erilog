import { SEED_42 } from '@/lib/content';

export function OfflineProblemStory() {
  return (
    <section className="section-container py-24 sm:py-32" id="how-it-works">
      <div className="max-w-[720px] mx-auto text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-6">
          Offline work creates more than a sync problem.
        </h2>
        <p className="text-muted text-lg leading-relaxed">
          Two operators serve the same entitlement while disconnected.
          Neither device knows about the other. Both records describe a physical
          event that already happened.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
        {/* Alpha side */}
        <div className="rounded-card-lg border border-border bg-surface p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-mint-wash flex items-center justify-center">
              <span className="text-xs font-heading text-mint-dark">A</span>
            </div>
            <div>
              <p className="text-sm font-heading">Device {SEED_42.devices.alpha.label}</p>
              <p className="text-xs text-muted">Distribution point east</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-control bg-canvas text-xs">
              <span className="mono text-muted">{SEED_42.conflictToken}</span>
              <span className="text-mint-dark font-medium">Confirmed</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-4">
            Records physical handout. No network. Cannot know what Bravo recorded.
          </p>
        </div>

        {/* Bravo side */}
        <div className="rounded-card-lg border border-border bg-surface p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-mint-wash flex items-center justify-center">
              <span className="text-xs font-heading text-mint-dark">B</span>
            </div>
            <div>
              <p className="text-sm font-heading">Device {SEED_42.devices.bravo.label}</p>
              <p className="text-xs text-muted">Distribution point west</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-control bg-canvas text-xs">
              <span className="mono text-muted">{SEED_42.conflictToken}</span>
              <span className="text-mint-dark font-medium">Confirmed</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-4">
            Also records physical handout. Same token. Both are real events.
          </p>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto mt-10 text-center">
        <p className="text-sm text-muted">
          Erilog preserves both events and raises an explicit exception.
          Neither event is deleted. Neither is marked as &quot;the duplicate.&quot;
        </p>
      </div>
    </section>
  );
}
