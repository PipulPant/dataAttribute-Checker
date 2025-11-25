# playwright-attr-audit

A Playwright plugin and CLI tool to audit web pages for missing test attributes on interactive elements. Helps ensure your application has proper test identifiers for reliable end-to-end testing.

## Features

- 🔍 Scans DOM for interactive elements (buttons, links, inputs, etc.)
- 📊 Generates detailed reports of missing test attributes
- 🎯 **Fully configurable attribute names** - Use `data-testid`, `data-qa`, `data-cy`, or any custom attribute
- 📸 **Element screenshots** - Visual screenshots of missing elements in HTML reports (optional)
- 🎨 Works as a Playwright helper or standalone CLI tool
- ⚙️ Supports configuration files for easy customization
- 📝 TypeScript-first with full type definitions
- 🔄 **Perfect for navigation workflows** - Audit pages as you navigate through your app

## 🎯 Perfect for Navigation Workflows

Audit pages as you navigate through your application - simply call the plugin after each page navigation:

```typescript
import { auditCurrentPage } from 'playwright-attr-audit';

// Navigate to Page A
await page.goto('https://example.com/page-a');

// Call the plugin - it analyzes Page A and generates report
const resultA = await auditCurrentPage(page, 'Page A');

// Click button to navigate to Page B
await page.click('button.next');
await page.waitForNavigation();

// Call the plugin again - it analyzes Page B and generates report
const resultB = await auditCurrentPage(page, 'Page B');
```

**That's it!** Simply call `auditCurrentPage()` after each navigation to audit that page's DOM.

## Installation

### Prerequisites

This package requires:
- **Node.js** 18+ 
- **Playwright** (any version 1.0+)

### Install the Package

```bash
npm install --save-dev playwright-attr-audit
```

Or using yarn:

```bash
yarn add -D playwright-attr-audit
```

Or using pnpm:

```bash
pnpm add -D playwright-attr-audit
```

### Install Playwright (if not already installed)

If you don't have Playwright installed yet:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Note:** This package works with any Playwright setup - whether you're using:
- TypeScript or JavaScript
- Playwright Test framework or custom Playwright scripts
- Any Playwright version 1.0+

## Usage

### Quick Start: Audit Pages During Navigation

The simplest way to use this package - audit pages as you navigate. **Automatically generates HTML reports!**

**With Playwright Fixture (Recommended - No need to pass `page`):**
```typescript
import { test, expect } from 'playwright-attr-audit';

test('audit pages during navigation', async ({ page, auditCurrentPage }) => {
  // Navigate to Page A
  await page.goto('https://example.com/page-a');
  
  // Call the plugin - automatically generates HTML report: Page-A.html
  await auditCurrentPage('Page-A');
  
  // Click button to navigate to Page B
  await page.click('button.next');
  await page.waitForNavigation();
  
  // Call again - generates another report: Page-B.html
  await auditCurrentPage('Page-B');
  
  // Continue for as many pages as needed...
});
```

**Without Fixture (Pass `page` parameter):**
```typescript
import { test, expect } from '@playwright/test';
import { auditCurrentPage } from 'playwright-attr-audit';

test('audit pages during navigation', async ({ page }) => {
  await page.goto('https://example.com/page-a');
  
  // Automatically generates: Page-A.html
  await auditCurrentPage(page, 'Page-A');
  
  await page.click('button.next');
  await page.waitForNavigation();
  
  // Automatically generates: Page-B.html
  await auditCurrentPage(page, 'Page-B');
});
```

**That's it!** Simply call `auditCurrentPage()` after each navigation - it automatically generates an HTML report.

### In Playwright Tests

This package works with any Playwright setup - TypeScript, JavaScript, or any Playwright configuration.

#### Method 1: Direct Import (Recommended)

Works with any Playwright test setup:

