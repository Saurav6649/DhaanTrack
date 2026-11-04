import { test, expect } from '@playwright/test';

test.describe.serial('Recycle Bin & New UI Enhancements E2E Tests', () => {
  test('1. Admin Recycle Bin Navigation, Category Tabs & Modals', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // Navigate to Recycle Bin via link
    await page.click('a[href="/admin/recycle-bin"]');
    await page.waitForURL('**/admin/recycle-bin');
    await expect(page.locator('main h1')).toContainText('Deleted Records / Recycle Bin');

    // Verify all 5 category tabs exist
    await expect(page.getByRole('button', { name: /Work History/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Expenses/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Payments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Machines/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Users/i })).toBeVisible();

    // Verify Search and Permanent Delete controls
    await expect(page.getByPlaceholder(/Search deleted records/i)).toBeVisible();
  });

  test('2. Admin Reports Page with KPI Cards, Charts & Advanced Filters', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // Navigate to Reports & Export
    await page.click('a[href="/admin/reports"]');
    await page.waitForURL('**/admin/reports');
    await expect(page.locator('main h1')).toContainText('Reports & Business Analytics');

    // Verify KPI summary cards
    await expect(page.getByText('Total Revenue').first()).toBeVisible();
    await expect(page.getByText('Total Hours').first()).toBeVisible();
    await expect(page.getByText('Contractor Cost').first()).toBeVisible();
    await expect(page.getByText('Gross Profit').first()).toBeVisible();
    await expect(page.getByText('Net Profit').first()).toBeVisible();

    // Verify Advanced Filters Toolbar
    await expect(page.getByText('Advanced Filters')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();

    // Verify interactive trend chart title
    await expect(page.getByText('Daily Financial & Operational Trend')).toBeVisible();
  });

  test('3. Operator Panel: BackButton, Dynamic Rates, Hidden Password, and Quick Action FAB', async ({ page }) => {
    // Login as operator
    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'operator1');
    await page.fill('input[type="password"]', 'Operator@123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // Verify floating "+ New Work" FAB button exists on dashboard
    const fab = page.locator('a[aria-label="Create new harvesting work"]');
    await expect(fab).toBeVisible();
    await expect(fab).toContainText('+ New Work');

    // Navigate to Profile page
    await page.goto('/app/profile');
    await expect(page.locator('main h1')).toContainText('Operator Profile');

    // Verify BackButton is rendered and clickable
    await expect(page.locator('button[aria-label="Go back to previous screen"]')).toBeVisible();

    // Verify Password Change form is REMOVED from Operator Profile
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.getByText('Account Security Managed by Admin')).toBeVisible();

    // Click BackButton to return to dashboard
    await page.click('button[aria-label="Go back to previous screen"]');
    await page.waitForURL('**/app/dashboard');

    // Navigate to Field Calculator
    await page.goto('/app/field-calculator');
    await expect(page.locator('main h1')).toContainText('Field Estimate Calculator');

    // Verify BackButton exists
    await expect(page.locator('button[aria-label="Go back to previous screen"]')).toBeVisible();

    // Verify Dynamic Rate is shown
    await expect(page.getByText(/Rate: ₹/)).toBeVisible();

    // Verify Contractor share & Gross/Net profit are strictly hidden from Operator
    await expect(page.getByText(/Contractor Share/i)).toHaveCount(0);
    await expect(page.getByText(/Gross Profit/i)).toHaveCount(0);
    await expect(page.getByText(/Net Profit/i)).toHaveCount(0);

    // Check Operator Expenses page for BackButton and Add button
    await page.goto('/app/expenses');
    await expect(page.locator('main h1')).toContainText('Operator Expenses');
    await expect(page.locator('button[aria-label="Go back to previous screen"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Expense/i })).toBeVisible();
  });
});
