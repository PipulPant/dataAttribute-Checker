/**
 * Example: Using auditCurrentPage with Playwright Fixture
 * 
 * When using the fixture, you don't need to pass the `page` parameter!
 */

import { test, expect } from '../src/playwright/fixture';

test.describe('Using Playwright Fixture', () => {
  
  test('Simple usage - Auto-generates HTML report', async ({ page, auditCurrentPage }) => {
    // Navigate to Page A
    await page.goto('https://example.com/page-a');
    
    // Simply call with report title - no need to pass `page`!
    // Automatically generates: Page-A-Report.html
    await auditCurrentPage('Page-A-Report');
    
    // Navigate to Page B
    await page.click('button.next');
    await page.waitForNavigation();
    
    // Generate another report - no `page` parameter needed!
    // Automatically generates: Page-B-Report.html
    await auditCurrentPage('Page-B-Report');
  });

  test('With custom options', async ({ page, auditCurrentPage }) => {
    await page.goto('https://example.com');
    
    // Custom output path
    await auditCurrentPage('My-Custom-Report', {
      outputPath: 'reports/custom-report.html',
      attributeName: 'data-testid',
      logToConsole: false,
    });
  });

  test('Using auditTestAttributes fixture (without auto-report)', async ({ page, auditTestAttributes }) => {
    await page.goto('https://example.com');
    
    // Get results without auto-generating report
    const result = await auditTestAttributes({
      attributeName: 'data-testID',
    });
    
    expect(result.missingAttributeCount).toBe(0);
  });
});

