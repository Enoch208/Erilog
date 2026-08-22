import { ROUTES } from '@/lib/content';

const FOOTER_LINKS = {
  Product: [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Integrity', href: '#integrity' },
    { label: 'Verifier', href: '#verifier' },
  ],
  Resources: [
    { label: 'Documentation', href: ROUTES.github + '/blob/main/README.md' },
    { label: 'GitHub', href: ROUTES.github },
    { label: 'Built with Kiro', href: '#kiro' },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="section-container py-16">
        <div className="grid sm:grid-cols-3 gap-12">
          <div>
            <p className="text-lg font-heading mb-2">Erilog</p>
            <p className="text-xs text-muted">
              Offline-first evidence reconciliation.
            </p>
            <p className="text-xs text-muted mt-4">
              Built for the Ready, Spec, Ship Hackathon · August 2026
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-4">
                {group}
              </p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted hover:text-ink transition-colors"
                      {...(link.href.startsWith('http')
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

      {/* Wordmark ending */}
      <div className="border-t border-border py-8 overflow-hidden">
        <div className="section-container">
          <p className="text-[clamp(3rem,10vw,6rem)] font-heading text-border/50 tracking-tighter leading-none select-none">
            ERILOG
          </p>
        </div>
      </div>
    </footer>
  );
}
