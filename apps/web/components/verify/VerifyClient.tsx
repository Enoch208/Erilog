'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { verifyBundle, type BundleFiles, type VerificationResult } from '@erilog/verifier/core';
import { applyQuantityMutation } from '@erilog/verifier/tamper-lab';
import { ArchiveSafetyError, readArchiveInBrowser } from '@/lib/verify/read-archive-browser';
import { CHECK_LAYERS, layerForCode } from '@/lib/verify/checks';

type LayerStatus = 'pass' | 'fail' | 'skipped';

interface LayerOutcome {
  id: string;
  title: string;
  description: string;
  status: LayerStatus;
  failures: VerificationResult['failures'];
}

interface Report {
  overall: 'pass' | 'fail';
  fileName: string;
  layers: LayerOutcome[];
  manifest?: {
    missionId: string;
    policyVersion: number;
    eventCount: number;
    eventSetDigest: string;
    exportedAt: string;
    keyId: string;
    canonicalization: string;
  };
  tampered: boolean;
}

const KEY_PATTERN = /^[0-9a-f]{64}$/i;

function buildReport(
  fileName: string,
  result: VerificationResult,
  files: BundleFiles | undefined,
  tampered: boolean,
  archiveFailed: boolean
): Report {
  const layers: LayerOutcome[] = CHECK_LAYERS.map((layer) => {
    const failures = result.failures.filter((failure) => layer.codes.includes(failure.check));
    if (failures.length > 0) return { ...layer, status: 'fail', failures };
    // If the archive could not be read, later layers never ran.
    if (archiveFailed && layer.id !== 'archive') {
      return { ...layer, status: 'skipped', failures: [] };
    }
    // A manifest parse failure short-circuits the verifier core.
    const manifestFailed = result.failures.some((f) => f.check === 'manifest_parse');
    if (manifestFailed && !['archive', 'manifest'].includes(layer.id)) {
      return { ...layer, status: 'skipped', failures: [] };
    }
    return { ...layer, status: 'pass', failures: [] };
  });

  let manifest: Report['manifest'];
  if (files?.['manifest.json']) {
    try {
      const parsed = JSON.parse(files['manifest.json']);
      manifest = {
        missionId: String(parsed.missionId ?? ''),
        policyVersion: Number(parsed.policyVersion ?? 0),
        eventCount: Number(parsed.eventCount ?? 0),
        eventSetDigest: String(parsed.eventSetDigest ?? ''),
        exportedAt: String(parsed.exportedAt ?? ''),
        keyId: String(parsed.keyId ?? ''),
        canonicalization: String(parsed.canonicalization ?? ''),
      };
    } catch {
      manifest = undefined;
    }
  }

  return {
    overall: result.valid ? 'pass' : 'fail',
    fileName,
    layers,
    manifest,
    tampered,
  };
}

