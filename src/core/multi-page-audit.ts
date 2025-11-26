import { Page } from 'playwright';
import { auditTestAttributes, AuditOptions, AuditResult } from './audit';
import { generateHTMLReport } from './report-generator';
import * as path from 'path';

// Re-export AuditOptions for convenience
export type { AuditOptions } from './audit';

/**
 * Result for a single page audit
 */
export interface PageAuditResult {
  /**
   * Page URL or identifier
   */
  pageId: string;
  
  /**
   * Audit result for this page
   */
  result: AuditResult;
  
  /**
   * Timestamp when this page was audited
   */
  auditedAt: string;
}

/**
 * Multi-page audit result aggregating results from multiple pages
 */
export interface MultiPageAuditResult {
  /**
   * Total number of pages audited
   */
  totalPagesAudited: number;
  
  /**
   * Total elements scanned across all pages
   */
  totalElementsScanned: number;
  
  /**
   * Total missing attributes across all pages
   */
  totalMissingAttributes: number;
  
  /**
   * Overall coverage percentage
   */
  overallCoverage: number;
  
  /**
   * Results for each page
   */
  pageResults: PageAuditResult[];
  
  /**
   * Timestamp when the multi-page audit started
   */
  startedAt: string;
  
  /**
   * Timestamp when the multi-page audit completed
   */
  completedAt: string;
}

/**
 * Helper class for auditing multiple pages during navigation
 * 
 * Usage:
 * ```typescript
 * const auditor = new PageAuditor();
 * 
 * await page.goto('https://example.com/page-a');
 * await auditor.auditCurrentPage(page, 'Page A');
 * 
 * await page.click('button.next');
 * await page.waitForNavigation();
 * await auditor.auditCurrentPage(page, 'Page B');
 * 
 * const summary = auditor.getSummary();
 * ```
 */
export class PageAuditor {
  private pageResults: PageAuditResult[] = [];
  private startedAt: string;

  constructor() {
    this.startedAt = new Date().toISOString();
  }

