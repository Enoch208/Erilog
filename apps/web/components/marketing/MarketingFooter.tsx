import { ROUTES } from '@/lib/content';

const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Integrity', href: '#integrity' },
      { label: 'Verifier', href: '#verifier' },
    ],
  },
  {
    title: 'Resources',
    links: [
      {
        label: 'Documentation',
        href: `${ROUTES.github}/blob/main/README.md`,
        external: true,
      },
      { label: 'GitHub', href: ROUTES.github, external: true },
      { label: 'Built with Kiro', href: '#kiro' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-wide px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-[17px] font-heading tracking-tight">Erilog</p>
            <p className="mt-2 max-w-[36ch] text-xs leading-relaxed text-muted">
              Offline-first evidence reconciliation for small distribution
              teams.
            </p>
            <p className="mt-6 text-[11px] text-muted">
              Ready, Spec, Ship Hackathon · August 2026
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-muted transition-colors hover:text-ink"
                      {...('external' in link && link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Cropped wordmark */}
      <div className="overflow-hidden border-t border-border">
        <div className="mx-auto max-w-wide px-6">
          <p
            className="select-none font-heading leading-[0.8] tracking-[-0.04em] text-border"
            style={{ fontSize: 'clamp(4rem, 15vw, 11rem)', marginBottom: '-0.18em' }}
            aria-hidden="true"
          >
            ERILOG
          </p>
        </div>
      </div>
    </footer>
  );
}
