import { SEED_42 } from '@/lib/content';

export function ProductJourney() {
  return (
    <section className="relative mx-auto max-w-wide overflow-hidden px-6 py-28" aria-labelledby="product-journey-title">
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 select-none whitespace-nowrap font-heading text-[6rem] leading-none text-ink/[0.035] sm:text-[12rem]" aria-hidden="true">FIELD</div>
      <div className="relative mx-auto max-w-narrow text-center">
        <p className="text-xl text-mint" style={{ fontFamily: 'var(--font-caveat), cursive' }}>( One continuous evidence journey )</p>
        <h2 id="product-journey-title" className="mt-5 text-4xl font-heading tracking-tight sm:text-6xl sm:leading-[1.03]">Simple in the field. <span className="text-muted">Explicit after sync.</span></h2>
        <p className="mx-auto mt-7 max-w-prose text-base leading-relaxed text-muted">Operators record what physically happened. Coordinators see the resulting stock position and every exception—without either view pretending to know more than the evidence supports.</p>
      </div>

      <div className="relative mt-16 overflow-hidden rounded-feature-lg bg-gradient-to-br from-mint to-mint-dark p-5 shadow-2xl shadow-mint-dark/15 sm:p-10 lg:p-12">
        <div className="mb-6 flex items-center justify-between">
          <span className="mono text-[9px] uppercase tracking-[0.18em] text-white/70">Marketing preview</span>
          <span className="flex items-center gap-2 text-[10px] text-white/75"><span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,.7)]" />seed-42</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_auto_1.2fr] lg:items-center">
          <div className="rounded-[26px] border border-white/30 bg-surface p-6 shadow-2xl shadow-black/25">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div><p className="text-[13px] font-heading">Device {SEED_42.devices.alpha.label}</p><p className="mono mt-1 text-[9px] text-muted">{SEED_42.devices.alpha.allocation} kits allocated</p></div>
              <span className="rounded-full bg-mint-wash px-2.5 py-1 text-[9px] font-medium text-mint-dark">Offline-ready</span>
            </div>
            <div className="mt-5 space-y-3">
              <div><p className="mono text-[9px] uppercase tracking-wider text-muted">Entitlement</p><div className="mt-1.5 rounded-control border border-border bg-canvas px-3.5 py-3"><span className="mono text-sm text-ink">{SEED_42.conflictToken}</span></div></div>
              <div><p className="mono text-[9px] uppercase tracking-wider text-muted">Quantity</p><div className="mt-1.5 rounded-control border border-border bg-canvas px-3.5 py-3 text-sm">1 × {SEED_42.mission.itemType}</div></div>
              <div className="flex min-h-12 items-center justify-center rounded-full bg-evidence text-[12px] font-medium text-white">Confirm physical handout</div>
            </div>
            <p className="mt-5 border-t border-border pt-4 text-[10px] font-medium text-mint-dark">● Recorded locally — pending sync</p>
          </div>

          <div className="hidden flex-col items-center gap-2 lg:flex" aria-hidden="true"><span className="h-px w-12 bg-white/40" /><span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/10 text-white">→</span><span className="h-px w-12 bg-white/40" /></div>

          <div className="rounded-feature border border-white/15 bg-evidence p-6 text-white shadow-2xl shadow-black/25 sm:p-8">
            <div className="mb-6 flex items-center justify-between"><p className="text-[13px] font-heading">Coordinator evidence</p><span className="mono text-[9px] text-white/35">after sync</span></div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { value: SEED_42.result.distributed, label: 'handed out' },
                { value: SEED_42.result.remaining, label: 'remaining' },
                { value: SEED_42.result.exceptions, label: 'exception', accent: true },
              ].map((item) => <div key={item.label} className="rounded-control border border-white/10 bg-white/[0.04] px-2 py-4 text-center"><p className={`font-heading text-2xl ${item.accent ? 'text-amber' : 'text-white'}`}>{item.value}</p><p className="mono mt-2 text-[8px] uppercase tracking-wider text-white/35">{item.label}</p></div>)}
            </div>
            <div className="mt-4 rounded-control border border-amber/25 bg-amber/[0.08] p-4"><div className="flex items-center justify-between gap-3"><span className="mono text-[9px] text-amber">duplicate_entitlement</span><span className="mono text-[9px] text-white/30">unresolved</span></div><p className="mono mt-2 text-[11px] text-white/80">{SEED_42.conflictToken} · {SEED_42.result.exceptionPeerCount} peer events</p><p className="mt-2 text-[10px] text-white/35">No winner selected. Both records remain inspectable.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
