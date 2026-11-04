import { test, expect } from '@playwright/test';

const RUN_ID = Date.now().toString().slice(-4);
const OPERATOR_USER_ID = `op${RUN_ID}`;
const MACHINE_NUMBER = `JD-${RUN_ID}`;

test.describe.serial('DhaanTrack Full-Stack End-to-End System Tests', () => {
  test('1. Admin Login, Dashboard Analytics, Profit Toggles & Navigation', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    // Verify login page branding
    await expect(page.locator('h2')).toContainText('DhaanTrack');

    // Fill Admin credentials
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin/dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await expect(page.locator('main h1')).toContainText('Admin Executive Dashboard');

    // Verify KPI Cards are rendered
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.locator('span:has-text("Customer Revenue")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Gross Profit")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Net Profit")').first()).toBeVisible();

    // Toggle Profit Mode between Gross and Net
    const netProfitBtn = page.getByRole('button', { name: /Show Net Profit/i });
    await netProfitBtn.click();
    await expect(page.getByText('NET PROFIT (Expenses Deducted)')).toBeVisible();

    const grossProfitBtn = page.getByRole('button', { name: /Show Gross Profit/i });
    await grossProfitBtn.click();
    await expect(page.getByText('GROSS PROFIT (Expenses Not Deducted)')).toBeVisible();
  });

  test('2. Combined Users & Machines Management', async ({ page }) => {
    // Login as Admin
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // Navigate to Users & Machines
    await page.click('nav >> text=Users & Machines');
    await page.waitForURL('**/admin/users-machines');
    await expect(page.locator('main h1')).toContainText('Users & Machines Management');

    // Create New Machine
    await page.click('button:has-text("Add Machine")');
    await expect(page.getByText('Add New Harvester Machine')).toBeVisible();

    await page.fill('input[placeholder="e.g. Kubota DC-68G"]', 'John Deere Harvester');
    await page.fill('input[placeholder="e.g. HARV-01"]', MACHINE_NUMBER);
    await page.fill('input[placeholder="2500"]', '2400');
    await page.fill('input[placeholder="1500"]', '1400');
    await page.click('button:has-text("Create Machine")');

    // Verify modal closes
    await expect(page.getByText('Add New Harvester Machine')).not.toBeVisible();

    // Create New Operator and assign the machine
    await page.click('button:has-text("Add User")');
    await expect(page.getByText('Add New Operator / User')).toBeVisible();

    await page.fill('input[placeholder="Operator\'s full name"]', 'Devendra Kumar');
    await page.fill('input[placeholder="Unique login ID"]', OPERATOR_USER_ID);
    await page.fill('input[placeholder="Min 8 characters"]', 'Password@123');
    await page.fill('input[placeholder="10-digit number"]', '9876543299');

    // Select assigned machine
    await page.selectOption('select[name="assignedMachine"]', { label: `John Deere Harvester (${MACHINE_NUMBER})` });
    await page.click('button:has-text("Create User")');

    // Verify operator appears in the visible table or card view
    await expect(page.getByText('Devendra Kumar').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(`@${OPERATOR_USER_ID}`).filter({ visible: true }).first()).toBeVisible();
  });

  test('3. Operator Workflow, Field Estimate & Persistent Timer', async ({ page }) => {
    // Login as the created Operator
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[placeholder*="admin or operator1"]', OPERATOR_USER_ID);
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    // Should redirect to Operator portal
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });
    await expect(page.getByText('Assigned Harvester Machine')).toBeVisible();

    // Verify Operator is prevented from accessing Admin routes
    await page.goto('/admin/dashboard');
    // ProtectedRoute will redirect back to /app/dashboard
    await page.waitForURL('**/app/dashboard');

    // Navigate to Field Calculator
    await page.click('text=Field Estimate');
    await page.waitForURL('**/app/field-calculator');

    // Enter field details
    await page.fill('input[placeholder="e.g. Ramesh Singh"]', 'Farmer Ramdas');
    await page.fill('input[placeholder="10-digit number"]', '9811223344');
    await page.fill('input[placeholder="e.g. 16 or 32"]', '32'); // 32 Katha = 1 Acre
    await page.fill('input[placeholder="Village, field sector or address"]', 'West Paddy Sector 12');

    // Verify calculated quote preview is visible
    await expect(page.getByText('Expected Customer Amount:')).toBeVisible();

    // Click "Book Field & Open Timer"
    await page.click('button:has-text("Book Field & Open Timer")');
    await page.waitForURL('**/app/timer');

    // Start work
    await page.click('button:has-text("Start Work")');
    await expect(page.getByText('Farmer Ramdas').first()).toBeVisible();

    // Verify timer is running and persists across page reload!
    await page.reload();
    await expect(page.getByText('Farmer Ramdas').first()).toBeVisible();
    await expect(page.locator('button:has-text("Pause")')).toBeVisible();

    // Pause work
    await page.click('button:has-text("Pause")');
    await expect(page.getByText('TIMER PAUSED')).toBeVisible();
    await expect(page.locator('button:has-text("Resume")')).toBeVisible();

    // Resume work
    await page.click('button:has-text("Resume")');
    await expect(page.locator('button:has-text("Pause")')).toBeVisible();

    // Complete work (auto-accept confirmation dialog)
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("Complete")');

    // Verify work completion banner and auto-opened payment modal
    await expect(page.getByText('Work Completed Successfully!')).toBeVisible();
    await expect(page.getByText('Record Customer Payment')).toBeVisible();
    await page.fill('input[placeholder="0.00"]', '500');
    await page.click('form button[type="submit"]:has-text("Record Payment")');

    // Navigate to Quick Calculator and test instant calculation
    await page.goto('/app/quick-calculator');
    await expect(page.locator('h1')).toContainText('Quick Time & Billing Calculator');
    await page.click('button:has-text("Method 2: Start / End Time")');
    await expect(page.getByText('Calculated Time Elapsed:')).toBeVisible();
  });
});
