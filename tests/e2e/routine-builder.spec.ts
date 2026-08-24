import { test, expect } from '@playwright/test';

test.describe('Routine Builder Flows', () => {
  test('Unauthenticated user accessing /workout or /routines is redirected to login', async ({
    page,
  }) => {
    await page.goto('/workout');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);

    await page.goto('/routines/new');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
