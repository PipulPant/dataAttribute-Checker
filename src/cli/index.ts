#!/usr/bin/env node

import { Command } from 'commander';
import { chromium, Browser } from 'playwright';
import { auditTestAttributes, AuditOptions } from '../core/audit';
import { generateHTMLReport } from '../core/report-generator';
import { loadConfigFile } from './config-loader';
import { ProgressBar, Spinner } from './progress';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('playwright-attr-audit')
  .description('Audit web pages for missing test attributes on interactive elements')
  .version('1.0.0')
  .requiredOption('--baseUrl <url>', 'URL to audit')
  .option('--attr <name>', 'Attribute name to check', 'data-testID')
  .option('--include <selectors>', 'Comma-separated selectors to scan')
  .option('--exclude <selectors>', 'Comma-separated selectors to exclude')
  .option('--output <path>', 'Path to save JSON report')
  .option('--html <path>', 'Path to save HTML report (default: audit-report.html)')
  .option('--headless', 'Run in headless mode', true)
  .option('--no-headless', 'Run with browser visible')
  .option('--warning-threshold <percentage>', 'Warning threshold percentage (0-100)', parseFloat)
  .option('--failure-threshold <percentage>', 'Failure threshold percentage (0-100)', parseFloat)
  .option('--min-text-length <length>', 'Minimum text length for elements', parseInt)
  .option('--no-progress', 'Disable progress indicators')
  .addHelpText('after', `
Examples:
  $ playwright-attr-audit --baseUrl=https://example.com
  $ playwright-attr-audit --baseUrl=https://example.com --attr=data-testid --html=report.html
  $ playwright-attr-audit --baseUrl=https://example.com --include="button,a" --warning-threshold=10
  $ playwright-attr-audit --baseUrl=https://example.com --failure-threshold=50 --no-headless
  `);

/**
 * Main CLI entry point
 */
async function main() {
  program.parse();
  const options = program.opts();

  // Load config file
  const configFile = await loadConfigFile();
  
  // Merge config file with CLI options (CLI takes precedence)
  const auditOptions: AuditOptions = {
    ...configFile,
    attributeName: options.attr || configFile?.attributeName,
    ...(options.include && {
      includeSelectors: options.include.split(',').map((s: string) => s.trim()),
    }),
    ...(options.exclude && {
      excludeSelectors: options.exclude.split(',').map((s: string) => s.trim()),
    }),
    ...(options.minTextLength !== undefined && { minTextLength: options.minTextLength }),
    logToConsole: true,
    ...(options.warningThreshold !== undefined || options.failureThreshold !== undefined
      ? {
          thresholds: {
            ...(options.warningThreshold !== undefined && { warningThreshold: options.warningThreshold }),
            ...(options.failureThreshold !== undefined && { failureThreshold: options.failureThreshold }),
          },
        }
      : {}),
  };

  let browser: Browser | null = null;
  let progressBar: ProgressBar | null = null;
  let spinner: Spinner | null = null;
  
  // Store progressBar reference to avoid type narrowing issues
  const getProgressBar = (): ProgressBar | null => progressBar;
  const setProgressBar = (pb: ProgressBar | null): void => { progressBar = pb; };

  try {
    // Show spinner while launching browser
    if (!options.noProgress) {
      spinner = new Spinner('Launching browser...');
      spinner.start();
    }

    // Launch browser
    browser = await chromium.launch({
      headless: options.headless !== false,
    });

    if (spinner) spinner.stop();

    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the URL
    if (!options.noProgress) {
      spinner = new Spinner(`Navigating to ${options.baseUrl}...`);
      spinner.start();
    }

    await page.goto(options.baseUrl, { waitUntil: 'networkidle' });

    if (spinner) spinner.stop();

    // Set up progress callback
    if (!options.noProgress) {
      auditOptions.onProgress = (progress) => {
        const currentPb = getProgressBar();
        if (!currentPb && progress.total > 0) {
          const newPb = new ProgressBar(progress.total);
          setProgressBar(newPb);
          newPb.update(progress.scanned);
        } else if (currentPb) {
          currentPb.update(progress.scanned);
        }
      };
    }

    // Run audit
    const result = await auditTestAttributes(page, auditOptions);

    // Complete progress bar if it exists
    const finalPb = getProgressBar();
    if (finalPb) {
      finalPb.complete();
    }

    // Save JSON report if output path is provided
    if (options.output) {
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(
        outputPath,
        JSON.stringify(result, null, 2),
        'utf-8'
      );
      console.log(`\nJSON report saved to: ${outputPath}`);
    }

    // Generate HTML report (default or if specified)
    if (options.html !== undefined) {
      const htmlPath = path.resolve(options.html);
      generateHTMLReport(result, htmlPath);
      console.log(`HTML report saved to: ${htmlPath}`);
      console.log(`\n💡 To view the report, open: ${htmlPath}`);
      console.log(`   Or run: open ${htmlPath} (macOS) / start ${htmlPath} (Windows)`);
    } else if (!options.output) {
      // Generate default HTML report if no output specified
      const defaultHtmlPath = path.resolve('audit-report.html');
      generateHTMLReport(result, defaultHtmlPath);
      console.log(`\nHTML report saved to: ${defaultHtmlPath}`);
      console.log(`💡 To view the report, open: ${defaultHtmlPath}`);
      console.log(`   Or run: open ${defaultHtmlPath} (macOS) / start ${defaultHtmlPath} (Windows)`);
    }

    // Exit with appropriate code
    process.exit(result.missingAttributeCount > 0 ? 1 : 0);
  } catch (error: any) {
    if (spinner) spinner.stop();
    const errorPb = getProgressBar();
    if (errorPb) {
      errorPb.complete();
    }
    
    // Check if it's a threshold error
    if (error.message && error.message.includes('threshold')) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
    
    console.error('\n❌ Error running audit:', error.message || error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Export main for potential programmatic use
export { main };

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