**TypeScript Example:**
```typescript
import { test, expect } from '@playwright/test';
import { auditTestAttributes } from 'playwright-attr-audit';

test('page has test attributes on key elements', async ({ page }) => {
  await page.goto('https://example.com');

  const result = await auditTestAttributes(page, {
    attributeName: 'data-testID',
    includeSelectors: ['button', 'a', '[role=button]'],
  });

  // Option 1: Log the result
  console.log(result);

  // Option 2: Fail the test if any elements are missing attributes
  if (result.missingAttributeCount > 0) {
    throw new Error(
      `Found ${result.missingAttributeCount} elements missing data-testID. ` +
      `Example: ${result.elementsMissingAttribute[0]?.selector ?? 'n/a'}`
    );
  }
  
  // Option 3: Use Playwright's expect (recommended)
  expect(result.missingAttributeCount).toBe(0);
});
```

**JavaScript Example:**
```javascript
const { test, expect } = require('@playwright/test');
const { auditTestAttributes } = require('playwright-attr-audit');

test('page has test attributes on key elements', async ({ page }) => {
  await page.goto('https://example.com');

  const result = await auditTestAttributes(page, {
    attributeName: 'data-testID',
    includeSelectors: ['button', 'a', '[role=button]'],
  });

  expect(result.missingAttributeCount).toBe(0);
});
```

#### Method 2: Using the Playwright Fixture (TypeScript) - Recommended

For a more integrated experience with TypeScript, use the provided fixture. **No need to pass `page` parameter!**

**Simple approach - Auto-generates HTML report:**
```typescript
// Import test from playwright-attr-audit instead of @playwright/test
import { test, expect } from 'playwright-attr-audit';

test('audit page with auto-report', async ({ page, auditCurrentPage }) => {
  await page.goto('https://example.com');
  
  // Simply call with report title - automatically generates HTML report!
  // Creates: My-Page-Report.html
  await auditCurrentPage('My-Page-Report');
  
  // Navigate to another page
  await page.click('button.next');
  await page.waitForNavigation();
  
  // Generate another report
  await auditCurrentPage('Next-Page-Report');
  // Creates: Next-Page-Report.html
});
```

**Advanced approach - Get results without auto-report:**
```typescript
import { test, expect } from 'playwright-attr-audit';

test('page has test attributes', async ({ page, auditTestAttributes }) => {
  await page.goto('https://example.com');
  
  // Use the fixture - no need to pass page parameter
  const result = await auditTestAttributes({
    attributeName: 'data-testID', // 👈 Customize for your organization
    captureScreenshots: true, // 👈 Enable screenshots in reports
  });

  expect(result.missingAttributeCount).toBe(0);
});
```

#### Method 3: Generate HTML Report in Tests

```typescript
import { test, expect } from '@playwright/test';
import { auditTestAttributes, generateHTMLReport } from 'playwright-attr-audit';
import * as path from 'path';

test('audit and generate report', async ({ page }) => {
  await page.goto('https://example.com');

  const result = await auditTestAttributes(page);
  
  // Generate HTML report
  const reportPath = path.join(__dirname, 'audit-report.html');
  generateHTMLReport(result, reportPath);
  
  console.log(`Report generated at: ${reportPath}`);
  
  // Fail test if missing attributes found
  expect(result.missingAttributeCount).toBe(0);
});
```

#### Method 4: Audit Multiple Pages During Navigation

Audit pages as you navigate through your application:

**Simple approach - Audit each page individually:**
```typescript
import { test, expect } from '@playwright/test';
import { auditCurrentPage } from 'playwright-attr-audit';

test('audit multiple pages during navigation', async ({ page }) => {
  // Navigate to Page A
  await page.goto('https://example.com/page-a');
  
  // Audit Page A
  const resultA = await auditCurrentPage(page, 'Page A');
  expect(resultA.missingAttributeCount).toBe(0);
  
  // Click button to navigate to Page B
  await page.click('button.next');
  await page.waitForNavigation();
  
  // Audit Page B (after navigation)
  const resultB = await auditCurrentPage(page, 'Page B');
  expect(resultB.missingAttributeCount).toBe(0);
  
  // Navigate to Page C
  await page.click('a[href="/page-c"]');
  await page.waitForLoadState('networkidle');
  
  // Audit Page C
  const resultC = await auditCurrentPage(page, 'Page C');
  expect(resultC.missingAttributeCount).toBe(0);
});
```

