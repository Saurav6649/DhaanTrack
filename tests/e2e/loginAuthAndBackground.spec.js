import { test, expect } from '@playwright/test';

test.describe('Priority 1 & 2: Login Page Authentication Bug Fix and Agricultural Background Tests', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('Authentication Flow: Logged-in /login redirect, refresh survival, no flash, logout, expired session, and no redirect loops', async ({ page }) => {
    // 1. Initial State: Unauthenticated user accesses /login
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    // Verify Login Form is displayed when logged out
    await expect(page.getByRole('heading', { name: 'DhaanTrack' })).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. admin or operator1"]')).toBeVisible();

    // 1. Login with valid credentials
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'admin');
    await page.fill('input[placeholder="••••••••"]', 'Admin@DhaanTrack2026');
    await page.locator('button[type="submit"]').click();

    // 2. Verify Dashboard opens
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');

    // 3. Manually navigate to /login while authenticated
    await page.goto('/login');

    // 4. Verify redirect to /dashboard (which routes to /admin/dashboard)
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');
    expect(page.url()).not.toContain('/login');

    // 5. Refresh /login while authenticated
    await page.goto('/login');
    await page.reload();

    // 6. Verify redirect to /dashboard after refresh
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');

    // 7. Verify no Login Page flash during session verification
    // Navigate to /login and verify login form inputs are never rendered
    const loginInput = page.locator('input[placeholder="e.g. admin or operator1"]');
    await page.goto('/login');
    await expect(loginInput).toHaveCount(0);
    await page.waitForURL('**/admin/dashboard');

    // 8. Logout via Sign Out button
    const signOutBtn = page.getByRole('button', { name: /Sign Out|Logout/i });
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await page.waitForURL('**/login', { timeout: 15000 });

    // 9 & 10. Access /login after logout -> Login Form is displayed
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'DhaanTrack' })).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. admin or operator1"]')).toBeVisible();

    // 11 & 12. Access /dashboard after logout -> redirects to /login
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');

    // 13. Expired Session behavior: simulate expired cookie/session by clearing session tokens
    await page.goto('/login');
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'admin');
    await page.fill('input[placeholder="••••••••"]', 'Admin@DhaanTrack2026');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // Invalidate session (simulate expired cookie & token)
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');

    // 14. Verify no redirect loop between /dashboard and /login
    // Accessing /login directly as unauthenticated stays on /login
    await page.goto('/login');
    await page.waitForTimeout(1000);
    expect(new URL(page.url()).pathname).toBe('/login');
  });

  test('Login UI: Background image, full viewport coverage, readability, password eye toggle, and responsiveness', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    // 1. Background image loads successfully
    const bgImage = page.locator('#login-bg-image');
    await expect(bgImage).toBeVisible();

    // Verify background image natural width > 0 (actually loaded by browser)
    const isImageLoaded = await bgImage.evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(isImageLoaded).toBe(true);

    // 2. Background image covers the full viewport
    const bgParent = bgImage.locator('..');
    await expect(bgParent).toHaveClass(/absolute inset-0/);

    // 3. Login Card remains readable and centered
    const loginCard = page.locator('.login-card-anim');
    await expect(loginCard).toBeVisible();
    await expect(page.getByRole('heading', { name: 'DhaanTrack' })).toBeVisible();
    await expect(page.getByText('Harvester Work, Billing & Profit Management System')).toBeVisible();

    // 4. Password is hidden by default
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 5. Eye button reveals password
    const eyeBtn = page.locator('#toggle-password-visibility-btn');
    await expect(eyeBtn).toBeVisible();
    await expect(eyeBtn).toHaveAttribute('type', 'button');
    await expect(eyeBtn).toHaveAttribute('aria-label', 'Show password');

    const testPassword = 'Admin@DhaanTrack2026';
    await passwordInput.fill(testPassword);
    await expect(passwordInput).toHaveValue(testPassword);

    await eyeBtn.click();
    // 5. Revealed as text
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(eyeBtn).toHaveAttribute('aria-label', 'Hide password');

    // 7. Password value remains unchanged
    await expect(passwordInput).toHaveValue(testPassword);

    // 8. Eye button does not submit the form
    expect(page.url()).toContain('/login');
    await expect(page.getByText('User ID is required')).not.toBeVisible();

    // 6. EyeOff button hides password
    await eyeBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(eyeBtn).toHaveAttribute('aria-label', 'Show password');
    await expect(passwordInput).toHaveValue(testPassword);

    // 9. Login form works correctly
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'admin');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');

    // Log out before responsive test
    const signOutBtn = page.getByRole('button', { name: /Sign Out|Logout/i });
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await page.waitForURL('**/login', { timeout: 15000 });

    // 10 & 11. Mobile responsive layout and zero horizontal overflow
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await expect(page.locator('#login-bg-image')).toBeVisible();
    await expect(page.locator('.login-card-anim')).toBeVisible();

    // 12. No browser console errors (excluding expected 401 unauthenticated session checks and favicon)
    expect(consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('401'))).toHaveLength(0);
  });
});
