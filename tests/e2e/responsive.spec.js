import { test, expect } from '@playwright/test';

test.describe.serial('DhaanTrack Comprehensive Multi-Device Responsive Design Tests', () => {
  test('1. Mobile 360px Viewport — Admin Drawer, Stacked Cards, Touch Targets & Zero Overflow', async ({ page }) => {
    // Set viewport to 360px x 740px (Standard mobile width)
    await page.setViewportSize({ width: 360, height: 740 });

    // Login as Admin
    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // 1. Verify zero horizontal overflow on Dashboard at 360px
    const isOverflowingDashboard = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingDashboard).toBe(false);

    // 2. Verify Mobile Hamburger is visible and desktop sidebar is hidden
    const hamburger = page.locator('button[aria-label="Toggle navigation drawer"]');
    await expect(hamburger).toBeVisible();

    // 3. Open Navigation Drawer
    await hamburger.click();
    await expect(page.getByText('Admin Workspace')).toBeVisible();

    // 4. Navigate to Bookings / Works via Drawer
    await page.click('nav >> text=Bookings / Works');
    await page.waitForURL('**/admin/works');

    // 5. Verify Works Page has zero horizontal overflow at 360px
    const isOverflowingWorks = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingWorks).toBe(false);

    // 6. Verify desktop table is hidden on mobile
    const desktopTable = page.locator('table');
    await expect(desktopTable).toBeHidden();

    // 7. Open Drawer and navigate to Users & Machines
    await hamburger.click();
    await page.click('nav >> text=Users & Machines');
    await page.waitForURL('**/admin/users-machines');

    // 8. Verify Users & Machines has zero horizontal overflow at 360px
    const isOverflowingUsers = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingUsers).toBe(false);
    await expect(page.locator('table')).toBeHidden();

    // 9. Open Drawer and navigate to Expenses
    await hamburger.click();
    await page.click('nav >> text=Expenses');
    await page.waitForURL('**/admin/expenses');

    // 10. Verify Expenses has zero horizontal overflow at 360px
    const isOverflowingExpenses = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingExpenses).toBe(false);
    await expect(page.locator('table')).toBeHidden();
  });

  test('2. Mobile 390px Viewport — Operator App Experience, Live Timer & Calculators', async ({ page }) => {
    // Set viewport to 390px x 844px (iPhone 12/13/14)
    await page.setViewportSize({ width: 390, height: 844 });

    // Login as Operator
    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'operator1');
    await page.fill('input[type="password"]', 'Operator@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard');

    // 1. Verify app-like topbar with brand and machine info
    await expect(page.getByText('DhaanTrack')).toBeVisible();
    await expect(page.getByText('Assigned Harvester Machine')).toBeVisible();

    // 2. Check zero horizontal overflow on Operator Dashboard
    const isOverflowingOpDash = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingOpDash).toBe(false);

    // 3. Open Field Calculator
    await page.click('text=Field Estimate');
    await page.waitForURL('**/app/field-calculator');

    // Check zero horizontal overflow on Field Calculator
    const isOverflowingFieldCalc = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingFieldCalc).toBe(false);

    // Enter field dimensions
    await page.fill('input[placeholder="e.g. Ramesh Singh"]', 'Mobile Test Farmer');
    await page.fill('input[placeholder="10-digit number"]', '9876543210');
    await page.fill('input[placeholder="e.g. 16 or 32"]', '32');
    await page.fill('input[placeholder="Village, field sector or address"]', 'Sector 4 Paddy Field');

    // Verify expected quote banner
    await expect(page.getByText('Expected Customer Amount:')).toBeVisible();

    // 4. Navigate to Quick Calculator
    await page.goto('/app/quick-calculator');
    await page.waitForURL('**/app/quick-calculator');

    // Check zero horizontal overflow on Quick Calculator
    const isOverflowingQuickCalc = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingQuickCalc).toBe(false);
    await expect(page.getByText('Customer Total Amount')).toBeVisible();

    // 5. Navigate to Active Work Timer
    await page.goto('/app/timer');
    await page.waitForURL('**/app/timer');

    // Check zero horizontal overflow on Live Timer page
    const isOverflowingTimer = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingTimer).toBe(false);

    // Verify top-right profile button touch target (>= 44px)
    const profileBtn = page.locator('button[aria-label="Operator menu"]');
    await expect(profileBtn).toBeVisible();
    const box = await profileBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);

    // Open profile menu
    await profileBtn.click();
    await expect(page.getByRole('link', { name: 'Active Work Timer' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Work History' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('3. Tablet 768px Viewport — Responsive Scaling & Data Tables', async ({ page }) => {
    // Set viewport to 768px x 1024px (iPad Mini)
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // Check zero horizontal overflow
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);

    // Desktop table should be visible at >= 768px (md)
    await page.goto('/admin/works');
    await expect(page.locator('table')).toBeVisible();

    // Zero overflow on works table
    const isOverflowingWorks = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowingWorks).toBe(false);
  });

  test('4. Desktop 1440px Viewport — Full Sidebar & High-Density Tables', async ({ page }) => {
    // Set viewport to 1440px x 900px
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // Check full desktop sidebar is visible
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByText('Admin Workspace')).toBeVisible();

    // Check KPI Cards rendered
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.locator('span:has-text("Customer Revenue")').first()).toBeVisible();

    // Zero horizontal overflow on desktop
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);
  });
});