**Advanced approach - Track multiple pages with PageAuditor:**
```typescript
import { test, expect } from '@playwright/test';
import { PageAuditor } from 'playwright-attr-audit';

test('audit workflow across multiple pages', async ({ page }) => {
  const auditor = new PageAuditor();
  
  // Page A
  await page.goto('https://example.com/login');
  await auditor.auditCurrentPage(page, 'Login Page');
  
  // Navigate to Page B
  await page.fill('#username', 'user');
  await page.fill('#password', 'pass');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  await auditor.auditCurrentPage(page, 'Dashboard');
  
  // Navigate to Page C
  await page.click('a[href="/settings"]');
  await page.waitForLoadState('networkidle');
  await auditor.auditCurrentPage(page, 'Settings Page');
  
  // Get summary of all pages
  const summary = auditor.getSummary();
  console.log(`Audited ${summary.totalPagesAudited} pages`);
  console.log(`Overall coverage: ${summary.overallCoverage}%`);
  
  // Generate combined report
  auditor.generateReport('multi-page-audit.html');
  
  // Assert overall coverage
  expect(summary.overallCoverage).toBeGreaterThanOrEqual(90);
});
```

#### Method 5: Custom Playwright Scripts (Not Using Test Framework)

If you're using Playwright without the test framework:

```typescript
import { chromium } from 'playwright';
import { auditTestAttributes, generateHTMLReport } from 'playwright-attr-audit';

async function runAudit() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example.com');
  
  const result = await auditTestAttributes(page, {
    logToConsole: true,
  });
  
  generateHTMLReport(result, 'audit-report.html');
  
  await browser.close();
  
  return result;
}

runAudit();
```

### Playwright Configuration Examples

#### playwright.config.ts (TypeScript)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

#### playwright.config.js (JavaScript)

```javascript
module.exports = {
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
    },
  ],
};
```

### Integration with Different Test Patterns

#### Page Object Model

```typescript
// pages/HomePage.ts
import { Page } from '@playwright/test';
import { auditTestAttributes } from 'playwright-attr-audit';

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async auditTestAttributes() {
    return await auditTestAttributes(this.page, {
      attributeName: 'data-testID',
    });
  }
}

// tests/home.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('home page has test attributes', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  
  const result = await homePage.auditTestAttributes();
  expect(result.missingAttributeCount).toBe(0);
});
```

#### Custom Test Helpers

```typescript
// helpers/audit-helper.ts
import { Page } from '@playwright/test';
import { auditTestAttributes, AuditResult } from 'playwright-attr-audit';

export async function assertTestAttributes(
  page: Page,
  options?: { attributeName?: string; maxMissing?: number }
): Promise<AuditResult> {
  const result = await auditTestAttributes(page, {
    attributeName: options?.attributeName || 'data-testID',
  });
  
  if (result.missingAttributeCount > (options?.maxMissing || 0)) {
    throw new Error(
      `Found ${result.missingAttributeCount} elements missing test attributes. ` +
      `Expected at most ${options?.maxMissing || 0}.`
    );
  }
  
  return result;
}

// tests/example.spec.ts
import { test } from '@playwright/test';
import { assertTestAttributes } from '../helpers/audit-helper';

test('page audit', async ({ page }) => {
  await page.goto('https://example.com');
  await assertTestAttributes(page, { maxMissing: 5 });
});
```

### CLI Tool

Run audits directly from the command line:

