import { test, expect } from '@playwright/test';

test.describe('Dashboard & Home Screen Flows', () => {
  test('Unauthenticated user accessing /dashboard is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