export function VerifyClient() {
  const [publicKey, setPublicKey] = useState('');
  const [keySource, setKeySource] = useState<'none' | 'server' | 'manual'>('none');
  const [serverFingerprint, setServerFingerprint] = useState('');
  const [bundle, setBundle] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyFieldId = useId();
  const statusRegionId = useId();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/public-key');
        if (!response.ok) return;
        const data = (await response.json()) as { publicKey?: string; fingerprint?: string };
        if (cancelled || !data.publicKey) return;
        setPublicKey((current) => (current ? current : data.publicKey!));
        setServerFingerprint(data.fingerprint ?? '');
        setKeySource((current) => (current === 'manual' ? current : 'server'));
      } catch {
        // Offline or key not configured: the operator can paste a key instead.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const keyValid = KEY_PATTERN.test(publicKey.trim());

  const run = useCallback(
    async (input: { name: string; bytes: Uint8Array }, options: { tamper: boolean }) => {
      if (!KEY_PATTERN.test(publicKey.trim())) {
        setError('Enter a 64-character hex Ed25519 public key before verifying.');
        return;
      }

      setBusy(true);
      setError('');
      setReport(null);

      try {
        let files: BundleFiles;
        try {
          files = await readArchiveInBrowser(input.bytes);
        } catch (archiveError) {
          const failure =
            archiveError instanceof ArchiveSafetyError
              ? { check: archiveError.code, message: archiveError.message }
              : {
                  check: 'archive_safety',
                  message:
                    archiveError instanceof Error ? archiveError.message : String(archiveError),
                };
          setReport(
            buildReport(input.name, { valid: false, failures: [failure] }, undefined, options.tamper, true)
          );
          return;
        }

        const target = options.tamper ? applyQuantityMutation(files, 1, 2).mutated : files;
        const result = await verifyBundle(target, publicKey.trim());
        setReport(buildReport(input.name, result, target, options.tamper, false));
      } catch (runError) {
        setError(runError instanceof Error ? runError.message : String(runError));
      } finally {
        setBusy(false);
      }
    },
    [publicKey]
  );

  const acceptFile = useCallback(
    async (file: File) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const next = { name: file.name, bytes };
      setBundle(next);
      setReport(null);
      setError('');
      await run(next, { tamper: false });
    },
    [run]
  );

  const summaryLine = useMemo(() => {
    if (!report) return '';
    if (report.overall === 'pass') {
      return report.tampered
        ? 'Unexpected: the tampered bundle passed. This would be a defect.'
        : 'All checks passed. This bundle matches its signature and recomputes correctly.';
    }
    const failed = report.layers.filter((layer) => layer.status === 'fail').length;
    return report.tampered
      ? `Tamper detected. ${failed} check${failed === 1 ? '' : 's'} failed, with the exact file and values named below.`
      : `Verification failed. ${failed} check${failed === 1 ? '' : 's'} failed, with the exact file and values named below.`;
  }, [report]);

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="verify-key-heading"
        className="rounded-card border border-border bg-surface p-6 sm:p-7"
      >
        <h2 id="verify-key-heading" className="text-lg font-heading text-ink">
          1 — Pin a public key
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Verification is only meaningful against a key you trust. This page loads the deployment&apos;s
          published key for convenience, but an independent auditor should obtain the key out of band
          and paste it here.
        </p>

        <label htmlFor={keyFieldId} className="eyebrow mt-5 block">
          Ed25519 public key (64 hex characters)
        </label>
        <input
          id={keyFieldId}
          value={publicKey}
          onChange={(event) => {
            setPublicKey(event.target.value);
            setKeySource('manual');
          }}
          spellCheck={false}
          autoComplete="off"
          placeholder="e.g. 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
          aria-describedby={`${keyFieldId}-hint`}
          aria-invalid={publicKey.length > 0 && !keyValid}
          className="mono mt-2 w-full rounded-control border border-border bg-canvas px-4 py-3 text-[13px] text-ink outline-none transition focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/40"
        />
        <p id={`${keyFieldId}-hint`} className="mt-2 text-xs text-muted">
          {publicKey.length === 0
            ? 'No key loaded yet.'
            : keyValid
              ? keySource === 'server'
                ? `Loaded from this deployment${serverFingerprint ? ` · fingerprint ${serverFingerprint.slice(0, 16)}…` : ''}`
                : 'Using the key you pasted.'
              : 'Expected exactly 64 hexadecimal characters.'}
        </p>
      </section>

      <section
        aria-labelledby="verify-upload-heading"
        className="rounded-card border border-border bg-surface p-6 sm:p-7"
      >
        <h2 id="verify-upload-heading" className="text-lg font-heading text-ink">
          2 — Load an audit bundle
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Everything runs in your browser. The ZIP is never uploaded to a server.
        </p>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void acceptFile(file);
          }}
          className={`mt-5 rounded-card border border-dashed p-6 text-center transition-colors ${
            dragging ? 'border-mint bg-mint-wash/50' : 'border-border bg-canvas'
          }`}
        >
          <p className="text-sm text-ink">Drop <span className="mono">.zip</span> here, or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="btn-secondary mt-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Choose bundle file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void acceptFile(file);
            }}
          />
          {bundle && (
            <p className="mono mt-4 text-xs text-muted">
              Loaded {bundle.name} · {(bundle.bytes.byteLength / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => bundle && void run(bundle, { tamper: false })}
            disabled={busy || !bundle || !keyValid}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Verifying…' : 'Verify bundle'}
          </button>
          <button
            type="button"
            onClick={() => bundle && void run(bundle, { tamper: true })}
            disabled={busy || !bundle || !keyValid}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            title="Changes one recorded quantity from 1 to 2, then verifies the altered bundle"
          >
            Tamper test: change a quantity
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          Need a bundle? Open Judge Mode, run the seed-42 walkthrough, and export the signed archive.
        </p>
      </section>

      <div aria-live="polite" aria-atomic="true" id={statusRegionId}>
        {error && (
          <p className="rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {report && (
          <section aria-labelledby="verify-result-heading" className="space-y-5">
            <div
              className={`rounded-card border p-6 sm:p-7 ${
                report.overall === 'pass'
                  ? 'border-mint/40 bg-mint-wash/60'
                  : 'border-danger/30 bg-danger/5'
              }`}
            >
              <p className="eyebrow">
                {report.tampered ? 'Tamper test result' : 'Verification result'}
              </p>
              <h2
                id="verify-result-heading"
                className="mt-2 text-2xl font-heading text-ink sm:text-3xl"
              >
                {report.overall === 'pass' ? 'PASS' : 'FAIL'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{summaryLine}</p>
              <p className="mono mt-3 text-xs text-muted">{report.fileName}</p>
            </div>

            {report.manifest && (
              <dl className="grid gap-4 rounded-card border border-border bg-surface p-6 sm:grid-cols-2">
                {[
                  ['Mission', report.manifest.missionId],
                  ['Policy version', String(report.manifest.policyVersion)],
                  ['Events', String(report.manifest.eventCount)],
                  ['Canonicalization', report.manifest.canonicalization],
                  ['Exported at', report.manifest.exportedAt],
                  ['Key fingerprint', report.manifest.keyId],
                  ['Event-set digest', report.manifest.eventSetDigest],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="eyebrow">{label}</dt>
                    <dd className="mono mt-1 break-all text-[13px] text-ink">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            )}

            <ol className="space-y-3">
              {report.layers.map((layer, index) => (
                <li
                  key={layer.id}
                  className="rounded-card border border-border bg-surface p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-heading text-ink">
                      <span className="mono mr-2 text-muted">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {layer.title}
                    </h3>
                    <span
                      className={`mono rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${
                        layer.status === 'pass'
                          ? 'bg-mint-wash text-mint-dark'
                          : layer.status === 'fail'
                            ? 'bg-danger/10 text-danger'
                            : 'bg-canvas text-muted'
                      }`}
                    >
                      {layer.status === 'pass' ? 'Pass' : layer.status === 'fail' ? 'Fail' : 'Not reached'}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{layer.description}</p>

                  {layer.failures.map((failure, failureIndex) => (
                    <div
                      key={`${failure.check}-${failureIndex}`}
                      className="mt-3 rounded-control border border-danger/25 bg-danger/5 p-4"
                    >
                      <p className="mono text-[11px] uppercase tracking-[0.12em] text-danger">
                        {failure.check}
                        {failure.file ? ` · ${failure.file}` : ''}
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink/85">
                        {failure.message}
                      </p>
                      {(failure.expected || failure.observed) && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="eyebrow">Expected</p>
                            <p className="mono mt-1 max-h-24 overflow-auto break-all text-[11px] text-ink/80">
                              {failure.expected ?? '—'}
                            </p>
                          </div>
                          <div>
                            <p className="eyebrow">Observed</p>
                            <p className="mono mt-1 max-h-24 overflow-auto break-all text-[11px] text-ink/80">
                              {failure.observed ?? '—'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
