import { test, expect } from '@playwright/test';

test.describe('AI Workout Optimization Flows', () => {
  test('Unauthenticated user cannot access routine editor or trigger AI optimization', async ({
    page,
  }) => {
    await page.goto('/routines/test-routine-id');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
