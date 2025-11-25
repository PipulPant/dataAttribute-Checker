#!/usr/bin/env node
/**
 * Integration test script to verify the package works correctly
 * Run with: npx ts-node test-integration.ts
 */

import { chromium, Browser, Page } from 'playwright';
import { auditTestAttributes, auditCurrentPage, PageAuditor, generateHTMLReport } from './src/index';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBasicAudit() {
  log('\n📋 Test 1: Basic Audit Function', 'blue');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <body>
        <button>Button 1</button>
        <button data-testID="btn-2">Button 2</button>
        <a href="#">Link 1</a>
        <a href="#" data-testID="link-2">Link 2</a>
      </body>
    </html>
  `);

  const result = await auditTestAttributes(page, {
    attributeName: 'data-testID',
    includeSelectors: ['button', 'a'],
    logToConsole: false,
  });

  await browser.close();

  if (result.totalElementsScanned === 4 && result.missingAttributeCount === 2) {
    log('✅ PASS: Basic audit works correctly', 'green');
    return true;
  } else {
    log(`❌ FAIL: Expected 4 elements, 2 missing. Got ${result.totalElementsScanned} elements, ${result.missingAttributeCount} missing`, 'red');
    return false;
  }
}

async function testAuditCurrentPage() {
  log('\n📋 Test 2: auditCurrentPage Function', 'blue');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <body>
        <button>Test Button</button>
        <a href="#">Test Link</a>
      </body>
    </html>
  `);

  const reportPath = path.join(__dirname, 'test-report.html');
  
  try {
    const result = await auditCurrentPage(page, 'Test-Report', {
      logToConsole: false,
      outputPath: reportPath,
    });

    const reportExists = fs.existsSync(reportPath);
    
    await browser.close();

    if (reportExists && result.missingAttributeCount >= 0) {
      log('✅ PASS: auditCurrentPage generates HTML report', 'green');
      // Clean up
      if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
      }
      return true;
    } else {
      log('❌ FAIL: HTML report not generated', 'red');
      return false;
    }
  } catch (error: any) {
    await browser.close();
    log(`❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

async function testPageAuditor() {
  log('\n📋 Test 3: PageAuditor Multi-Page Tracking', 'blue');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const auditor = new PageAuditor();

  // Page 1
  await page.setContent(`
    <html>
      <body>
        <button>Page 1 Button</button>
      </body>
    </html>
  `);
  await auditor.auditCurrentPage(page, 'Page-1', { logToConsole: false });

  // Page 2
  await page.setContent(`
    <html>
      <body>
        <a href="#">Page 2 Link</a>
      </body>
    </html>
  `);
  await auditor.auditCurrentPage(page, 'Page-2', { logToConsole: false });

  const summary = auditor.getSummary();
  await browser.close();

  if (summary.totalPagesAudited === 2 && summary.totalElementsScanned >= 2) {
    log('✅ PASS: PageAuditor tracks multiple pages correctly', 'green');
    return true;
  } else {
    log(`❌ FAIL: Expected 2 pages. Got ${summary.totalPagesAudited}`, 'red');
    return false;
  }
}

async function testHTMLReportGeneration() {
  log('\n📋 Test 4: HTML Report Generation', 'blue');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <body>
        <button>Missing Button</button>
        <a href="#" data-testID="link-ok">OK Link</a>
      </body>
    </html>
  `);

  const result = await auditTestAttributes(page, {
    logToConsole: false,
  });

  const reportPath = path.join(__dirname, 'test-html-report.html');
  generateHTMLReport(result, reportPath);

  await browser.close();

  const reportExists = fs.existsSync(reportPath);
  let reportContent = '';
  if (reportExists) {
    reportContent = fs.readFileSync(reportPath, 'utf-8');
    fs.unlinkSync(reportPath);
  }

  if (reportExists && reportContent.includes('Missing Attributes') && reportContent.includes('button')) {
    log('✅ PASS: HTML report generated with correct content', 'green');
    return true;
  } else {
    log('❌ FAIL: HTML report missing or incorrect', 'red');
    return false;
  }
}

async function testExcludeSelectors() {
  log('\n📋 Test 5: Exclude Selectors', 'blue');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <body>
        <button>Should be found</button>
        <button class="ignore">Should be excluded</button>
      </body>
    </html>
  `);

  const result = await auditTestAttributes(page, {
    includeSelectors: ['button'],
    excludeSelectors: ['.ignore'],
    logToConsole: false,
  });

  await browser.close();

  const foundButton = result.elementsMissingAttribute.find(
    el => el.textSnippet.includes('Should be found')
  );
  const excludedButton = result.elementsMissingAttribute.find(
    el => el.textSnippet.includes('Should be excluded')
  );

  if (foundButton && !excludedButton) {
    log('✅ PASS: Exclude selectors work correctly', 'green');
    return true;
  } else {
    log('❌ FAIL: Exclude selectors not working', 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 Running Integration Tests...', 'blue');
  log('=' .repeat(50), 'blue');

  const tests = [
    { name: 'Basic Audit', fn: testBasicAudit },
    { name: 'auditCurrentPage', fn: testAuditCurrentPage },
    { name: 'PageAuditor', fn: testPageAuditor },
    { name: 'HTML Report Generation', fn: testHTMLReportGeneration },
    { name: 'Exclude Selectors', fn: testExcludeSelectors },
  ];

  const results: boolean[] = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push(result);
    } catch (error: any) {
      log(`❌ FAIL: ${test.name} - ${error.message}`, 'red');
      results.push(false);
    }
  }

  log('\n' + '='.repeat(50), 'blue');
  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    log(`\n🎉 All ${total} tests passed!`, 'green');
    process.exit(0);
  } else {
    log(`\n⚠️  ${passed}/${total} tests passed`, 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

