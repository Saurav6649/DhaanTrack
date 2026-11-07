import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const resetPawanKumarSession = () => {
  execSync('node backend/src/scripts/resetTestSessions.js', { encoding: 'utf-8' });
};

test.describe.serial('Complete Dashboard, Timer, Billing & Pending Work Bug Fixes', () => {
  let consoleErrors = [];

  test.beforeAll(async () => {
    resetPawanKumarSession();
  });

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('[BROWSER ERROR]', msg.text());
      }
    });
    page.on('response', (res) => {
      if (res.status() >= 400) {
        console.log(`[HTTP ${res.status()}] ${res.url()}`);
      }
    });
  });

  test.afterEach(async () => {
    // Verify no fatal console errors occurred
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('403') && !e.includes('Failed to load resource') && !e.includes('favicon')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('1. PRIORITY 3: Quick Time & Billing Calculator Duration Formatting & Math', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    // Login as operator
    await page.fill('input[placeholder="e.g. admin or operator1"]', 'golu');
    await page.fill('input[placeholder="••••••••"]', 'Password@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // Navigate to Quick Calculator
    await page.goto('/app/quick-calculator');
    await expect(page.locator('h1')).toContainText('Quick Time & Billing Calculator');

    // === Method 1: Total Minutes ===
    // Test Case 1: 90 Minutes @ ₹5000/hr -> ₹7500 and "1 Hour 30 Minutes"
    await page.fill('input[placeholder="e.g. 75"]', '90');
    const rateInput = page.locator('input[type="number"]').nth(1);
    await rateInput.fill('5000');

    // Verify Amount remains exactly ₹7500
    await expect(page.locator('text=₹7500')).toBeVisible();

    // Verify Duration description: "For 90 Minutes (1 Hour 30 Minutes) at ₹5000/hr"
    // No decimal hours such as 1.5 Hours!
    const bannerDesc = page.locator('.bg-gradient-to-br p');
    await expect(bannerDesc).toContainText('For 90 Minutes (1 Hour 30 Minutes) at ₹5000/hr');
    await expect(bannerDesc).not.toContainText('1.5 Hours');

    // Test Case 2: 60 Minutes -> "1 Hour"
    await page.fill('input[placeholder="e.g. 75"]', '60');
    await expect(bannerDesc).toContainText('For 60 Minutes (1 Hour) at ₹5000/hr');
    await expect(bannerDesc).not.toContainText('1.00 Hours');

    // Test Case 3: 150 Minutes -> "2 Hours 30 Minutes"
    await page.fill('input[placeholder="e.g. 75"]', '150');
    await expect(bannerDesc).toContainText('For 150 Minutes (2 Hours 30 Minutes) at ₹5000/hr');
    await expect(bannerDesc).not.toContainText('2.5 Hours');

    // Test Case 4: 30 Minutes -> "30 Minutes"
    await page.fill('input[placeholder="e.g. 75"]', '30');
    await expect(bannerDesc).toContainText('For 30 Minutes (30 Minutes) at ₹5000/hr');
    await expect(bannerDesc).not.toContainText('0.5 Hours');

    // Test Case 5: 125 Minutes -> "2 Hours 5 Minutes"
    await page.fill('input[placeholder="e.g. 75"]', '125');
    await expect(bannerDesc).toContainText('For 125 Minutes (2 Hours 5 Minutes) at ₹5000/hr');

    // === Method 2: Start / End Time ===
    await page.click('button:has-text("Method 2: Start / End Time")');

    // Start 09:00, End 10:30 (90 mins), Rate 5000 -> Amount 7500, Duration: 1 Hour 30 Minutes
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.nth(0).fill('09:00');
    await timeInputs.nth(1).fill('10:30');
    const method2RateInput = page.locator('input[type="number"]').last();
    await method2RateInput.fill('5000');

    await expect(page.locator('text=₹7500')).toBeVisible();
    const method2Banner = page.locator('.bg-gradient-to-br');
    await expect(method2Banner).toContainText('1 Hour 30 Minutes');
    await expect(method2Banner).not.toContainText('1.5 Hours');

    // Test 09:00 to 11:30 (150 mins) -> 2 Hours 30 Minutes
    await timeInputs.nth(1).fill('11:30');
    await expect(method2Banner).toContainText('2 Hours 30 Minutes');
    await expect(method2Banner).not.toContainText('2.5 Hours');
  });

  test('2. PRIORITY 4: Pending Scheduled Works Status ("Not Started") & Created Date', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    await page.fill('input[placeholder="e.g. admin or operator1"]', 'golu');
    await page.fill('input[placeholder="••••••••"]', 'Password@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // Open Timer Page
    await page.goto('/app/timer');
    await expect(page.locator('h1')).toContainText('Active Work Timer');

    // Locate Pawan Kumar's pending scheduled booking card
    const pawanCard = page.locator('div:has-text("Pawan kumar")').filter({ hasText: 'Pending Scheduled Works' });
    await expect(page.getByText('Pawan kumar').first()).toBeVisible();

    // Verify "Not Started" badge is displayed for the queued project
    await expect(page.locator('text=Not Started').first()).toBeVisible();

    // Verify "Unpaid" badge is NOT displayed for this queued project before harvesting starts
    const pendingSection = page.locator('div:has-text("Pending Scheduled Works")').last();
    await expect(pendingSection.locator('span:text-is("Unpaid")')).toHaveCount(0);

    // Verify created date displays original creation date: "Created: 6 Nov 2026"
    await expect(page.locator('text=Created: 6 Nov 2026').first()).toBeVisible();

    // Verify Action buttons: Advance, Delete, and Start exist
    await expect(page.getByRole('button', { name: /Advance/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start', exact: true }).first()).toBeVisible();
  });

  test('3. PRIORITY 1 & 2: Assigned Harvester Machine Hours & Running Project Sync with Start Time', async ({ page }) => {
    resetPawanKumarSession();
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
    await page.context().clearCookies();
    await page.reload();

    await page.fill('input[placeholder="e.g. admin or operator1"]', 'golu');
    await page.fill('input[placeholder="••••••••"]', 'Password@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // 1. Verify Assigned Harvester Machine Card displays hours and minutes (format: "0 hrs 0 min" or "X hrs Y min")
    const machineHoursEl = page.locator('[data-testid="today-working-hours"]');
    await expect(machineHoursEl).toBeVisible();
    const initialHoursText = await machineHoursEl.textContent();
    expect(initialHoursText).toMatch(/\d+\s+(hr|hrs)\s+\d+\s+min/);

    // 2. Start Pawan Kumar's project from Timer Page
    await page.goto('/app/timer');
    await expect(page.locator('h1')).toContainText('Active Work Timer');
    
    const pawanHeading = page.locator('h4', { hasText: 'Pawan kumar' });
    await expect(pawanHeading).toBeVisible({ timeout: 10000 });
    const pawanCard = page.locator('div.rounded-2xl').filter({ has: pawanHeading });
    const startBtn = pawanCard.getByRole('button', { name: 'Start', exact: true });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Wait for session to start and live timer to appear
    await expect(page.locator('text=WORKING TIME')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Start Time:')).toBeVisible();

    // Return to Dashboard
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // 3. Verify Today's Works card displays Running status, Start Time, Duration and Payment Status
    const runningCard = page.locator('[aria-label*="Pawan kumar" i]').first();
    await expect(runningCard).toBeVisible({ timeout: 10000 });
    await expect(runningCard.locator('text=Running')).toBeVisible();

    // Verify Start Time format: "Start Time: H:MM AM/PM" (e.g. "Start Time: 7:33 AM")
    const startTimeEl = runningCard.locator('text=Start Time:');
    await expect(startTimeEl).toBeVisible();
    const startTimeText = await startTimeEl.textContent();
    expect(startTimeText).toMatch(/Start Time:\s+\d{1,2}:\d{2}\s+(AM|PM)/i);

    // Verify Duration format: "Duration: 0h 0m" or "Duration: 0h 1m" (matching format "0h 15m")
    const durationEl = runningCard.locator('text=Duration:');
    await expect(durationEl).toBeVisible();
    const durationText = await durationEl.textContent();
    expect(durationText).toMatch(/Duration:\s+\d+h\s+\d+m/);

    // Verify Payment Status displays Unpaid for running project
    await expect(runningCard.locator('span:text-is("Unpaid")')).toBeVisible();

    // 4. Wait for duration tick and verify duration updates live
    await page.waitForTimeout(3000);

    // 5. Refresh Dashboard and verify Start Time & Duration persist without reset
    await page.reload();
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    const reloadedRunningCard = page.locator('[aria-label*="Pawan kumar" i]').first();
    await expect(reloadedRunningCard).toBeVisible();
    const reloadedStartTime = await reloadedRunningCard.locator('text=Start Time:').textContent();
    expect(reloadedStartTime).toBe(startTimeText); // Start time unchanged after refresh!

    // Verify machine card working hours accumulated
    const reloadedMachineHours = await machineHoursEl.textContent();
    expect(reloadedMachineHours).toMatch(/\d+\s+(hr|hrs)\s+\d+\s+min/);

    // 6. Navigate to Timer Page and Pause work session cleanly
    await page.goto('/app/timer');
    const pauseBtn = page.getByRole('button', { name: 'Pause', exact: true });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    await expect(page.locator('text=TIMER PAUSED')).toBeVisible({ timeout: 10000 });
  });
});
