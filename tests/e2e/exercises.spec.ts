import { test, expect } from '@playwright/test';

test.describe('Exercise Library Explorer Flows', () => {
  test('Unauthenticated user accessing /exercises is redirected to login', async ({ page }) => {
    await page.goto('/exercises');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
