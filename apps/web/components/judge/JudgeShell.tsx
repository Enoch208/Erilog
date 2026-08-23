import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type JudgePage = 'overview' | 'coordinator' | 'alpha' | 'bravo';

interface JudgeShellProps {
  sessionId: string;
  activePage: JudgePage;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

const deviceIds = {
  alpha: 'a1b2c3d4-0000-4000-8000-aaa000000001',
  bravo: 'a1b2c3d4-0000-4000-8000-bbb000000002',
} as const;

export function JudgeShell({
  sessionId,
  activePage,
  title,
  description,
  actions,
  children,
}: JudgeShellProps) {
  const navigation = [
    { key: 'overview' as const, label: 'Overview', href: `/judge/${sessionId}` },
    { key: 'coordinator' as const, label: 'Coordinator', href: `/judge/${sessionId}/coordinator` },
    { key: 'alpha' as const, label: 'Device Alpha', href: `/judge/${sessionId}/operator/${deviceIds.alpha}` },
    { key: 'bravo' as const, label: 'Device Bravo', href: `/judge/${sessionId}/operator/${deviceIds.bravo}` },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-6">
          <Link
            href="/"
            className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-4"
            aria-label="Erilog home"
          >
            <Image src="/logo.png" alt="Erilog" width={595} height={133} priority className="h-7 w-auto" />
          </Link>
          <p className="mono mt-3 text-[9px] uppercase tracking-[0.18em] text-muted">Evidence control plane</p>
        </div>

        <div className="flex-1 px-3 py-5">
          <p className="mono px-3 text-[9px] uppercase tracking-[0.18em] text-muted">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Judge mode navigation">
            {navigation.map((item) => {
              const active = activePage === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-10 items-center justify-between rounded-control px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
                    active
                      ? 'border border-mint/20 bg-mint-wash font-medium text-mint-dark'
                      : 'border border-transparent text-muted hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="m-3 border-t border-border px-3 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-mint/20 bg-mint-wash mono text-[10px] font-medium text-mint-dark">42</span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-ink">Seed scenario</p>
              <p className="truncate text-[10px] text-muted">Emergency Distribution Alpha</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[10px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" />
            Mission package loaded
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="border-b border-border bg-surface lg:hidden">
          <div className="flex h-16 items-center justify-between px-5">
            <Link href="/" aria-label="Erilog home">
              <Image src="/logo.png" alt="Erilog" width={595} height={133} priority className="h-7 w-auto" />
            </Link>
            <span className="mono text-[9px] uppercase tracking-[0.16em] text-muted">Judge mode</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2" aria-label="Judge mode navigation">
            {navigation.map((item) => {
              const active = activePage === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 rounded-control px-3 py-2 text-[12px] ${active ? 'bg-mint-wash font-medium text-mint-dark' : 'text-muted'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9 xl:px-12">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mono text-[9px] uppercase tracking-[0.18em] text-mint-dark">Emergency Distribution Alpha</p>
                <h1 className="mt-2 text-2xl font-heading tracking-tight sm:text-3xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p>
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>

            <div className="pt-7">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  detail: string;
  tone?: 'default' | 'positive' | 'warning';
  code?: boolean;
}

export function MetricCard({ label, value, detail, tone = 'default', code = false }: MetricCardProps) {
  const valueColor = tone === 'positive' ? 'text-mint-dark' : tone === 'warning' ? 'text-amber' : 'text-ink';

  return (
    <article className="min-w-0 rounded-control border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(13,19,16,0.035)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted">{label}</p>
        <span className={`h-2 w-2 rounded-full ${tone === 'positive' ? 'bg-mint' : tone === 'warning' ? 'bg-amber' : 'bg-border'}`} aria-hidden="true" />
      </div>
      <p className={`mt-5 truncate text-3xl font-heading tracking-tight ${valueColor} ${code ? 'mono text-2xl' : ''}`}>{value}</p>
      <p className="mt-2 text-[11px] text-muted">{detail}</p>
    </article>
  );
}

interface PanelProps {
  eyebrow: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ eyebrow, title, description, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-control border border-border bg-surface shadow-[0_8px_24px_rgba(13,19,16,0.03)] ${className}`}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="mono text-[9px] uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
        {title && <h2 className="mt-2 text-[15px] font-heading text-ink">{title}</h2>}
        {description && <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
