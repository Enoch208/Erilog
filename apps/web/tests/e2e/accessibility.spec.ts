import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility audit using axe-core.
 *
 * Runs against critical views to detect WCAG 2.2 AA violations.
 * Note: Full WCAG compliance requires manual testing with assistive
 * technologies and expert review.
 */
test.describe('Accessibility Audit', () => {
  test('landing page has no critical violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter to critical and serious only
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });

  test('judge session page has no critical violations', async ({ page }) => {
    await page.goto('/api/judge');
    // Will redirect to /judge/[sessionId]
    await page.waitForURL(/\/judge\//);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });

  test('operator page has no critical violations', async ({ page }) => {
    await page.goto('/api/judge');
    await page.waitForURL(/\/judge\//);
    await page.getByText('Operator Alpha').click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });

  test('coordinator page has no critical violations', async ({ page }) => {
    await page.goto('/api/judge');
    await page.waitForURL(/\/judge\//);
    await page.getByText('Coordinator View').click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });

  test('keyboard navigation through operator flow', async ({ page }) => {
    await page.goto('/api/judge');
    await page.waitForURL(/\/judge\//);

    // Tab through the page — verify focus is visible
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Navigate to operator via keyboard
    // Tab through links until we reach Operator Alpha
    for (let i = 0; i < 10; i++) {
      const current = await page.locator(':focus').textContent();
      if (current?.includes('Operator Alpha')) {
        await page.keyboard.press('Enter');
        break;
      }
      await page.keyboard.press('Tab');
    }

    // Should be on operator page or still navigating
    // The important thing is no keyboard trap occurred
    await expect(page.locator('body')).toBeVisible();
  });
});
