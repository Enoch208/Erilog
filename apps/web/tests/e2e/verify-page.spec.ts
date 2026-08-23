import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * E2E coverage for the browser verifier at /verify.
 *
 * Exports a real signed bundle through Judge Mode, then verifies that bundle
 * in the actual page UI: an untouched bundle must PASS, and the tamper test
 * must FAIL while naming events.json.
 */
test.describe('Browser verifier page', () => {
  test('verifies a real exported bundle and detects tampering', async ({ page, context }) => {
    // --- Produce a real signed bundle through the product itself ---
    await page.goto('/api/judge', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/judge\//);

    // Reset the shared demo mission so device sequences start from a clean state.
    const reset = await page.request.delete('/api/judge');
    expect(reset.ok()).toBeTruthy();
    await page.reload();

    const record = async (token: string, expectedPending: number) => {
      await page.getByRole('button', { name: `Use ${token}` }).click();
      const confirm = page.getByRole('button', { name: 'Confirm Handout' });
      await expect(confirm).toBeEnabled();
      await confirm.click();
      // Wait for the queue to actually grow before the next entry, otherwise the
      // async record clears the token input mid-interaction.
      await expect(page.getByText(`Recorded ${token} on this device`)).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByRole('button', {
          name: `Sync ${expectedPending} event${expectedPending === 1 ? '' : 's'}`,
        })
      ).toBeVisible({ timeout: 15_000 });
    };

    await page.getByRole('link', { name: 'Device Alpha' }).first().click();
    await record('HH-040', 1);
    await record('HH-042', 2);
    await page.getByRole('button', { name: /Sync/ }).click();
    await expect(page.getByText('2 events accepted')).toBeVisible({ timeout: 20_000 });

    await page.getByRole('link', { name: 'Device Bravo' }).first().click();
    await record('HH-041', 1);
    await record('HH-042', 2);

    await page.getByRole('button', { name: /Sync/ }).click();
    await expect(page.getByText('2 events accepted')).toBeVisible({ timeout: 20_000 });

    await page.getByRole('link', { name: 'Coordinator' }).first().click();
    await expect(page.getByRole('button', { name: /Export/ })).toBeVisible({ timeout: 20_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export/ }).click(),
    ]);

    const dir = await mkdtemp(join(tmpdir(), 'erilog-verify-e2e-'));
    const bundlePath = join(dir, download.suggestedFilename());
    await download.saveAs(bundlePath);

    // --- Verify it in the browser verifier ---
    await page.goto('/verify');
    await expect(page.getByRole('heading', { name: 'Verify an audit bundle' })).toBeVisible();

    // The deployment's public key should load automatically.
    const keyField = page.getByLabel(/Ed25519 public key/);
    await expect(keyField).toHaveValue(/^[0-9a-f]{64}$/, { timeout: 15_000 });

    await page.setInputFiles('input[type="file"]', bundlePath);

    // Untouched bundle passes.
    await expect(page.getByRole('heading', { name: 'PASS' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('All checks passed', { exact: false })).toBeVisible();

    // Every layer reports a pass for a clean bundle.
    await expect(page.getByRole('heading', { name: /Ed25519 signature/ })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Reconciliation recomputation/ })
    ).toBeVisible();
    expect(await page.getByText('Fail', { exact: true }).count()).toBe(0);
    expect(await page.getByText('Pass', { exact: true }).count()).toBe(7);

    // --- Tamper test must fail and name the file ---
    await page.getByRole('button', { name: /Tamper test/ }).click();
    await expect(page.getByRole('heading', { name: 'FAIL' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Tamper detected', { exact: false })).toBeVisible();
    await expect(page.getByText('file_checksum · events.json')).toBeVisible();
  });

  test('rejects a bundle when the pinned key does not match', async ({ page }) => {
    await page.goto('/verify');

    const keyField = page.getByLabel(/Ed25519 public key/);
    await expect(keyField).toHaveValue(/^[0-9a-f]{64}$/, { timeout: 15_000 });

    // A syntactically valid but wrong key.
    await keyField.fill('a'.repeat(64));
    await expect(page.getByText('Using the key you pasted.')).toBeVisible();
  });

  test('page is reachable from the marketing hero', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Verify a bundle in your browser/ }).click();
    await expect(page).toHaveURL(/\/verify$/);
    await expect(page.getByRole('heading', { name: 'Verify an audit bundle' })).toBeVisible();
  });

  test('verify is reachable from the header on every page', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('banner')
      .getByRole('link', { name: 'Verify a bundle' })
      .click();
    await expect(page).toHaveURL(/\/verify$/);
  });
});
