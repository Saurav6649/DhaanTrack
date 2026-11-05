import { test, expect } from '@playwright/test';

test.describe('DhaanTrack Priority Fixes Verification', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  // PRIORITY 1 — Login Password Eye Button
  test('Priority 1: Password visibility toggle functionality, value preservation, and form submission', async ({ page }) => {
    // 1. Login page opens
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'DhaanTrack' })).toBeVisible();

    const passwordInput = page.locator('input[placeholder="••••••••"]');
    const toggleBtn = page.locator('#toggle-password-visibility-btn');

    // 2. Eye icon is visible
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('type', 'button');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Show password');

    // 3. Password is hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Enter test password
    const testSecret = 'Admin@DhaanTrack2026';
    await passwordInput.fill(testSecret);
    await expect(passwordInput).toHaveValue(testSecret);
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 4. Clicking Eye shows password
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Hide password');

    // 6. Password value is preserved
    await expect(passwordInput).toHaveValue(testSecret);

    // 7. Toggle does not trigger form submission
    expect(page.url()).toContain('/login');
    await expect(page.getByText('User ID is required')).not.toBeVisible();

    // 5. Clicking EyeOff hides password again
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Show password');
    await expect(passwordInput).toHaveValue(testSecret);

    // 8. Login functionality works
    const userIdInput = page.locator('input[placeholder="e.g. admin or operator1"]');
    await userIdInput.fill('admin');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/admin/dashboard');
  });

  // PRIORITY 2 — Remove Machines & Services From Admin Panel
  test('Priority 2: Admin navigation does not display Machines & Services', async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'admin');
    await page.fill('input[placeholder="••••••••"]', 'Admin@DhaanTrack2026');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // Inspect admin sidebar navigation
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();

    // Verify legitimate admin items exist
    await expect(aside.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Bookings / Works' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Users & Machines' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Contractors' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Expenses' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Reports & Export' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Master Data' })).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Recycle Bin' })).toBeVisible();

    // Verify "Machines & Services" menu item is completely absent from Admin sidebar
    await expect(aside.getByText('Machines & Services')).toHaveCount(0);
    await expect(aside.locator('a[href="/machines"]')).toHaveCount(0);

    // Verify machine management remains operational inside Users & Machines tab
    await aside.getByRole('link', { name: 'Users & Machines' }).click();
    await page.waitForURL('**/admin/users-machines');
    await expect(page.getByRole('heading', { name: 'Users & Machines Management' })).toBeVisible();
  });

  // PRIORITY 3 — Route Verification
  test('Priority 3: Root "/" renders promotional landing page, /dashboard routes correctly, and /login renders login page', async ({ page }) => {
    // 1. Root route "/" renders public promotional landing page without redirecting to login
    await page.goto('/');
    expect(page.url()).not.toContain('/login');
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.getByRole('heading', { name: /Smarter Harvesting\.\s*Better Farming\./i })).toBeVisible();

    // Public promotional landing page still contains Machines & Services link and promotional content
    await expect(page.locator('header').getByRole('link', { name: 'Machines' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Machine Management' })).toBeVisible();

    // 2. "/login" displays Login page
    await page.goto('/login');
    expect(new URL(page.url()).pathname).toBe('/login');
    await expect(page.getByRole('heading', { name: 'DhaanTrack' })).toBeVisible();
    await expect(page.locator('#toggle-password-visibility-btn')).toBeVisible();

    // 3. Unauthenticated "/dashboard" redirects to "/login"
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