```bash
npx playwright-attr-audit \
  --baseUrl=https://my-app.example.com \
  --attr=data-testID \
  --include="button,a,[role=button]" \
  --html=report.html
```

#### CLI Options

- `--baseUrl <url>` (required) - URL to audit
- `--attr <name>` - Attribute name to check (default: `data-testID`)
- `--include <selectors>` - Comma-separated selectors to scan
- `--exclude <selectors>` - Comma-separated selectors to exclude
- `--output <path>` - Path to save JSON report
- `--html <path>` - Path to save HTML report (default: `audit-report.html` if no output specified)
- `--headless` - Run in headless mode (default: true)
- `--no-headless` - Run with browser visible
- `--help, -h` - Show help message

#### Exit Codes

- `0` - No missing attributes found
- `1` - At least one element is missing the required attribute (useful for CI)

#### Viewing Reports

After running the audit, you'll get an HTML report with clickable URLs for each missing element. To view it:

**Option 1: Double-click the HTML file**
- Simply double-click the report file (e.g., `audit-report.html`) to open it in your default browser

**Option 2: Open from command line**
```bash
# macOS
open audit-report.html

# Windows
start audit-report.html

# Linux
xdg-open audit-report.html
```

**Option 3: Open in a specific browser**
```bash
# Chrome
open -a "Google Chrome" audit-report.html  # macOS
start chrome audit-report.html              # Windows

# Firefox
open -a Firefox audit-report.html           # macOS
start firefox audit-report.html            # Windows
```

The HTML report includes:
- 📊 **Summary statistics** - Coverage percentage, total elements scanned, missing count
- 🔗 **Clickable URLs** - Click any page URL to navigate directly to that page
- 📍 **Element details** - Selector, XPath, position, role, and suggested test attribute values
- 🏷️ **Grouped by tag** - Elements organized by tag type for easier navigation
- 💡 **Visual indicators** - Color-coded coverage bars and status badges

### Configuration File

Create an `attr-audit.config.js` file in your project root:

```javascript
module.exports = {
  // ⚙️ CUSTOMIZE ATTRIBUTE NAME FOR YOUR ORGANIZATION
  // Different organizations use different naming conventions:
  // - "data-testid" (common)
  // - "data-testID" (default)
  // - "data-test-id"
  // - "data-qa"
  // - "data-cy" (Cypress convention)
  // - "testid"
  // - Custom: "data-my-org-test"
  attributeName: 'data-testid', // 👈 Change this to your organization's standard
  
  includeSelectors: ['button', 'a', '[role=button]', 'input'],
  excludeSelectors: ['.ignore-for-test', '[data-skip-audit]'],
  minTextLength: 1,
  
  // 📸 Enable screenshots in HTML reports (optional)
  captureScreenshots: false, // Set to true to include element screenshots
};
```

**See `attr-audit.config.example.js` for a complete configuration example with all options.**

Or with TypeScript (`attr-audit.config.ts`):

```typescript
import { AuditConfig } from 'playwright-attr-audit';

const config: AuditConfig = {
  attributeName: 'data-testid',
  includeSelectors: ['button', 'a', '[role=button]', 'input'],
  excludeSelectors: ['.ignore-for-test'],
  minTextLength: 1,
};

export default config;
```

**Note:** For TypeScript config files, you'll need `ts-node` installed:
```bash
npm install --save-dev ts-node
```

CLI flags override config file values when both are provided.

## API Reference

### `auditTestAttributes(page, options?)`

Main function to audit a page for missing test attributes.

#### Parameters

- `page: Page` - Playwright Page object
- `options?: AuditOptions` - Configuration options

#### Returns

`Promise<AuditResult>` - Audit result object

### `AuditOptions`

```typescript
interface AuditOptions {
  attributeName?: string;        // Default: "data-testID"
  includeSelectors?: string[];   // Default: common interactive elements
  excludeSelectors?: string[];  // Default: []
  minTextLength?: number;        // Default: 0
  maxDepth?: number;            // Optional DOM depth limit
  logToConsole?: boolean;       // Default: false
}
```

