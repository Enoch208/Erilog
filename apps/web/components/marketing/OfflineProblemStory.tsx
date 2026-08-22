import { SEED_42 } from '@/lib/content';

function DeviceCard({
  letter,
  label,
  location,
  tokens,
  note,
}: {
  letter: string;
  label: string;
  location: string;
  tokens: { code: string; conflict?: boolean }[];
  note: string;
}) {
  return (
    <div className="rounded-card-lg border border-border bg-surface p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-canvas">
          <span className="mono text-xs font-medium text-ink">{letter}</span>
        </div>
        <div>
          <p className="text-sm font-heading leading-tight">{label}</p>
          <p className="text-xs text-muted">{location}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {tokens.map((t) => (
          <div
            key={t.code}
            className="flex items-center justify-between rounded-control border border-border bg-canvas px-3 py-2.5"
          >
            <span
              className={`mono text-xs ${t.conflict ? 'text-amber' : 'text-muted'}`}
            >
              {t.code}
            </span>
            <span className="text-[10px] font-medium text-mint-dark">
              Recorded
            </span>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted">{note}</p>
    </div>
  );
}

export function OfflineProblemStory() {
  return (
    <section className="mx-auto max-w-wide px-6 py-28" id="how-it-works">
      <div className="mx-auto max-w-narrow text-center">
        <p className="eyebrow">The real problem</p>
        <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
          Offline work creates more
          <br />
          <span className="text-muted">than a sync problem.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-prose text-base leading-relaxed text-muted sm:text-lg">
          Two operators serve the same entitlement while disconnected. Neither
          device knows about the other. Both records describe a physical event
          that already happened.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-content gap-5 md:grid-cols-2">
        <DeviceCard
          letter="A"
          label={`Device ${SEED_42.devices.alpha.label}`}
          location="Distribution point east"
          tokens={[{ code: 'HH-040' }, { code: SEED_42.conflictToken, conflict: true }]}
          note="No network. Cannot know what Bravo recorded."
        />
        <DeviceCard
          letter="B"
          label={`Device ${SEED_42.devices.bravo.label}`}
          location="Distribution point west"
          tokens={[{ code: 'HH-041' }, { code: SEED_42.conflictToken, conflict: true }]}
          note="No network. Cannot know what Alpha recorded."
        />
      </div>

      {/* Resolution statement */}
      <div className="mx-auto mt-12 max-w-prose">
        <div className="rounded-card border-l-2 border-mint bg-mint-wash/40 px-6 py-5">
          <p className="text-sm leading-relaxed text-ink">
            Erilog preserves both events and raises an explicit exception.
            Neither event is deleted. Neither is marked as{' '}
            <span className="italic">the duplicate</span>.
          </p>
        </div>
      </div>
    </section>
  );
}
