import { test, expect } from '@playwright/test';

test.describe('Goal Management Flows', () => {
  test('Unauthenticated user accessing /goals is redirected to login', async ({ page }) => {
    await page.goto('/goals');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
