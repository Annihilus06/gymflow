import { test, expect } from '@playwright/test';

test.describe('PWA & Offline Architecture Flows', () => {
  test('Web App Manifest is accessible and valid', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.short_name).toBe('GymFlow');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.shortcuts).toBeDefined();
  });

  test('Service Worker file /sw.js is served correctly', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('GymFlow Service Worker');
    expect(text).toContain('addEventListener');
  });

  test('PWA Icon SVG is served correctly', async ({ request }) => {
    const response = await request.get('/icons/icon.svg');
    expect(response.status()).toBe(200);
  });
});