### `AuditResult`

```typescript
interface AuditResult {
  attributeName: string;
  totalElementsScanned: number;
  missingAttributeCount: number;
  elementsMissingAttribute: MissingAttributeElement[];
  timestamp: string;
  pageUrl: string;
}
```

### `MissingAttributeElement`

```typescript
interface MissingAttributeElement {
  selector: string;
  tagName: string;
  textSnippet: string;
  xpath?: string;
  role?: string | null;
  pageUrl: string;                    // URL of the page where element was found
  boundingBox?: {                      // Element position for visual highlighting
    x: number;
    y: number;
    width: number;
    height: number;
  };
  suggestedValue?: string;             // Suggested test attribute value
}
```

### `generateHTMLReport(result, outputPath)`

Generates a visual HTML report from audit results.

#### Parameters

- `result: AuditResult` - Audit result object
- `outputPath: string` - Path where to save the HTML report

#### Example

```typescript
import { auditTestAttributes, generateHTMLReport } from 'playwright-attr-audit';

const result = await auditTestAttributes(page);
generateHTMLReport(result, 'audit-report.html');
```

### `auditCurrentPage(page, reportTitle, options?)`

Convenience function to audit the current page state and **automatically generate HTML report**. Perfect for auditing after navigation.

#### Parameters

- `page: Page` - Playwright Page object (not needed when using fixture)
- `reportTitle: string` - Title/name for the report (used as filename, e.g., "My-Report" → `my-report.html`)
- `options?: AuditOptions & { outputPath?: string }` - Audit configuration options

#### Returns

`Promise<AuditResult>` - Audit result for the current page

#### Usage Examples

**With Playwright Fixture (Recommended - No `page` parameter needed):**
```typescript
import { test } from 'playwright-attr-audit';

test('audit pages', async ({ page, auditCurrentPage }) => {
  await page.goto('https://example.com');
  
  // Simply call with report title - automatically generates HTML report!
  // Creates: my-page-report.html
  await auditCurrentPage('My-Page-Report');
  
  // Navigate and audit again
  await page.click('button.next');
  await page.waitForNavigation();
  await auditCurrentPage('Next-Page-Report'); // Creates: next-page-report.html
});
```

**Without Fixture (Pass `page` parameter):**
```typescript
import { test } from '@playwright/test';
import { auditCurrentPage } from 'playwright-attr-audit';

test('audit pages', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Pass `page` as first parameter
  await auditCurrentPage(page, 'My-Page-Report'); // Creates: my-page-report.html
  
  await page.click('button.next');
  await page.waitForNavigation();
  await auditCurrentPage(page, 'Next-Page-Report'); // Creates: next-page-report.html
});
```

**Custom Output Path:**
```typescript
await auditCurrentPage('My-Report', {
  outputPath: 'reports/custom-location.html',
  attributeName: 'data-testid',
});
```

### `PageAuditor`

Helper class for tracking and auditing multiple pages during navigation.

#### Methods

- `auditCurrentPage(page, pageId?, options?)` - Audit the current page and track results
- `getSummary()` - Get summary of all audited pages
- `generateReport(outputPath)` - Generate combined HTML report for all pages

#### Example

```typescript
import { PageAuditor } from 'playwright-attr-audit';

const auditor = new PageAuditor();

await page.goto('https://example.com/page-a');
await auditor.auditCurrentPage(page, 'Page A');

await page.click('button');
await page.waitForNavigation();
await auditor.auditCurrentPage(page, 'Page B');

const summary = auditor.getSummary();
auditor.generateReport('multi-page-report.html');
```

## Default Selectors

By default, the following selectors are scanned:

- `button`
- `a`
- `input`
- `select`
- `textarea`
- `[role='button']`
- `div[role]`

## Example Reports

