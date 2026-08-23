import { SEED_42 } from '@/lib/content';

function DeviceCard({
  letter,
  label,
  location,
  tokens,
  note,
  rotate,
}: {
  letter: string;
  label: string;
  location: string;
  tokens: { code: string; conflict?: boolean }[];
  note: string;
  rotate: string;
}) {
  return (
    <div className={`relative rounded-feature border border-border bg-surface p-7 shadow-xl shadow-ink/5 transition-transform duration-500 hover:-translate-y-1 ${rotate}`}>
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-evidence text-white">
            <span className="mono text-xs font-medium">{letter}</span>
          </div>
          <div>
            <p className="text-sm font-heading leading-tight">{label}</p>
            <p className="mt-0.5 text-xs text-muted">{location}</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-mint-wash px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-mint-dark"><span className="h-1 w-1 rounded-full bg-mint" />Offline</span>
      </div>

      <div className="space-y-2">
        {tokens.map((token) => (
          <div key={token.code} className={`flex items-center justify-between rounded-control border px-3.5 py-3 ${token.conflict ? 'border-amber/30 bg-amber/[0.06]' : 'border-border bg-canvas'}`}>
            <span className={`mono text-xs ${token.conflict ? 'text-amber-strong' : 'text-muted'}`}>{token.code}</span>
            <span className="text-[10px] font-medium text-mint-dark">Recorded</span>
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted">{note}</p>
    </div>
  );
}

export function OfflineProblemStory() {
  return (
    <section className="relative overflow-hidden px-6 py-28 sm:py-36" id="problem">
      <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 select-none whitespace-nowrap font-heading text-[6rem] text-ink/[0.035] sm:text-[12rem] lg:text-[16rem]" aria-hidden="true">Conflict</div>
      <div className="relative mx-auto max-w-wide">
        <div className="mx-auto max-w-narrow text-center">
          <p className="text-xl text-mint-dark" style={{ fontFamily: 'var(--font-caveat), cursive' }}>( the real problem )</p>
          <h2 className="mt-6 text-4xl font-heading leading-[1.08] tracking-tight sm:text-6xl">
            Two honest devices can produce <span className="text-muted">one uncomfortable truth.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-prose text-base leading-relaxed text-muted sm:text-lg">
            Two operators serve the same entitlement while disconnected. Neither device knows about the other. Both records describe a physical event that already happened.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-content">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <DeviceCard letter="A" label={`Device ${SEED_42.devices.alpha.label}`} location="Distribution point east" tokens={[{ code: 'HH-040' }, { code: SEED_42.conflictToken, conflict: true }]} note="No network. Cannot know what Bravo recorded." rotate="md:-rotate-1" />
            <DeviceCard letter="B" label={`Device ${SEED_42.devices.bravo.label}`} location="Distribution point west" tokens={[{ code: 'HH-041' }, { code: SEED_42.conflictToken, conflict: true }]} note="No network. Cannot know what Alpha recorded." rotate="md:rotate-1" />
          </div>
          <div className="relative mx-auto -mt-2 flex w-fit items-center gap-2 rounded-full border border-amber/25 bg-[#fffaf0] px-4 py-2.5 shadow-lg shadow-amber/10 md:-mt-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            <span className="mono text-[10px] text-amber-strong">{SEED_42.conflictToken} appears in both histories</span>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-prose border-l-2 border-mint pl-6">
          <p className="text-base leading-relaxed text-ink">Erilog preserves both events and raises an explicit exception. Neither event is deleted. Neither is marked as <span className="italic">the duplicate</span>.</p>
        </div>
      </div>
    </section>
  );
}
