/**
 * Example: Auditing multiple pages during navigation
 * 
 * This demonstrates the workflow where you:
 * 1. Navigate to Page A → Call audit → Get report
 * 2. Click button/navigate to Page B → Call audit → Get report
 * 3. Continue for as many pages as needed
 */

import { test, expect } from '../src/playwright/fixture';

test.describe('Navigation Workflow Audit', () => {
  
  test('Simple approach - Audit each page individually (with fixture)', async ({ page, auditCurrentPage }) => {
    // Step 1: Navigate to Page A
    await page.goto('https://example.com/page-a');
    
    // Step 2: Audit Page A - simply call the function (no need to pass `page`!)
    // Automatically generates: page-a.html
    await auditCurrentPage('Page-A');
    
    // Step 3: Navigate to Page B (click button, form submit, etc.)
    await page.click('button.next'); // or any navigation action
    await page.waitForNavigation(); // Wait for navigation to complete
    
    // Step 4: Audit Page B - call again after navigation
    // Automatically generates: page-b.html
    await auditCurrentPage('Page-B');
    
    // Step 5: Navigate to Page C
    await page.click('a[href="/page-c"]');
    await page.waitForLoadState('networkidle');
    
    // Step 6: Audit Page C - call again
    // Automatically generates: page-c.html
    await auditCurrentPage('Page-C');
  });

  test('Without fixture - Pass page parameter', async ({ page }) => {
    const { auditCurrentPage } = await import('../src/core/multi-page-audit');
    
    await page.goto('https://example.com/page-a');
    
    // When not using fixture, pass `page` as first parameter
    await auditCurrentPage(page, 'Page-A-Report');
    // Creates: page-a-report.html
  });

  test('Advanced approach - Track multiple pages with PageAuditor', async ({ page }) => {
    const { PageAuditor } = await import('../src/core/multi-page-audit');
    
    // Create an auditor instance to track all pages
    const auditor = new PageAuditor();
    
    // Page A: Navigate and audit
    await page.goto('https://example.com/login');
    await auditor.auditCurrentPage(page, 'Login Page');
    
    // Page B: Fill form, submit, navigate, then audit
    await page.fill('#username', 'user@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await auditor.auditCurrentPage(page, 'Dashboard');
    
    // Page C: Click link, navigate, then audit
    await page.click('a[href="/settings"]');
    await page.waitForLoadState('networkidle');
    await auditor.auditCurrentPage(page, 'Settings Page');
    
    // Page D: Another navigation
    await page.click('button.back');
    await page.waitForNavigation();
    await auditor.auditCurrentPage(page, 'Previous Page');
    
    // Get summary of all pages
    const summary = auditor.getSummary();
    
    console.log(`\n📊 Audit Summary:`);
    console.log(`   Pages audited: ${summary.totalPagesAudited}`);
    console.log(`   Total elements: ${summary.totalElementsScanned}`);
    console.log(`   Missing attributes: ${summary.totalMissingAttributes}`);
    console.log(`   Overall coverage: ${summary.overallCoverage.toFixed(1)}%`);
    
    // Generate combined HTML report for all pages
    auditor.generateReport('multi-page-audit-report.html');
    console.log('\n✅ Combined report generated: multi-page-audit-report.html');
    
    // Assertions
    expect(summary.totalPagesAudited).toBe(4);
    expect(summary.overallCoverage).toBeGreaterThanOrEqual(90);
  });

  test('Real-world example: E-commerce checkout flow', async ({ page, auditCurrentPage }) => {
    // Simple approach - each page generates its own report
    await page.goto('https://shop.example.com');
    await auditCurrentPage('Homepage'); // Creates: homepage.html
    
    await page.click('a[href="/products/item-1"]');
    await page.waitForLoadState('networkidle');
    await auditCurrentPage('Product-Page'); // Creates: product-page.html
    
    await page.click('button.add-to-cart');
    await page.click('a.cart-icon');
    await page.waitForNavigation();
    await auditCurrentPage('Shopping-Cart'); // Creates: shopping-cart.html
    
    await page.click('button.checkout');
    await page.waitForNavigation();
    await auditCurrentPage('Checkout'); // Creates: checkout.html
    
    await page.fill('#card-number', '4111111111111111');
    await page.fill('#expiry', '12/25');
    await page.click('button.continue');
    await page.waitForNavigation();
    await auditCurrentPage('Payment'); // Creates: payment.html
    
    await page.click('button.submit-order');
    await page.waitForNavigation();
    await auditCurrentPage('Order-Confirmation'); // Creates: order-confirmation.html
    
    console.log('\n✅ All reports generated!');
  });

  test('Real-world example: E-commerce checkout flow with PageAuditor', async ({ page }) => {
    const { PageAuditor } = await import('../src/core/multi-page-audit');
    const auditor = new PageAuditor();
    
    // Homepage
    await page.goto('https://shop.example.com');
    await auditor.auditCurrentPage(page, 'Homepage');
    
    // Product page
    await page.click('a[href="/products/item-1"]');
    await page.waitForLoadState('networkidle');
    await auditor.auditCurrentPage(page, 'Product Page');
    
    // Add to cart and go to cart
    await page.click('button.add-to-cart');
    await page.click('a.cart-icon');
    await page.waitForNavigation();
    await auditor.auditCurrentPage(page, 'Shopping Cart');
    
    // Checkout page
    await page.click('button.checkout');
    await page.waitForNavigation();
    await auditor.auditCurrentPage(page, 'Checkout');
    
    // Payment page
    await page.fill('#card-number', '4111111111111111');
    await page.fill('#expiry', '12/25');
    await page.click('button.continue');
    await page.waitForNavigation();
    await auditor.auditCurrentPage(page, 'Payment');
    
    // Confirmation page
    await page.click('button.submit-order');
    await page.waitForNavigation();
    await auditor.auditCurrentPage(page, 'Order Confirmation');
    
    const summary = auditor.getSummary();
    auditor.generateReport('checkout-flow-audit.html');
    
    expect(summary.totalPagesAudited).toBe(6);
    console.log(`\n✅ Checkout flow audit complete: ${summary.overallCoverage.toFixed(1)}% coverage`);
  });
});

