import { test, expect } from '@playwright/test';

test.describe('DhaanTrack – Promotional Marketing Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    // Store in page context for checking
    page.consoleErrors = consoleErrors;
  });

  test('displays promotional marketing landing page at root "/" without redirecting to login', async ({ page }) => {
    await page.goto('/');

    // Verify current URL remains at "/" and does not redirect to "/login"
    expect(page.url()).not.toContain('/login');
    expect(new URL(page.url()).pathname).toBe('/');

    // Verify DhaanTrack branding
    await expect(page.locator('header').getByText('DhaanTrack', { exact: false })).toBeVisible();

    // Verify exact Hero headline and subheadline
    await expect(page.getByRole('heading', { name: /Smarter Harvesting\.\s*Better Farming\./i })).toBeVisible();
    await expect(
      page.getByText(
        'Manage agricultural machinery, track harvesting operations, monitor customer work, and simplify payments — all in one powerful platform.'
      )
    ).toBeVisible();
  });

  test('renders separate login page at "/login"', async ({ page }) => {
    await page.goto('/login');

    // Verify LoginPage renders
    await expect(page.getByRole('heading', { name: 'DhaanTrack' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g. admin or operator1')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in|Login/i })).toBeVisible();
  });

  test('navbar and hero CTA buttons navigate to login page', async ({ page }) => {
    await page.goto('/');

    // 1. Navbar Login button
    const navbarLogin = page.locator('#navbar-login-btn');
    await expect(navbarLogin).toBeVisible();
    await navbarLogin.click();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    // Go back to landing page
    await page.goto('/');

    // 2. Navbar Get Started button
    const navbarGetStarted = page.locator('#navbar-get-started-btn');
    await expect(navbarGetStarted).toBeVisible();
    await navbarGetStarted.click();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    // Go back to landing page
    await page.goto('/');

    // 3. Hero Get Started button
    const heroGetStarted = page.locator('#hero-get-started-btn');
    await expect(heroGetStarted).toBeVisible();
    await heroGetStarted.click();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('renders all 6 core feature cards', async ({ page }) => {
    await page.goto('/');

    // Features section header
    const featuresHeading = page.getByRole('heading', { name: /Everything You Need for Harvest Season/i });
    await expect(featuresHeading).toBeVisible();

    // 6 feature cards
    await expect(page.getByRole('heading', { name: 'Machine Management', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Harvesting Work Tracking', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Customer Management', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payment Tracking', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reports & Analytics', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Work History', exact: true })).toBeVisible();
  });

  test('renders 4-step workflow in How It Works section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /How DhaanTrack Works in the Field/i })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Register Your Machines' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Customers' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Track Harvesting Work' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Manage Payments & Reports' })).toBeVisible();
  });

  test('renders promotional banner and navigates via CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Transform Your Farming Operations' })).toBeVisible();
    await expect(
      page.getByText(
        'Bring your agricultural machinery, customers, harvesting operations, and payments into one organized system.'
      )
    ).toBeVisible();

    const promoBtn = page.locator('#promo-start-managing-btn');
    await expect(promoBtn).toBeVisible();
    await promoBtn.click();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('renders illustrative statistics, sample testimonials, and interactive FAQs', async ({ page }) => {
    await page.goto('/');

    // Statistics section (illustrative labels)
    await expect(page.getByRole('heading', { name: /Engineered for Field Reliability & Transparency/i })).toBeVisible();
    await expect(page.getByText('100% Mobile & Offline')).toBeVisible();
    await expect(page.getByText('Multi-Machine Support')).toBeVisible();

    // Sample Testimonials clearly marked
    await expect(page.getByText('Sample Content / Demonstration Only')).toBeVisible();
    await expect(page.getByText('Rameshwar Prasad')).toBeVisible();

    // FAQ Section - 5 Questions
    await expect(page.getByText('What is DhaanTrack?')).toBeVisible();
    await expect(page.getByText('How can I manage my machines?')).toBeVisible();
    await expect(page.getByText('Can I track customer harvesting work?')).toBeVisible();
    await expect(page.getByText('Can I manage payments?')).toBeVisible();
    await expect(page.getByText('How do I get started?')).toBeVisible();

    // Test FAQ expansion
    const faqItem2 = page.locator('#faq-item-1'); // How can I manage my machines?
    await faqItem2.click();
    await expect(page.getByText('You can register your harvesters, tractors, and agricultural attachments')).toBeVisible();
  });

  test('renders contact section with working inquiry submission and footer', async ({ page }) => {
    await page.goto('/');

    // Contact details
    await expect(page.getByRole('heading', { name: "Let's Discuss Your Agricultural Fleet" })).toBeVisible();
    await expect(page.getByText('support@dhaantrack.com').first()).toBeVisible();

    // Submit inquiry form
    await page.fill('input[placeholder="e.g. Ramesh Kumar"]', 'Santosh Yadav');
    await page.fill('input[placeholder="e.g. 9876543210"]', '9812345678');
    await page.fill('textarea[placeholder*="Tell us about your machines"]', 'Interested in testing for 2 harvesters');
    await page.locator('#contact-submit-btn').click();

    await expect(page.getByText('Thank You for Reaching Out!')).toBeVisible();

    // Footer
    await expect(page.locator('footer').getByText('DhaanTrack').first()).toBeVisible();
    await expect(page.locator('#footer-login-link')).toBeVisible();
    await expect(page.locator('footer').getByText(/All rights reserved/i)).toBeVisible();
  });

  test('is responsive without horizontal overflow on mobile viewports', async ({ page }) => {
    // Mobile Viewport (iPhone 12 / Modern Android)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px rounding margin tolerance

    // Verify mobile hamburger menu
    const menuButton = page.getByRole('button', { name: /Toggle navigation menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Mobile drawer visible
    await expect(page.locator('header').getByRole('link', { name: 'Get Started' })).toBeVisible();
  });
});
