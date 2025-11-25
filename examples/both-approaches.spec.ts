/**
 * Examples showing both approaches: with and without fixture
 */

// ============================================
// APPROACH 1: WITH FIXTURE (Recommended)
// ============================================
// No need to pass `page` parameter - it's automatically available!

import { test as testWithFixture, expect } from '../src/playwright/fixture';

testWithFixture.describe('Using Playwright Fixture', () => {
  testWithFixture('audit page with fixture - no page parameter needed', async ({ page, auditCurrentPage }) => {
    await page.goto('https://example.com');
    
    // Simply call with report title - page is automatically available!
    await auditCurrentPage('My-Report-Title');
    // Creates: my-report-title.html
  });

  testWithFixture('audit multiple pages during navigation', async ({ page, auditCurrentPage }) => {
    // Page A
    await page.goto('https://example.com/page-a');
    await auditCurrentPage('Page-A-Report');
    
    // Navigate to Page B
    await page.click('button.next');
    await page.waitForNavigation();
    await auditCurrentPage('Page-B-Report');
    
    // Navigate to Page C
    await page.click('a[href="/page-c"]');
    await page.waitForLoadState('networkidle');
    await auditCurrentPage('Page-C-Report');
  });
});

// ============================================
// APPROACH 2: WITHOUT FIXTURE
// ============================================
// Pass `page` as first parameter

import { test } from '@playwright/test';
import { auditCurrentPage } from '../src/core/multi-page-audit';

test.describe('Without Playwright Fixture', () => {
  test('audit page without fixture - pass page parameter', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Pass page as first parameter
    await auditCurrentPage(page, 'My-Report-Title');
    // Creates: my-report-title.html
  });

  test('audit multiple pages during navigation', async ({ page }) => {
    // Page A
    await page.goto('https://example.com/page-a');
    await auditCurrentPage(page, 'Page-A-Report');
    
    // Navigate to Page B
    await page.click('button.next');
    await page.waitForNavigation();
    await auditCurrentPage(page, 'Page-B-Report');
    
    // Navigate to Page C
    await page.click('a[href="/page-c"]');
    await page.waitForLoadState('networkidle');
    await auditCurrentPage(page, 'Page-C-Report');
  });
});

