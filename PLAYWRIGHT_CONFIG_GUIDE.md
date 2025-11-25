# Playwright Config Integration Guide

This package supports reading the custom attribute name directly from your Playwright configuration file, making it work seamlessly across different Playwright frameworks.

## Configuration Priority

The package uses a three-tier priority system:

1. **Playwright Config File** (Highest Priority)
2. **Test Options** (Medium Priority)
3. **Default Regex Pattern** (Lowest Priority - matches any `data-*` attribute)

## Option 1: Playwright Config File (Recommended)

Add the configuration to your `playwright.config.js` or `playwright.config.ts`:

### JavaScript Config (`playwright.config.js`)

```javascript
module.exports = {
  // ... your existing Playwright config ...
  
  playwrightAttrAudit: {
    attributeName: 'data-test-id', // Your custom attribute name
  },
  
  // OR in the use block:
  use: {
    // ... other use options ...
    playwrightAttrAudit: {
      attributeName: 'data-test-id',
    },
  },
};
```

### TypeScript Config (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // ... your existing Playwright config ...
  
  playwrightAttrAudit: {
    attributeName: 'data-test-id',
  },
  
  // OR in the use block:
  use: {
    playwrightAttrAudit: {
      attributeName: 'data-test-id',
    },
  },
});
```

## Option 2: Test Options

If not set in Playwright config, you can pass it in your test:

```javascript
const { auditCurrentPage } = require('playwright-attr-audit');

test('my test', async ({ page }) => {
  await page.goto('https://example.com');
  
  await auditCurrentPage(page, 'My-Report', {
    attributeName: 'data-test-id', // Custom attribute
    captureScreenshots: true,
    includeElementsWithAttribute: true,
  });
});
```

## Option 3: Default Behavior

If neither Playwright config nor test options specify an attribute name, the package defaults to matching **any attribute starting with `data-`** using a regex pattern (`/^data-/i`).

This means it will find:
- `data-test-id`
- `data-testid`
- `data-testID`
- `data-qa`
- `data-cy`
- `data-my-custom-attr`
- Any other `data-*` attribute

## Examples

### Example 1: Using Playwright Config

**playwright.config.js:**
```javascript
module.exports = {
  playwrightAttrAudit: {
    attributeName: 'data-test-id',
  },
};
```

**test.spec.js:**
```javascript
const { auditCurrentPage } = require('playwright-attr-audit');

test('audit page', async ({ page }) => {
  await page.goto('https://example.com');
  // Will automatically use 'data-test-id' from config
  await auditCurrentPage(page, 'Report');
});
```

### Example 2: Override in Test

**playwright.config.js:**
```javascript
module.exports = {
  playwrightAttrAudit: {
    attributeName: 'data-test-id', // Default
  },
};
```

**test.spec.js:**
```javascript
const { auditCurrentPage } = require('playwright-attr-audit');

test('audit page', async ({ page }) => {
  await page.goto('https://example.com');
  // Override config with test-specific attribute
  await auditCurrentPage(page, 'Report', {
    attributeName: 'data-qa', // This takes precedence
  });
});
```

### Example 3: Using Default Regex

**No config file, no options:**
```javascript
const { auditCurrentPage } = require('playwright-attr-audit');

test('audit page', async ({ page }) => {
  await page.goto('https://example.com');
  // Will match any data-* attribute automatically
  await auditCurrentPage(page, 'Report');
});
```

## Benefits

✅ **Framework Agnostic**: Works with any Playwright setup  
✅ **Centralized Config**: Set once in Playwright config, use everywhere  
✅ **Flexible**: Override per test if needed  
✅ **Smart Defaults**: Automatically matches common `data-*` patterns  
✅ **No Code Changes**: Existing tests work without modification  

## Supported Config File Formats

- `playwright.config.js`
- `playwright.config.ts`
- `playwright.config.mjs`
- `playwright.config.cjs`

## Troubleshooting

### Config Not Being Read?

1. Make sure the config file is in your project root
2. Check the file name matches exactly (`playwright.config.js` or `playwright.config.ts`)
3. Verify the syntax is correct (valid JavaScript/TypeScript)
4. Try restarting your test runner

### Want to Use Regex Pattern Explicitly?

You can pass a RegExp object directly:

```javascript
await auditCurrentPage(page, 'Report', {
  attributeName: /^data-test/i, // Matches data-test, data-testid, etc.
});
```

