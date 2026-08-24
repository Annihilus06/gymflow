import { test, expect } from '@playwright/test';

test.describe('Progress & Analytics Flows', () => {
  test('Unauthenticated user accessing /progress is redirected to login', async ({ page }) => {
    await page.goto('/progress');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
