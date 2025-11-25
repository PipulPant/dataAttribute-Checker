import { test as base, Page } from '@playwright/test';
import { auditTestAttributes, AuditOptions, AuditResult } from '../core/audit';
import { auditCurrentPage } from '../core/multi-page-audit';

/**
 * Extended Playwright test type with audit fixtures
 */
type AuditTest = {
  auditTestAttributes: (options?: AuditOptions) => Promise<AuditResult>;
  auditCurrentPage: (reportTitle: string, options?: AuditOptions & { outputPath?: string }) => Promise<AuditResult>;
};

/**
 * Playwright fixture that provides audit helpers
 * 
 * Usage with auditTestAttributes:
 * ```typescript
 * import { test } from 'playwright-attr-audit';
 * 
 * test('page has test attributes', async ({ page, auditTestAttributes }) => {
 *   await page.goto('https://example.com');
 *   const result = await auditTestAttributes();
 *   // ...
 * });
 * ```
 * 
 * Usage with auditCurrentPage (auto-generates HTML report):
 * ```typescript
 * import { test } from 'playwright-attr-audit';
 * 
 * test('audit page', async ({ page, auditCurrentPage }) => {
 *   await page.goto('https://example.com');
 *   // Automatically generates HTML report: My-Report.html
 *   await auditCurrentPage('My-Report');
 * });
 * ```
 */
export const test = base.extend<AuditTest>({
  auditTestAttributes: async ({ page }, use) => {
    await use((options?: AuditOptions) => auditTestAttributes(page, options));
  },
  auditCurrentPage: async ({ page }, use) => {
    // When using fixture, page is automatically available - user only passes reportTitle
    // The fixture binds page so user doesn't need to pass it
    await use((reportTitle: string, options?: AuditOptions & { outputPath?: string }) => 
      auditCurrentPage(page, reportTitle, options)
    );
  },
});

// Re-export everything from @playwright/test
export { expect } from '@playwright/test';
export type { Page, BrowserContext, Browser } from '@playwright/test';

