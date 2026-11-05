import { test, expect } from '@playwright/test';

test.describe('Machines & Services Showcase and Today\'s Works Filtering E2E', () => {
  test('1. Machines & Services Page Navigation, Hero, and Statistics Display', async ({ page }) => {
    await page.goto('/machines');
    await page.waitForLoadState('domcontentloaded');

    // Verify Title & Brand
    await expect(page.locator('h1')).toContainText('Smart Machinery. Smarter Farming.');
    await expect(
      page.getByText('Manage your agricultural machines, hourly operations, customers, contractors, and earnings')
    ).toBeVisible();

    // Verify Hero CTAs
    await expect(page.getByRole('link', { name: 'Explore Machines' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Us' })).toBeVisible();

    // Verify Statistics Cards
    await expect(page.getByText('Total Machines')).toBeVisible();
    await expect(page.getByText('Active In Field')).toBeVisible();
    await expect(page.getByText('Working Hours')).toBeVisible();
    await expect(page.getByText('Total Earnings')).toBeVisible();
  });

  test('2. Primary Harvester Featured Showcase & Technical Specs Modal', async ({ page }) => {
    await page.goto('/machines');

    // Verify Primary Machine Category
    await expect(page.getByText('Primary Machine Focus')).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Paddy / Dhaan Harvester' })).toBeVisible();
    await expect(
      page.getByText('Efficient paddy harvesting management with hourly work tracking, customer billing, contractor rates')
    ).toBeVisible();

    // Verify 11 Operational Capabilities are displayed
    const expectedCapabilities = [
      'Hourly Work Tracking',
      'Customer-wise Work Records',
      'Contractor-wise Machine Management',
      'Dynamic Hourly Rate Configuration',
      'Automatic Work Duration Calculation',
      'Customer Payment Tracking',
      'Contractor Payment Tracking',
      'Real-time Profit Calculation',
      'Machine Availability Status',
      'Field Work History & Audit Logs',
      'Machine-wise PDF & Excel Reports',
    ];

    const featuredSection = page.locator('#featured-harvester');
    for (const cap of expectedCapabilities) {
      await expect(featuredSection.getByText(cap, { exact: true })).toBeVisible();
    }

    // Click "Machine Details" to open specs modal
    await page.locator('button:has-text("Machine Details")').first().click();
    const modalDialog = page.locator('.fixed.inset-0.z-50');
    await expect(modalDialog.getByRole('heading', { name: 'Paddy / Dhaan Harvester' })).toBeVisible();
    await expect(modalDialog.getByText('Engine & Engineering Specs')).toBeVisible();
    await expect(modalDialog.getByText('1,400 Litres Clean Grain Tank')).toBeVisible();

    // Close modal
    await modalDialog.locator('button:has-text("Close")').click();
    await expect(page.getByText('Engine & Engineering Specs')).not.toBeVisible();
  });

  test('3. Machinery Directory & Future-Ready Expansion Categories', async ({ page }) => {
    await page.goto('/machines');

    // Scroll to directory
    await expect(page.getByRole('heading', { name: 'Agricultural Machinery Directory' })).toBeVisible();

    // Verify all 7 Machine categories exist
    const expectedMachines = [
      'Paddy / Dhaan Harvester',
      'Agricultural Tractor (4WD)',
      'Rotavator / Rotary Tiller',
      'Spring Loaded Cultivator',
      'Multi-Crop Thresher',
      'Automatic Seed & Fertilizer Drill',
      'Multi-Crop Track Combine Harvester',
    ];

    const directorySection = page.locator('#all-machinery');
    for (const mName of expectedMachines) {
      await expect(directorySection.getByRole('heading', { name: mName })).toBeVisible();
    }

    // Verify Category Filter tabs
    await page.click('button:has-text("Harvesters")');
    await expect(directorySection.getByRole('heading', { name: 'Paddy / Dhaan Harvester' })).toBeVisible();
    await expect(directorySection.getByRole('heading', { name: 'Rotavator / Rotary Tiller' })).toHaveCount(0);

    // Reset filter
    await page.click('button:has-text("All Machines")');
    await expect(directorySection.getByRole('heading', { name: 'Rotavator / Rotary Tiller' })).toBeVisible();
  });

  test('4. Hourly Rate Management & Interactive Pricing Calculator', async ({ page }) => {
    await page.goto('/machines');

    // Verify Hourly Rate Section
    await expect(page.getByRole('heading', { name: 'Hourly Rate & Profit Management' })).toBeVisible();
    await expect(page.getByText('Interactive Hourly Earnings Simulator')).toBeVisible();
    await expect(page.getByText('Customer Hourly Rate (₹)')).toBeVisible();
    await expect(page.getByText('Contractor Hourly Rate (₹)')).toBeVisible();
    await expect(page.getByText('Estimated Owner Profit')).toBeVisible();

    // Verify conceptual formula notes
    await expect(page.getByText('Owner Profit = Customer Bill − Contractor Amount')).toBeVisible();
  });

  test('5. Dummy Subscription Plans & Prototype Showcase Dialog', async ({ page }) => {
    await page.goto('/machines');

    // Verify Subscription Section Header
    await expect(page.getByRole('heading', { name: 'Choose Your Machinery Management Plan' })).toBeVisible();
    await expect(page.getByText('Showcase Prototype:')).toBeVisible();

    // Verify 3 Plans
    await expect(page.getByRole('heading', { name: 'Basic Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Professional Plan' })).toBeVisible();
    await expect(page.getByText('Most Popular')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise Plan' })).toBeVisible();

    // Click "Coming Soon" on Professional Plan
    const proPlanCard = page.locator('.space-y-5').filter({ hasText: 'Professional Plan' });
    await proPlanCard.locator('button:has-text("Coming Soon")').click();

    // Verify Prototype Modal
    await expect(page.getByRole('heading', { name: 'Subscription Service Coming Soon!' })).toBeVisible();
    await expect(page.getByText('You selected: Professional Plan')).toBeVisible();
    await page.click('button:has-text("Got It, Thanks!")');
    await expect(page.getByRole('heading', { name: 'Subscription Service Coming Soon!' })).not.toBeVisible();
  });

  test('6. Contact Section & Quick Message Inquiry', async ({ page }) => {
    await page.goto('/machines');

    // Verify Contact Section
    await expect(page.getByRole('heading', { name: "Let's Grow Your Agricultural Business" })).toBeVisible();
    await expect(page.getByText('Contact Number Coming Soon')).toBeVisible();
    await expect(page.getByText('support@dhaantrack.com')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Chat With Us' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get in Touch' })).toBeVisible();

    // Fill Quick Message form
    await page.fill('input[placeholder="Your Name / Operator Name"]', 'Kisan Vikram');
    await page.fill('input[placeholder="10-digit Mobile Number"]', '9812345678');
    await page.fill('textarea[placeholder*="Tell us about"]', 'Interested in harvester hourly billing management.');
    await page.click('button:has-text("Send Message")');

    // Verify feedback
    await expect(page.getByText('Thank you! Your message has been received.')).toBeVisible();
  });
});
