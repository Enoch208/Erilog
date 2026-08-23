import Link from 'next/link';
import { JudgeShell, MetricCard, Panel } from '@/components/judge/JudgeShell';

interface Props {
  params: Promise<{ sessionId: string }>;
}

const devices = [
  {
    name: 'Operator Alpha',
    deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
    allocation: 50,
    tokens: 'HH-040 · HH-042',
  },
  {
    name: 'Operator Bravo',
    deviceId: 'a1b2c3d4-0000-4000-8000-bbb000000002',
    allocation: 50,
    tokens: 'HH-041 · HH-042',
  },
] as const;

export default async function JudgeSessionPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <JudgeShell
      sessionId={sessionId}
      activePage="overview"
      title="Mission overview"
      description="A deterministic demonstration workspace for recording offline handouts, reconciling peer events, and exporting independently verifiable evidence."
      actions={
        <Link
          href={`/judge/${sessionId}/coordinator`}
          className="inline-flex min-h-10 items-center rounded-control bg-ink px-4 text-[12px] font-medium text-white transition-colors hover:bg-evidence focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2"
        >
          Coordinator View
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mission stock" value={100} detail="Emergency kits allocated" />
        <MetricCard label="Provisioned devices" value={2} detail="Alpha and Bravo" />
        <MetricCard label="Policy version" value="v0" detail="1 kit per entitlement" code />
        <MetricCard label="Conflict fixture" value="HH-042" detail="Present on both devices" tone="warning" code />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          eyebrow="Device estate"
          title="Provisioned operators"
          description="Each device owns a fixed local allocation and independent append-only sequence."
        >
          <div className="overflow-hidden rounded-control border border-border">
            <div className="hidden grid-cols-[1fr_110px_1fr_90px] gap-4 border-b border-border bg-canvas px-4 py-2.5 text-[10px] text-muted sm:grid">
              <span>Device</span>
              <span>Allocation</span>
              <span>Demo tokens</span>
              <span className="text-right">State</span>
            </div>
            {devices.map((device, index) => (
              <Link
                key={device.deviceId}
                href={`/judge/${sessionId}/operator/${device.deviceId}`}
                className={`grid gap-3 px-4 py-4 transition-colors hover:bg-canvas sm:grid-cols-[1fr_110px_1fr_90px] sm:items-center sm:gap-4 ${index > 0 ? 'border-t border-border' : ''}`}
              >
                <div>
                  <p className="text-[13px] font-medium text-ink">{device.name}</p>
                  <p className="mono mt-1 text-[9px] text-muted">{device.deviceId.slice(0, 18)}…</p>
                </div>
                <p className="text-[12px] text-muted"><span className="font-medium text-ink">{device.allocation}</span> kits</p>
                <p className="mono text-[10px] text-muted">{device.tokens}</p>
                <span className="flex items-center gap-2 text-[10px] text-mint-dark sm:justify-end">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" />
                  Offline-ready
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Verification runbook"
          title="Seed-42 execution path"
          description="Complete these steps in order to reproduce the reference result."
        >
          <ol className="space-y-0">
            {[
              ['Record Alpha', 'HH-040 and HH-042 while offline'],
              ['Record Bravo', 'HH-041 and HH-042 while offline'],
              ['Reconnect', 'Sync both append-only queues'],
              ['Reconcile', 'Confirm 4 distributed and 1 exception'],
              ['Export', 'Verify the signed ZIP offline'],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-4 border-b border-border py-3.5 first:pt-0 last:border-0 last:pb-0">
                <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-control border border-border bg-canvas text-[9px] text-muted">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-[12px] font-medium text-ink">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="mt-6 border-l-2 border-mint bg-mint-wash/60 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-mint-dark">
          Expected reference state: <strong>4 distributed</strong>, <strong>96 remaining</strong>, <strong>3 unique tokens</strong>, and <strong>1 unresolved duplicate-entitlement exception</strong>.
        </p>
      </div>
    </JudgeShell>
  );
}