  /**
   * Audit the current page state
   * 
   * @param page - Playwright Page object
   * @param pageId - Identifier for this page (defaults to page URL)
   * @param options - Audit options
   * @returns Audit result for this page
   */
  async auditCurrentPage(
    page: Page,
    pageId?: string,
    options?: AuditOptions
  ): Promise<AuditResult> {
    const currentPageId = pageId || page.url() || `page-${this.pageResults.length + 1}`;
    
    const result = await auditTestAttributes(page, {
      ...options,
      logToConsole: false, // Don't log individual pages, we'll log summary
    });

    this.pageResults.push({
      pageId: currentPageId,
      result,
      auditedAt: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Get summary of all audited pages
   */
  getSummary(): MultiPageAuditResult {
    const totalElementsScanned = this.pageResults.reduce(
      (sum, pr) => sum + pr.result.totalElementsScanned,
      0
    );
    const totalMissingAttributes = this.pageResults.reduce(
      (sum, pr) => sum + pr.result.missingAttributeCount,
      0
    );
    const overallCoverage = totalElementsScanned > 0
      ? ((totalElementsScanned - totalMissingAttributes) / totalElementsScanned) * 100
      : 100;

    return {
      totalPagesAudited: this.pageResults.length,
      totalElementsScanned,
      totalMissingAttributes,
      overallCoverage: Math.round(overallCoverage * 100) / 100,
      pageResults: this.pageResults,
      startedAt: this.startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate HTML report for all pages
   */
  generateReport(outputPath: string): void {
    const summary = this.getSummary();
    
    // Generate a combined HTML report
    const html = this.generateCombinedHTML(summary);
    
    const fs = require('fs');
    fs.writeFileSync(outputPath, html, 'utf-8');
  }

  /**
   * Generate combined HTML report
   */
  private generateCombinedHTML(summary: MultiPageAuditResult): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Page Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9f9f9;
    }
    .stat-card {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-card .value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .page-section {
      padding: 20px;
      border-bottom: 1px solid #eee;
    }
    .page-section h3 {
      color: #667eea;
      margin-bottom: 10px;
    }
    .coverage-bar {
      width: 100%;
      height: 20px;
      background: #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 10px;
    }
    .coverage-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 Multi-Page Audit Report</h1>
      <p>Started: ${new Date(summary.startedAt).toLocaleString()}</p>
      <p>Completed: ${new Date(summary.completedAt).toLocaleString()}</p>
    </header>
    
    <div class="stats">
      <div class="stat-card">
        <div class="value">${summary.totalPagesAudited}</div>
        <div class="label">Pages Audited</div>
      </div>
      <div class="stat-card">
        <div class="value">${summary.totalElementsScanned}</div>
        <div class="label">Total Elements</div>
      </div>
      <div class="stat-card">
        <div class="value">${summary.totalMissingAttributes}</div>
        <div class="label">Missing Attributes</div>
      </div>
      <div class="stat-card">
        <div class="value">${summary.overallCoverage.toFixed(1)}%</div>
        <div class="label">Overall Coverage</div>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${summary.overallCoverage}%">${summary.overallCoverage.toFixed(1)}%</div>
        </div>
      </div>
    </div>
    
    <div style="padding: 30px;">
      <h2>Page Results</h2>
      ${summary.pageResults.map((pageResult, index) => `
        <div class="page-section">
          <h3>${index + 1}. ${this.escapeHtml(pageResult.pageId)}</h3>
          <p><strong>URL:</strong> ${this.escapeHtml(pageResult.result.pageUrl)}</p>
          <p><strong>Scanned:</strong> ${pageResult.result.totalElementsScanned} elements</p>
          <p><strong>Missing:</strong> ${pageResult.result.missingAttributeCount} attributes</p>
          <p><strong>Coverage:</strong> ${((pageResult.result.totalElementsScanned - pageResult.result.missingAttributeCount) / pageResult.result.totalElementsScanned * 100).toFixed(1)}%</p>
          <p><strong>Audited:</strong> ${new Date(pageResult.auditedAt).toLocaleString()}</p>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

/**
 * Convenience function to audit the current page state and automatically generate HTML report.
 * Works dynamically with or without fixture - detects if first parameter is Page or reportTitle.
 * 
 * **Usage with fixture (no page parameter needed):**
 * ```typescript
 * import { test } from 'playwright-testid-scanner';
 * 
 * test('audit', async ({ page, auditCurrentPage }) => {
 *   await page.goto('https://example.com');
 *   await auditCurrentPage('My-Report'); // No page parameter!
 * });
 * ```
 * 
 * **Usage without fixture (pass page parameter):**
 * ```typescript
 * import { test } from '@playwright/test';
 * import { auditCurrentPage } from 'playwright-testid-scanner';
 * 
 * test('audit', async ({ page }) => {
 *   await page.goto('https://example.com');
 *   await auditCurrentPage(page, 'My-Report'); // Pass page
 * });
 * ```
 * 
 * @overload
 * @param reportTitle - Title/name for the report (when using fixture)
 * @param options - Audit options
 * @returns Audit result
 * 
 * @overload
 * @param page - Playwright Page object (when not using fixture)
 * @param reportTitle - Title/name for the report
 * @param options - Audit options
 * @returns Audit result
 */
export async function auditCurrentPage(
  page: Page,
  reportTitle: string,
  options?: AuditOptions & { outputPath?: string }
): Promise<AuditResult> {
  const result = await auditTestAttributes(page, {
    ...options,
    logToConsole: options?.logToConsole ?? true,
  });

  // Automatically generate HTML report
  const outputPath = options?.outputPath || `${sanitizeFilename(reportTitle)}.html`;
  generateHTMLReport(result, outputPath);
  
  if (options?.logToConsole !== false) {
    console.log(`\n✅ HTML report generated: ${outputPath}`);
  }

  return result;
}

/**
 * Sanitize filename to be filesystem-safe
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

