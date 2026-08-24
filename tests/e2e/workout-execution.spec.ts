import { test, expect } from '@playwright/test';

test.describe('Workout Execution & History Flows', () => {
  test('Unauthenticated user accessing /execute or /history is redirected to login', async ({
    page,
  }) => {
    await page.goto('/execute');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);

    await page.goto('/history');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
