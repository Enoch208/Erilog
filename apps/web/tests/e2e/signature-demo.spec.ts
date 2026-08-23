import { test, expect } from '@playwright/test';

/**
 * E2E test for the full signature demo flow (seed-42).
 *
 * This test exercises:
 * 1. Judge Mode entry
 * 2. Operator Alpha records 2 events offline
 * 3. Operator Bravo records 2 events offline
 * 4. Both devices sync
 * 5. Coordinator sees 4 distributed, 96 remaining, 1 exception
 * 6. Export audit bundle
 *
 * Requires: running Next.js dev server + PostgreSQL with seed-42 data
 */
test.describe('Signature Demo Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Reset the mission state before each test
    await page.goto('/api/judge', { waitUntil: 'domcontentloaded' });
    // This should redirect to /judge/[sessionId]
    await expect(page).toHaveURL(/\/judge\//);
  });

  test('complete seed-42 demo path', async ({ page, context }) => {
    // We should be on the judge session page
    await expect(page.getByText('Emergency Distribution Alpha')).toBeVisible();

    // Step 1: Open Alpha operator
    await page.getByText('Operator Alpha').click();
    await expect(page.getByText('Operator Alpha')).toBeVisible();

    // Step 2: Record HH-040 offline
    await context.setOffline(true);
    await page.getByPlaceholder('e.g. HH-040').fill('HH-040');
    await page.getByRole('button', { name: 'Confirm Handout' }).click();
    // Verify event recorded
    await expect(page.getByText('pending')).toBeVisible();

    // Record HH-042
    await page.getByPlaceholder('e.g. HH-040').fill('HH-042');
    await page.getByRole('button', { name: 'Confirm Handout' }).click();
    // Should have 2 pending events
    await expect(page.locator('text=pending').first()).toBeVisible();

    // Step 3: Sync Alpha
    await context.setOffline(false);
    await page.getByRole('button', { name: /Sync/ }).click();
    await expect(page.getByText(/Synced 2/)).toBeVisible({ timeout: 10_000 });

    // Step 4: Go back and open Bravo operator
    await page.getByText('← Back').click();
    await page.getByText('Operator Bravo').click();
    await expect(page.getByText('Operator Bravo')).toBeVisible();

    // Step 5: Record HH-041 offline
    await context.setOffline(true);
    await page.getByPlaceholder('e.g. HH-040').fill('HH-041');
    await page.getByRole('button', { name: 'Confirm Handout' }).click();

    // Record HH-042 (conflict token)
    await page.getByPlaceholder('e.g. HH-040').fill('HH-042');
    await page.getByRole('button', { name: 'Confirm Handout' }).click();

    // Step 6: Sync Bravo
    await context.setOffline(false);
    await page.getByRole('button', { name: /Sync/ }).click();
    await expect(page.getByText(/Synced 2/)).toBeVisible({ timeout: 10_000 });

    // Step 7: Check coordinator view
    await page.getByText('← Back').click();
    await page.getByText('Coordinator View').click();
    await expect(page.getByText('Coordinator')).toBeVisible();

    // Click refresh to get latest data
    await page.getByRole('button', { name: 'Refresh' }).click();
    await page.waitForTimeout(1000);

    // Verify reconciliation results
    await expect(page.getByText('4').first()).toBeVisible(); // distributed
    await expect(page.getByText('96')).toBeVisible(); // remaining
    await expect(page.getByText('duplicate_entitlement')).toBeVisible(); // exception

    // Step 8: Export bundle
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Audit Bundle' }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('erilog-audit');
  });

  test('offline persistence - events survive reload', async ({ page, context }) => {
    await page.getByText('Operator Alpha').click();

    // Go offline and record
    await context.setOffline(true);
    await page.getByPlaceholder('e.g. HH-040').fill('HH-040');
    await page.getByRole('button', { name: 'Confirm Handout' }).click();
    await expect(page.getByText('pending')).toBeVisible();

    // Reload the page (still offline from IndexedDB perspective)
    await context.setOffline(false);
    await page.reload();

    // Event should persist from IndexedDB
    await expect(page.getByText('pending')).toBeVisible({ timeout: 5_000 });
  });

  test('duplicate token warning on same device', async ({ page }) => {
    await page.getByText('Operator Alpha').click();

    // Record first token
    await page.getByPlaceholder('e.g. HH-040').fill('HH-040');
    await page.getByRole('button', { name: 'Confirm Handout' }).click();

    // Try same token again
    await page.getByPlaceholder('e.g. HH-040').fill('HH-040');
    await page.getByRole('button', { name: 'Confirm Handout' }).click();

    // Should show duplicate warning
    await expect(page.getByText('already used on this device')).toBeVisible();
  });
});
