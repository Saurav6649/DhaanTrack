import { test, expect } from '@playwright/test';

const RUN_ID = Date.now().toString().slice(-4);
const OPERATOR_ID = `op_dash_${RUN_ID}`;
const OPERATOR_NAME = `Operator Rajesh ${RUN_ID}`;
const PENDING_CUSTOMER = `Raju Mahto ${RUN_ID}`;
const COMPLETED_CUSTOMER = `Sanjay Kumar ${RUN_ID}`;
const IN_PROGRESS_CUSTOMER = `Vikram Singh ${RUN_ID}`;

test.describe.serial('DhaanTrack Dashboard UX Enhancement & Bug Fixes E2E', () => {
  test('1. Setup Machine and Operator Account via Admin', async ({ page }) => {
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

    // Create New Machine
    const MACHINE_NUMBER = `HRV-${RUN_ID}`;
    await page.click('button:has-text("Add Machine")');
    await expect(page.getByText('Add New Harvester Machine')).toBeVisible();
    await page.fill('input[placeholder="e.g. Kubota DC-68G"]', 'Kubota Harvester');
    await page.fill('input[placeholder="e.g. HARV-01"]', MACHINE_NUMBER);
    await page.fill('input[placeholder="2500"]', '2500');
    await page.fill('input[placeholder="1500"]', '1500');
    await page.click('button:has-text("Create Machine")');
    await expect(page.getByText('Add New Harvester Machine')).not.toBeVisible();

    // Create New Operator with assigned machine
    await page.click('button:has-text("Add User")');
    await expect(page.getByText('Add New Operator / User')).toBeVisible();
    await page.fill('input[placeholder="Operator\'s full name"]', OPERATOR_NAME);
    await page.fill('input[placeholder="Unique login ID"]', OPERATOR_ID);
    await page.fill('input[placeholder="Min 8 characters"]', 'Password@123');
    await page.fill('input[placeholder="10-digit number"]', `98888${RUN_ID.padStart(5, '0')}`);
    await page.selectOption('select[name="assignedMachine"]', { label: `Kubota Harvester (${MACHINE_NUMBER})` });
    await page.click('button:has-text("Create User")');
    await expect(page.getByText('Add New Operator / User')).not.toBeVisible();

    // Verify operator is created in list
    await expect(page.getByText(OPERATOR_NAME).filter({ visible: true }).first()).toBeVisible();
  });

  test('2. BUG 1 & ENHANCEMENT 2: New Work Button Visibility, Centering, Animations & Reduced Motion', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    // Login as Operator
    await page.fill('input[placeholder*="admin or operator1"]', OPERATOR_ID);
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // --- A. Button is visible on Dashboard ---
    const fabLink = page.locator('a[aria-label="Create new harvesting work"]');
    await expect(fabLink).toBeVisible();
    await expect(fabLink).toContainText('+ New Work');

    // --- B. Button is Horizontally Centered ---
    const fabBox = await fabLink.boundingBox();
    const viewportSize = page.viewportSize();
    expect(fabBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    const buttonCenterX = fabBox.x + fabBox.width / 2;
    const screenCenterX = viewportSize.width / 2;
    // Verify horizontal alignment is centered within 10px margin of error
    expect(Math.abs(buttonCenterX - screenCenterX)).toBeLessThanOrEqual(10);

    // --- C. Animation Requirements Verified ---
    // 1. Smooth floating animation wrapper
    const floatWrapper = page.locator('.fab-float-anim');
    await expect(floatWrapper).toBeVisible();

    // 2. Bright green animated glow
    await expect(fabLink).toHaveClass(/fab-glow-anim/);

    // 3. Pulsing neon green outer ring
    const pulseRing = page.locator('.fab-ring-anim');
    await expect(pulseRing).toBeVisible();

    // 4. Smooth animated shine sweep overlay
    const shineOverlay = page.locator('.fab-shine-anim');
    await expect(shineOverlay).toBeVisible();

    // 5. Animated Plus icon
    const plusIconContainer = page.locator('.fab-icon-anim');
    await expect(plusIconContainer).toBeVisible();

    // 6. Hover effects (scale-up, shadow classes)
    await expect(fabLink).toHaveClass(/hover:scale-105/);
    await expect(fabLink).toHaveClass(/active:scale-95/);

    // --- D. Respect prefers-reduced-motion Accessibility ---
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const computedAnimation = await fabLink.evaluate((el) => window.getComputedStyle(el).animationName);
    // Under reduced motion, CSS media query overrides animation to 'none'
    expect(computedAnimation === 'none' || computedAnimation === '').toBeTruthy();
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // --- E. Hidden on ALL Inner Pages ---
    const innerRoutes = [
      '/app/payments',
      '/app/customers',
      '/app/expenses',
      '/app/profile',
      '/app/history/work',
      '/app/history/expense',
      '/app/field-calculator',
      '/app/quick-calculator',
      '/app/today-works',
    ];

    for (const route of innerRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      // Floating button MUST be hidden on every inner page
      await expect(page.locator('a[aria-label="Create new harvesting work"]')).toHaveCount(0);
    }

    // Return to dashboard and verify it reappears
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard');
    await expect(page.locator('a[aria-label="Create new harvesting work"]')).toBeVisible();

    // --- F. Clicking opens existing New Work form ---
    await page.locator('a[aria-label="Create new harvesting work"]').click({ force: true });
    await page.waitForURL('**/app/field-calculator');
    await expect(page.locator('main h1')).toContainText('Field Estimate Calculator');
  });

  test('3. Create Test Works: Raju Mahto (Pending) and Sanjay Kumar (Completed)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    // Login as Operator
    await page.fill('input[placeholder*="admin or operator1"]', OPERATOR_ID);
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // --- Create Work 1: Raju Mahto (Status: PENDING) ---
    await page.goto('/app/field-calculator');
    await page.waitForURL('**/app/field-calculator');
    await page.fill('input[placeholder="e.g. Ramesh Singh"]', PENDING_CUSTOMER);
    await page.fill('input[placeholder="10-digit number"]', `98111${RUN_ID.padStart(5, '0')}`);
    await page.fill('input[placeholder="e.g. 16 or 32"]', '16');
    await page.fill('input[placeholder="Village, field sector or address"]', 'Rampur North Sector');
    await page.click('button:has-text("Book Field & Create Work")');
    await expect(page.getByText('Work Booking Created Successfully!')).toBeVisible();

    // Return to dashboard without starting timer (remains PENDING)
    await page.click('button:has-text("Book Another Field")');
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard');

    // Verify Raju Mahto is visible on Dashboard with PENDING badge
    await expect(page.getByText(PENDING_CUSTOMER)).toBeVisible();
    await expect(page.getByText('PENDING').first()).toBeVisible();

    // --- Create Work 2: Sanjay Kumar (Status: COMPLETED) ---
    await page.goto('/app/field-calculator');
    await page.waitForURL('**/app/field-calculator');
    await page.fill('input[placeholder="e.g. Ramesh Singh"]', COMPLETED_CUSTOMER);
    await page.fill('input[placeholder="10-digit number"]', `98222${RUN_ID.padStart(5, '0')}`);
    await page.fill('input[placeholder="e.g. 16 or 32"]', '20');
    await page.fill('input[placeholder="Village, field sector or address"]', 'Kisan Nagar Plot 5');
    await page.click('button:has-text("Book Field & Create Work")');
    await expect(page.getByText('Work Booking Created Successfully!')).toBeVisible();

    // Start Timer for Sanjay Kumar
    await page.click('button:has-text("Start Timer Now")');
    await page.waitForURL('**/app/timer');

    // Start the pending work
    const startBtn = page.locator('button:has-text("Start")').first();
    await startBtn.click();
    await expect(page.getByText(COMPLETED_CUSTOMER).first()).toBeVisible();

    // Let timer tick briefly, then Complete work
    await page.waitForTimeout(1000);
    page.once('dialog', (d) => d.accept());
    await page.click('button:has-text("Complete")');

    // Verify Record Payment modal opens on completion
    await expect(page.getByRole('heading', { name: 'Record Customer Payment' })).toBeVisible();
    await page.click('button[aria-label="Close dialog"]');
    await expect(page.getByRole('heading', { name: 'Record Customer Payment' })).not.toBeVisible();

    // Return to Dashboard
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard');

    // PART 1 VERIFIED: Today's Works displays ONLY Pending & Running works. Completed works are excluded from Today's Works!
    await expect(page.getByText(PENDING_CUSTOMER)).toBeVisible();
    await expect(page.locator('.space-y-2\\.5').getByText(COMPLETED_CUSTOMER)).toHaveCount(0);

    // Verify Completed works are safely preserved and accessible in "View All Cards"
    await page.click('text=View All Cards');
    await page.waitForURL('**/app/today-works');
    await expect(page.getByText(COMPLETED_CUSTOMER)).toBeVisible();
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard');
  });

  test('4. BUG 3: Entire Dashboard Work Card is Clickable with Hover, Cursor & Keyboard Accessibility', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    // Login as Operator
    await page.fill('input[placeholder*="admin or operator1"]', OPERATOR_ID);
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // Locate Raju Mahto card
    const rajuCard = page.locator('[role="button"]').filter({ hasText: PENDING_CUSTOMER }).first();
    await expect(rajuCard).toBeVisible();

    // Verify cursor: pointer on desktop
    const cursor = await rajuCard.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');

    // Verify visual navigation arrow indicator exists inside card
    const arrowIndicator = rajuCard.locator('[data-nav-arrow="true"]');
    await expect(arrowIndicator).toBeVisible();

    // --- Test 1: Clicking anywhere inside Raju Mahto card navigates to Work Details (Timer) ---
    await rajuCard.click({ position: { x: 30, y: 20 } }); // Click title/top-left area
    await page.waitForURL('**/app/timer');
    await expect(page.locator('main h1')).toContainText('Active Work Timer');

    // Return to dashboard
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard');

    // --- Test 2: Clicking visual arrow icon also navigates to Work Details ---
    const activeCard = page.locator('[role="button"]').filter({ hasText: PENDING_CUSTOMER }).first();
    const arrow = activeCard.locator('[data-nav-arrow="true"]');
    await arrow.click();
    await page.waitForURL('**/app/timer');
    await expect(page.locator('main h1')).toContainText('Active Work Timer');

    // Return to dashboard
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard');

    // --- Test 3: Keyboard accessibility: Focusing card and pressing Enter navigates ---
    const cardToFocus = page.locator('[role="button"]').filter({ hasText: PENDING_CUSTOMER }).first();
    await cardToFocus.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/app/timer');
    await expect(page.locator('main h1')).toContainText('Active Work Timer');
  });

  test('5. BUG 4: Customer Payment Receipts Must Show ONLY Completed Work', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    // Login as Operator
    await page.fill('input[placeholder*="admin or operator1"]', OPERATOR_ID);
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // On Dashboard: Raju Mahto (PENDING) is visible; Sanjay Kumar (COMPLETED) is excluded from Today's Works
    await expect(page.getByText(PENDING_CUSTOMER)).toBeVisible();
    await expect(page.locator('.space-y-2\\.5').getByText(COMPLETED_CUSTOMER)).toHaveCount(0);

    // Navigate to Customer Payment Receipts
    await page.click('text=Record Payment');
    await page.waitForURL('**/app/payments');
    await expect(page.locator('main h1')).toContainText('Customer Payment Receipts');

    // --- VERIFY CRITICAL BUSINESS LOGIC ---
    // 1. Pending work MUST NOT appear in Customer Payment Receipts
    await expect(page.getByText(PENDING_CUSTOMER)).toHaveCount(0);

    // 2. Completed work MUST appear in Customer Payment Receipts
    await expect(page.getByText(COMPLETED_CUSTOMER)).toBeVisible();

    // 3. Record a payment for Sanjay Kumar (Completed work)
    const sanjayPaymentCard = page.locator('.space-y-3 > div').filter({ hasText: COMPLETED_CUSTOMER }).first();
    await expect(sanjayPaymentCard).toBeVisible();
    await sanjayPaymentCard.locator('button:has-text("Record Payment")').click();

    // Verify Record Payment Modal opens
    await expect(page.getByRole('heading', { name: 'Record Customer Payment' })).toBeVisible();
    await page.click('form button[type="submit"]');
    await expect(page.getByText('Customer payment recorded successfully!')).toBeVisible();

    // Wait for Record Payment Modal to auto-close after success timeout
    await expect(page.getByRole('heading', { name: 'Record Customer Payment' })).not.toBeVisible();

    // 4. Verify Completed partially/fully paid work STILL appears in Customer Payment Receipts
    await expect(page.locator('h3', { hasText: COMPLETED_CUSTOMER })).toBeVisible();

    // 5. Verify Pending work is STILL hidden
    await expect(page.getByText(PENDING_CUSTOMER)).toHaveCount(0);

    // 6. Return to Dashboard and verify Pending work is STILL intact in database and visible in Today's Works
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard');
    await expect(page.getByText(PENDING_CUSTOMER)).toBeVisible();
    await expect(page.locator('.space-y-2\\.5').getByText(COMPLETED_CUSTOMER)).toHaveCount(0);
  });
});
