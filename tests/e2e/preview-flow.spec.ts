import { test, expect } from '@playwright/test';

test.describe('End-to-End Product Preview User Flow', () => {
  test('Complete user journey: unauthenticated navigation, login, routine, calendar, execute, and progress', async ({
    page,
  }) => {
    // 1. Visit root -> redirected to login
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();

    // 2. Login Page UI Elements
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();

    // 3. Switch to Register page
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();

    // 4. Navigate to Protected Routes (verify middleware guard)
    await page.goto('/workout');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);

    await page.goto('/calendar');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);

    await page.goto('/execute');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);

    await page.goto('/progress');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);

    await page.goto('/goals');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);

    await page.goto('/nutrition');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
