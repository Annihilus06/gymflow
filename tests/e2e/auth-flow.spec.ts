import { test, expect } from '@playwright/test';

test.describe('Authentication & Profile Flows', () => {
  test('Unauthenticated user accessing dashboard is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
  });

  test('Login form validates empty or malformed inputs on submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('User can switch between Login and Register pages smoothly', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('Registration form rejects mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email address').fill('test@gymflow.local');
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm Password').fill('DifferentPassword123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('Unauthenticated user accessing onboarding is redirected to login', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/.*login.*callbackUrl/);
  });
});
