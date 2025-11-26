/**
 * Main exports for playwright-testid-scanner package
 */

// Core audit function and types
export { auditTestAttributes } from './core/audit';
export type {
  AuditOptions,
  AuditResult,
  MissingAttributeElement,
  AuditConfig,
} from './core/types';

// Multi-page audit helpers
export { PageAuditor, auditCurrentPage } from './core/multi-page-audit';
export type {
  PageAuditResult,
  MultiPageAuditResult,
} from './core/multi-page-audit';

// Report generation
export { generateHTMLReport } from './core/report-generator';

// Playwright fixture (optional)
export { test } from './playwright/fixture';
export type { Page, BrowserContext, Browser } from '@playwright/test';

