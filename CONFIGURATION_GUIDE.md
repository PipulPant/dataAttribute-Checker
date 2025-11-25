# Configuration Guide

## Custom Attribute Names

Different organizations use different naming conventions for test attributes. This package supports **any attribute name** you want to use.

### Common Attribute Naming Conventions

| Convention | Example | Used By |
|------------|---------|---------|
| `data-testid` | `<button data-testid="submit-btn">` | Common standard |
| `data-testID` | `<button data-testID="submit-btn">` | Default (this package) |
| `data-test-id` | `<button data-test-id="submit-btn">` | Some teams |
| `data-qa` | `<button data-qa="submit-btn">` | QA-focused teams |
| `data-cy` | `<button data-cy="submit-btn">` | Cypress users |
| `testid` | `<button testid="submit-btn">` | Simple convention |
| Custom | `<button data-my-org-test="submit-btn">` | Your organization |

### How to Configure

#### Option 1: Configuration File (Recommended)

Create `attr-audit.config.js` in your project root:

```javascript
module.exports = {
  // ⚙️ Set your organization's attribute name
  attributeName: 'data-testid', // Change this to match your standard
  
  // Other options...
  includeSelectors: ['button', 'a', 'input'],
  captureScreenshots: true, // Enable screenshots
};
```

#### Option 2: In Your Tests

```javascript
const { auditCurrentPage } = require('playwright-attr-audit');

await auditCurrentPage(page, 'My-Report', {
  attributeName: 'data-qa', // Your custom attribute
  captureScreenshots: true,
});
```

#### Option 3: CLI

```bash
npx playwright-attr-audit \
  --baseUrl=https://example.com \
  --attr=data-qa \
  --html=report.html
```

## Screenshot Feature

Enable screenshots to see visual representations of missing elements in HTML reports.

### Enable Screenshots

#### In Configuration File:

```javascript
module.exports = {
  captureScreenshots: true, // Enable screenshots
  attributeName: 'data-testid',
};
```

#### In Your Tests:

```javascript
await auditCurrentPage(page, 'My-Report', {
  captureScreenshots: true, // 📸 Enable screenshots
  attributeName: 'data-testid',
});
```

### Benefits

- **Visual identification**: See exactly which element is missing the attribute
- **Easier debugging**: Screenshots help developers quickly locate elements
- **Better reports**: More comprehensive HTML reports with visual context

### Performance Note

Screenshots add some overhead to audit execution. For large pages with many missing elements, consider:
- Using screenshots only for critical pages
- Enabling screenshots only in development/staging
- Using `excludeSelectors` to reduce the number of elements scanned

## Complete Configuration Example

```javascript
// attr-audit.config.js
module.exports = {
  // ⚙️ Your organization's attribute name
  attributeName: 'data-testid',
  
  // Elements to scan
  includeSelectors: [
    'button',
    'a',
    'input',
    'select',
    'textarea',
    '[role=button]',
    'div[role]',
    // Add custom selectors for your app
    '[data-component="interactive"]',
  ],
  
  // Elements to skip
  excludeSelectors: [
    '.skip-audit',
    '[data-skip-test]',
    '.third-party-widget',
  ],
  
  // Minimum text length
  minTextLength: 1,
  
  // 📸 Enable screenshots
  captureScreenshots: false, // Set to true to enable
  
  // Thresholds
  thresholds: {
    warningThreshold: 10,  // Warn if >10% missing
    failureThreshold: 50,  // Fail if >50% missing
  },
};
```

## Organization-Specific Examples

### Example 1: Using `data-qa`

```javascript
module.exports = {
  attributeName: 'data-qa',
  captureScreenshots: true,
};
```

### Example 2: Using `data-cy` (Cypress)

```javascript
module.exports = {
  attributeName: 'data-cy',
  includeSelectors: ['button', 'a', '[data-cy]'],
};
```

### Example 3: Custom Attribute

```javascript
module.exports = {
  attributeName: 'data-my-org-test',
  includeSelectors: ['button', 'a', '[data-component]'],
};
```

## Best Practices

1. **Standardize**: Choose one attribute name for your entire organization
2. **Document**: Add the attribute name to your team's coding standards
3. **Configure**: Use a config file so all team members use the same settings
4. **Screenshots**: Enable screenshots for critical pages or during development
5. **Exclude**: Use `excludeSelectors` to skip elements that don't need test attributes

