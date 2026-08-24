import { test, expect } from '@playwright/test';

test.describe('Nutrition & Fuel Flows', () => {
  test('Unauthenticated user accessing /nutrition is redirected to login', async ({ page }) => {
    await page.goto('/nutrition');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
