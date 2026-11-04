import { test, expect } from '@playwright/test';

// Unique IDs for isolated parallel-safe execution
const RUN_ID = Date.now().toString().slice(-4);
const USER_A_ID = `usr_a_${RUN_ID}`;
const USER_B_ID = `usr_b_${RUN_ID}`;
const USER_A_NAME = `Ramesh Operator ${RUN_ID}`;
const USER_B_NAME = `Suresh Operator ${RUN_ID}`;
const CUSTOMER_NAME = `Kisan Ramphal ${RUN_ID}`;
const CUSTOMER_MOBILE = `97531${RUN_ID.padStart(5, '0')}`; // exactly 10 digits
const LOCAL_AREA = `Paddy Sector 9, Village Rampur`;
const REMARK_TEXT = `Wheat harvesting planned for 5 acres field`;

test.describe.serial('DhaanTrack Customer Management, Dynamic Sharing & Priority Lifecycle E2E', () => {
  test('1. Setup Operators: Admin creates User A and User B', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    // Login as Admin
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // Navigate to Users & Machines
    await page.click('nav >> text=Users & Machines');
    await page.waitForURL('**/admin/users-machines');
    await expect(page.locator('main h1')).toContainText('Users & Machines Management');

    // Create User A
    await page.click('button:has-text("Add User")');
    await expect(page.getByText('Add New Operator / User')).toBeVisible();
    await page.fill('input[placeholder="Operator\'s full name"]', USER_A_NAME);
    await page.fill('input[placeholder="Unique login ID"]', USER_A_ID);
    await page.fill('input[placeholder="Min 8 characters"]', 'Password@123');
    await page.fill('input[placeholder="10-digit number"]', `91111${RUN_ID.padStart(5, '0')}`);
    await page.click('button:has-text("Create User")');
    await expect(page.getByText('Add New Operator / User')).not.toBeVisible();

    // Create User B
    await page.click('button:has-text("Add User")');
    await expect(page.getByText('Add New Operator / User')).toBeVisible();
    await page.fill('input[placeholder="Operator\'s full name"]', USER_B_NAME);
    await page.fill('input[placeholder="Unique login ID"]', USER_B_ID);
    await page.fill('input[placeholder="Min 8 characters"]', 'Password@123');
    await page.fill('input[placeholder="10-digit number"]', `92222${RUN_ID.padStart(5, '0')}`);
    await page.click('button:has-text("Create User")');
    await expect(page.getByText('Add New Operator / User')).not.toBeVisible();

    // Verify both operators are listed in visible DOM
    await expect(page.getByText(USER_A_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(USER_B_NAME).filter({ visible: true }).first()).toBeVisible();
  });

  test('2. User A: Dropdown Availability, Validation, Real-Time Priority, Creation, Immediate Visibility & Duplicate Rejection', async ({ page }) => {
    await page.context().clearCookies();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/login');

    // Login as User A
    await page.fill('input[placeholder*="admin or operator1"]', USER_A_ID);
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // Navigate to Customers & Leads
    await page.click('text=Customers & Leads');
    await page.waitForURL('**/app/customers');
    await expect(page.locator('h1')).toContainText('Customers & Leads');

    // Open Add Customer Modal
    await page.click('button:has-text("Add Customer")');
    await expect(page.getByRole('heading', { name: 'Add New Customer' })).toBeVisible();

    // 1. Form Validation checks
    await page.click('form button[type="submit"]');
    await expect(page.getByText('Customer name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Mobile number must be exactly 10 digits')).toBeVisible();

    // Enter invalid mobile (9 digits)
    await page.fill('input[placeholder="10-digit mobile number"]', '987654321');
    await page.click('form button[type="submit"]');
    await expect(page.getByText('Mobile number must be exactly 10 digits')).toBeVisible();

    // 2. Real-Time Priority Preview Badge tests
    const landAreaInput = page.locator('input[placeholder="e.g. 5.5"]');
    
    // Test < 2.0 Acre -> LOW
    await landAreaInput.fill('1.5');
    await expect(page.getByText(/LOW PRIORITY/i)).toBeVisible();

    // Test 2.0 - 4.9 Acre -> MEDIUM
    await landAreaInput.fill('3.5');
    await expect(page.getByText(/MEDIUM PRIORITY/i)).toBeVisible();

    // Test >= 5.0 Acre -> HIGH
    await landAreaInput.fill('6.0');
    await expect(page.getByText(/HIGH PRIORITY/i)).toBeVisible();

    // 3. Dynamic User Dropdown Verification
    // Verify User B is dynamically listed in the sharing list
    await expect(page.getByText(USER_B_NAME)).toBeVisible();
    // Verify User A is NOT listed (logged-in user excluded)
    await expect(page.locator('.max-h-40').getByText(`@${USER_A_ID}`)).toHaveCount(0);

    // Test search filter in sharing dropdown
    const userSearchInput = page.locator('input[placeholder*="Search operators by name"]');
    await userSearchInput.fill(USER_B_ID);
    await expect(page.getByText(USER_B_NAME)).toBeVisible();

    // Select User B for sharing
    await page.click(`text=${USER_B_NAME}`);
    await expect(page.getByText('1 selected')).toBeVisible();

    // Fill valid customer details
    await page.fill('input[placeholder="e.g. Ramesh Patel"]', CUSTOMER_NAME);
    await page.fill('input[placeholder="10-digit mobile number"]', CUSTOMER_MOBILE);
    await page.fill('input[placeholder="e.g. Rampur, Plot No. 4"]', LOCAL_AREA);
    await landAreaInput.fill('6.5'); // High priority
    await page.fill('textarea[placeholder*="wheat cutting"]', REMARK_TEXT);

    // Submit customer
    await page.click('form button[type="submit"]');

    // 4. Verify Immediate Frontend Visibility without manual refresh
    await expect(page.getByRole('heading', { name: 'Add New Customer' })).not.toBeVisible();
    await expect(page.getByText('Customer saved and shared successfully.')).toBeVisible();

    // Customer card appears immediately in the DOM
    await expect(page.getByText(CUSTOMER_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(CUSTOMER_MOBILE).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(LOCAL_AREA).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('6.5 Acre').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('HIGH').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('#1').filter({ visible: true }).first()).toBeVisible(); // Dynamic Rank #1

    // Verify Call & Copy mobile buttons exist
    await expect(page.locator(`a[href="tel:${CUSTOMER_MOBILE}"]`).filter({ visible: true }).first()).toBeVisible();
    const copyBtn = page.getByRole('button', { name: /Copy/i }).filter({ visible: true }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText('Copied').filter({ visible: true }).first()).toBeVisible();

    // 5. Test Duplicate Mobile Rejection
    await page.click('button:has-text("Add Customer")');
    await expect(page.getByRole('heading', { name: 'Add New Customer' })).toBeVisible();
    await page.fill('input[placeholder="e.g. Ramesh Patel"]', 'Duplicate Kisan');
    await page.fill('input[placeholder="10-digit mobile number"]', CUSTOMER_MOBILE);
    await page.fill('input[placeholder="e.g. Rampur, Plot No. 4"]', 'Sector 10');
    await page.fill('input[placeholder="e.g. 5.5"]', '2.5');
    await page.click('form button[type="submit"]');

    // Verify duplicate error alert
    await expect(page.getByText(/already exists/i)).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.getByRole('heading', { name: 'Add New Customer' })).not.toBeVisible();
  });

  test('3. User B: In-App Notification, Copy, View Customer, Edit Acreage & Dynamic Priority Update', async ({ page }) => {
    await page.context().clearCookies();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/login');

    // Login as User B (recipient)
    await page.fill('input[placeholder*="admin or operator1"]', USER_B_ID);
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // Verify notification bell has unread badge
    const bellBtn = page.locator('button[aria-label="View notifications"]');
    await expect(bellBtn).toBeVisible();
    await expect(bellBtn.locator('span')).toContainText('1');

    // Open Notification Drawer
    await bellBtn.click();
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();

    // Verify notification card details
    await expect(page.getByText(USER_A_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(CUSTOMER_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(CUSTOMER_MOBILE).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('6.5 Acre').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('HIGH').filter({ visible: true }).first()).toBeVisible();

    // Verify notification action: Copy number
    const copyBtn = page.locator('.bg-white button:has-text("Copy")').filter({ visible: true }).first();
    await copyBtn.click();
    await expect(page.getByText('Copied!').filter({ visible: true }).first()).toBeVisible();

    // Verify notification action: Mark as Read
    const markReadBtn = page.locator('button:has-text("Mark read")').filter({ visible: true }).first();
    await markReadBtn.click();
    await expect(markReadBtn).not.toBeVisible();

    // Click "View Customer" to navigate to customer record
    await page.click('button:has-text("View Customer")');
    await page.waitForURL('**/app/customers*');

    // Customer record is visible for User B
    await expect(page.getByText(CUSTOMER_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(CUSTOMER_MOBILE).filter({ visible: true }).first()).toBeVisible();

    // Edit customer acreage (Test dynamic priority recalculation)
    await page.locator('button:has-text("Edit")').filter({ visible: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Edit Customer' })).toBeVisible();

    // Verify prefilled acreage is 6.5
    const landInput = page.locator('input[placeholder="e.g. 5.5"]');
    await expect(landInput).toHaveValue('6.5');
    await expect(page.getByText(/HIGH PRIORITY/i)).toBeVisible();

    // Change acreage to 1.2 Acre (< 2 Acre -> LOW Priority)
    await landInput.fill('1.2');
    await expect(page.getByText(/LOW PRIORITY/i)).toBeVisible();

    // Save changes
    await page.click('form button[type="submit"]');

    // Verify updated values in card
    await expect(page.getByRole('heading', { name: 'Edit Customer' })).not.toBeVisible();
    await expect(page.getByText('Customer details updated successfully.')).toBeVisible();
    await expect(page.getByText('1.2 Acre').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('LOW').filter({ visible: true }).first()).toBeVisible();

    // Verify Operator has NO Delete button (strictly prohibited)
    await expect(page.locator('button:has-text("Delete")')).toHaveCount(0);
  });

  test('4. Admin: Global Visibility, Priority Filtering, Sorting, Soft Delete to Recycle Bin & Complete Restore', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    // Login as Admin
    await page.fill('input[placeholder*="admin or operator1"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@DhaanTrack2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // Navigate to Users & Machines and switch to Customers tab
    await page.click('nav >> text=Users & Machines');
    await page.waitForURL('**/admin/users-machines');
    await page.click('button:has-text("Customers & Leads")');

    // Verify Admin sees customer in central table
    await expect(page.getByText(CUSTOMER_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(CUSTOMER_MOBILE).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('1.2 Acre').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('LOW').filter({ visible: true }).first()).toBeVisible();

    // Test Priority Filter: Click "High (≥ 5 Acre)"
    await page.click('button:has-text("High (≥ 5 Acre)")');
    // Customer has 1.2 Acre, so should be filtered out
    await expect(page.locator('tbody').getByText(CUSTOMER_NAME)).toHaveCount(0);

    // Click "Low (< 2 Acre)"
    await page.click('button:has-text("Low (< 2 Acre)")');
    // Customer is visible
    await expect(page.locator('tbody').getByText(CUSTOMER_NAME)).toBeVisible();

    // Reset to "All Priorities"
    await page.click('button:has-text("All Priorities")');
    await expect(page.locator('tbody').getByText(CUSTOMER_NAME)).toBeVisible();

    // Test Admin Delete -> soft delete to Recycle Bin
    page.once('dialog', (dialog) => dialog.accept());
    const customerRow = page.locator('tr').filter({ hasText: CUSTOMER_NAME });
    const deleteBtn = customerRow.locator('button[title*="Recycle Bin"]');
    await deleteBtn.click();

    // Verify feedback alert and customer removed from active table
    await expect(page.getByText(/moved to Recycle Bin successfully/i)).toBeVisible();
    await expect(page.locator('tbody').getByText(CUSTOMER_NAME)).toHaveCount(0);

    // Navigate to Recycle Bin
    await page.click('a[href="/admin/recycle-bin"]');
    await page.waitForURL('**/admin/recycle-bin');
    await expect(page.locator('main h1')).toContainText('Deleted Records / Recycle Bin');

    // Switch to Customers category tab
    await page.click('button:has-text("Customers")');

    // Verify deleted customer is in the Recycle Bin with its metadata
    await expect(page.getByText(CUSTOMER_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(CUSTOMER_MOBILE).filter({ visible: true }).first()).toBeVisible();

    // Restore customer
    const binRow = page.locator('tr').filter({ hasText: CUSTOMER_NAME });
    await binRow.locator('button:has-text("Restore")').click();
    await expect(page.getByText(/restored.*successfully/i)).toBeVisible();

    // Navigate back to Users & Machines Customers tab
    await page.click('nav >> text=Users & Machines');
    await page.waitForURL('**/admin/users-machines');
    await page.click('button:has-text("Customers & Leads")');

    // Customer is back in active list with restored data!
    await expect(page.getByText(CUSTOMER_NAME).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('1.2 Acre').filter({ visible: true }).first()).toBeVisible();
  });
});