### JSON Report

```json
{
  "attributeName": "data-testID",
  "totalElementsScanned": 15,
  "missingAttributeCount": 3,
  "elementsMissingAttribute": [
    {
      "selector": "button",
      "tagName": "button",
      "textSnippet": "Submit Form",
      "xpath": "/html/body/div[1]/button[1]",
      "role": null,
      "pageUrl": "https://example.com",
      "boundingBox": {
        "x": 100,
        "y": 200,
        "width": 120,
        "height": 40
      },
      "suggestedValue": "submit-form"
    },
    {
      "selector": "a",
      "tagName": "a",
      "textSnippet": "Learn More",
      "xpath": "/html/body/nav/a[2]",
      "role": null,
      "pageUrl": "https://example.com",
      "boundingBox": {
        "x": 50,
        "y": 100,
        "width": 80,
        "height": 30
      },
      "suggestedValue": "learn-more"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "pageUrl": "https://example.com"
}
```

### HTML Report

The HTML report provides a visual, interactive view of the audit results:

- **Summary Dashboard** - Overview with coverage percentage and statistics
- **Grouped Elements** - Missing elements organized by tag type
- **Clickable URLs** - Direct links to each page where elements were found
- **Element Details** - Full information including selectors, XPath, position, and suggested values
- **Viewing Instructions** - Built-in guide on how to use the report

Each missing element in the HTML report includes:
- Page URL (clickable link)
- CSS selector
- XPath (if available)
- Element position (x, y coordinates)
- ARIA role (if present)
- Suggested test attribute value

### Programmatic Report Generation

You can also generate HTML reports programmatically:

```typescript
import { auditTestAttributes, generateHTMLReport } from 'playwright-attr-audit';

test('generate report', async ({ page }) => {
  await page.goto('https://example.com');
  
  const result = await auditTestAttributes(page);
  
  // Generate HTML report
  generateHTMLReport(result, 'my-report.html');
  
  console.log('Report generated! Open my-report.html to view.');
});
```

## Installation & Setup

### Step-by-Step Installation

1. **Install the package:**
   ```bash
   npm install --save-dev playwright-attr-audit
   ```

2. **Ensure Playwright is installed:**
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

3. **Create your first audit test:**

   Create a file `tests/audit.spec.ts` (or `.js`):
   ```typescript
   import { test, expect } from '@playwright/test';
   import { auditTestAttributes } from 'playwright-attr-audit';

   test('check test attributes', async ({ page }) => {
     await page.goto('https://example.com');
     const result = await auditTestAttributes(page);
     expect(result.missingAttributeCount).toBe(0);
   });
   ```

4. **Run the test:**
   ```bash
   npx playwright test
   ```

### Works With Any Playwright Setup

✅ **TypeScript** - Full type support  
✅ **JavaScript** - CommonJS and ES Modules  
✅ **Playwright Test Framework** - Standard test runner  
✅ **Custom Playwright Scripts** - Direct Playwright API usage  
✅ **Any Playwright Version** - 1.0+

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Attribute Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install --with-deps
      
      - name: Run audit
        run: npx playwright test --reporter=list
      
      - name: Upload HTML reports
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: audit-reports
          path: reports/
```

### GitLab CI

```yaml
test-attributes:
  stage: test
  image: node:18
  before_script:
    - npm ci
    - npx playwright install --with-deps
  script:
    - npx playwright test
  artifacts:
    when: on_failure
    paths:
      - reports/
    expire_in: 1 week
```

## Troubleshooting

### TypeScript Errors

If you get TypeScript errors, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Module Not Found

If you get "Cannot find module" errors:

1. Ensure the package is installed: `npm list playwright-attr-audit`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check your import path matches your module system (ESM vs CommonJS)

### Playwright Version Compatibility

This package works with Playwright 1.0+. If you're using an older version:

```bash
npm install --save-dev @playwright/test@latest
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

MIT

