import { test, expect } from '@playwright/test';

test.describe('Workout Calendar Flows', () => {
  test('Unauthenticated user accessing /calendar is redirected to login', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
