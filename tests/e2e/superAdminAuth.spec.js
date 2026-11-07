import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Super Admin Account Restoration & Privilege Boundary Verification', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('403') && !msg.text().includes('Failed to load resource')) {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('1. Recovery Script Idempotency: Running restore script detects existing account without duplicates', async () => {
    // Run restoreSuperAdmin script directly
    const output = execSync('node backend/src/scripts/restoreSuperAdmin.js', {
      encoding: 'utf-8',
      env: process.env,
    });
    expect(output).toContain('[RestoreSuperAdmin]');
    expect(output).toMatch(/already exists|Created new Super Admin account/);
    expect(output).toContain('superadmin@dhaantrack.com');
  });

  test('2. Super Admin Login via Email, Session Persistence, Badge & Privileged API Access', async ({ page }) => {
    // Go to login page and ensure fresh session
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    // Fill credentials using Email
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'superadmin@dhaantrack.com');
    await page.fill('input[placeholder="••••••••"]', 'SuperAdmin@Dhaan2026!Sec');
    await page.locator('button[type="submit"]').click();

    // Verify redirect to Admin Dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');

    // Verify Super Admin Name, UserId and SUPER ADMIN badge
    await expect(page.locator('text=DhaanTrack Super Admin').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=@superadmin').first()).toBeVisible();
    await expect(page.getByTestId('user-role-badge')).toHaveText('SUPER ADMIN');

    // Verify session persistence on page reload
    await page.reload();
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await expect(page.getByTestId('user-role-badge')).toHaveText('SUPER ADMIN');

    // Verify Super Admin privileged backend endpoint (/api/auth/superadmin/verify) returns 200
    const verifyResult = await page.evaluate(async () => {
      const response = await fetch('/api/auth/superadmin/verify', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      return { status: response.status, data };
    });

    expect(verifyResult.status).toBe(200);
    expect(verifyResult.data.success).toBe(true);
    expect(verifyResult.data.message).toBe('Super Admin permissions verified.');
    expect(verifyResult.data.data.role).toBe('SUPER_ADMIN');

    // Logout via Sign Out button
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i });
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');

    // Verify unauthenticated user cannot access /admin/dashboard
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

  test('3. Super Admin Login via User ID (superadmin) and Navigation', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    // Fill credentials using User ID
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'superadmin');
    await page.fill('input[placeholder="••••••••"]', 'SuperAdmin@Dhaan2026!Sec');
    await page.locator('button[type="submit"]').click();

    // Verify redirect to Admin Dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');

    // Verify SUPER ADMIN badge
    await expect(page.getByTestId('user-role-badge')).toHaveText('SUPER ADMIN');

    // Clean up session
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i });
    await signOutBtn.click();
    await page.waitForURL('**/login', { timeout: 15000 });
  });

  test('4. Privilege Boundary: Normal Admin cannot access Super Admin endpoints', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    // Log in as standard admin
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'admin');
    await page.fill('input[placeholder="••••••••"]', 'Admin@DhaanTrack2026');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');

    // Verify standard ADMIN badge (and absence of SUPER ADMIN badge)
    await expect(page.getByTestId('user-role-badge')).toHaveText('ADMIN');
    expect(await page.getByTestId('user-role-badge').textContent()).not.toBe('SUPER ADMIN');

    // Attempt to access Super Admin protected endpoint as standard Admin -> Expect 403 Forbidden
    const forbiddenResult = await page.evaluate(async () => {
      const response = await fetch('/api/auth/superadmin/verify', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      return { status: response.status, data };
    });

    expect(forbiddenResult.status).toBe(403);
    expect(forbiddenResult.data.success).toBe(false);
    expect(forbiddenResult.data.message).toMatch(/Forbidden|insufficient permissions/i);

    // Clean up session
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i });
    await signOutBtn.click();
    await page.waitForURL('**/login', { timeout: 15000 });
  });
});
