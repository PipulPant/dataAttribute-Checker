# Performance Optimization Guide

## Overview

The `playwright-testid-scanner` package has been optimized for performance, but scanning large pages with many elements can still take time. This guide explains performance considerations and how to optimize your audits.

## Performance Improvements (v1.0.3+)

### ✅ Implemented Optimizations

1. **Parallel Element Processing**
   - Elements are processed in batches of 50 in parallel
   - Bounding box, attribute checks, and XPath generation run concurrently
   - Reduces total processing time significantly

2. **Reduced Screenshot Timeout**
   - Screenshot timeout reduced from 10 seconds to 2 seconds per element
   - Failed screenshots don't block the audit

3. **Optimized XPath Generation**
   - XPath generation is non-blocking and runs in parallel
   - Skipped for elements that already have attributes (when `includeElementsWithAttribute` is enabled)

4. **Batch Processing**
   - All operations are batched to minimize browser roundtrips
   - Progress reporting is optimized to reduce overhead

## Performance Factors

### ⚠️ What Slows Down Audits

1. **Screenshots** (`captureScreenshots: true`)
   - **Impact**: VERY HIGH - Can add 2-10 seconds per element
   - **Recommendation**: Only enable for critical pages or during development
   - **Example**: 100 elements × 2 seconds = 200+ seconds (3+ minutes)

2. **Large Number of Elements**
   - **Impact**: HIGH - More elements = more processing time
   - **Recommendation**: Use `excludeSelectors` to filter out unnecessary elements
   - **Example**: 1000 elements can take 30-60 seconds without screenshots

3. **Deep DOM Trees**
   - **Impact**: MEDIUM - XPath generation traverses up the tree
   - **Recommendation**: Use `excludeSelectors` to skip deeply nested elements

4. **Complex Selectors**
   - **Impact**: MEDIUM - Complex CSS selectors take longer to evaluate
   - **Recommendation**: Use simple, specific selectors

## Performance Tips

### 1. Disable Screenshots for Production

```typescript
// ❌ SLOW - Don't use in CI/CD
await auditTestAttributes(page, {
  captureScreenshots: true, // Adds 2-10 seconds per element!
});

// ✅ FAST - Use for regular audits
await auditTestAttributes(page, {
  captureScreenshots: false, // Default - much faster
});
```

### 2. Use Exclude Selectors

```typescript
// ✅ FAST - Exclude third-party widgets and hidden elements
await auditTestAttributes(page, {
  excludeSelectors: [
    '.third-party-widget',
    '[data-skip-test]',
    '.hidden',
    '[aria-hidden="true"]',
    '.skip-audit',
  ],
});
```

### 3. Limit Selectors

```typescript
// ❌ SLOW - Scans too many elements
await auditTestAttributes(page, {
  includeSelectors: ['*'], // Scans everything!
});

// ✅ FAST - Only scan interactive elements
await auditTestAttributes(page, {
  includeSelectors: ['button', 'a', 'input'], // Only what you need
});
```

### 4. Use Min Text Length

```typescript
// ✅ FAST - Skip empty or icon-only elements
await auditTestAttributes(page, {
  minTextLength: 1, // Skip elements with no text
});
```

### 5. Disable Unnecessary Features

```typescript
// ✅ FAST - Skip elements with attributes if not needed
await auditTestAttributes(page, {
  includeElementsWithAttribute: false, // Default - faster
  captureScreenshots: false, // Default - much faster
});
```

## Expected Performance

### Without Screenshots

| Elements | Expected Time | Notes |
|----------|---------------|-------|
| < 50 | < 5 seconds | Very fast |
| 50-200 | 5-15 seconds | Fast |
| 200-500 | 15-30 seconds | Acceptable |
| 500-1000 | 30-60 seconds | Slow but manageable |
| > 1000 | 60+ seconds | Consider using excludeSelectors |

### With Screenshots

| Elements | Expected Time | Notes |
|----------|---------------|-------|
| < 10 | < 30 seconds | Acceptable |
| 10-50 | 30-120 seconds | Slow |
| 50-100 | 2-5 minutes | Very slow |
| > 100 | 5+ minutes | Not recommended |

## Troubleshooting Slow Audits

### Problem: Audit takes > 2 minutes

**Solutions:**
1. Check if `captureScreenshots` is enabled - disable it
2. Count elements being scanned - use `excludeSelectors` to reduce
3. Check for deeply nested DOM - use `excludeSelectors` to skip
4. Verify selectors aren't too broad - narrow down `includeSelectors`

### Problem: Audit hangs or times out

**Solutions:**
1. Check for infinite loops in exclusion selectors
2. Verify page is fully loaded before auditing
3. Reduce number of elements with `excludeSelectors`
4. Disable screenshots

### Problem: Memory issues with large pages

**Solutions:**
1. Process pages in smaller batches
2. Disable screenshots (they consume memory)
3. Use `excludeSelectors` to reduce element count

## Best Practices

1. **Development**: Enable screenshots for visual debugging
2. **CI/CD**: Disable screenshots for speed
3. **Large Pages**: Always use `excludeSelectors`
4. **Regular Audits**: Use default settings (no screenshots)
5. **Critical Pages**: Enable screenshots only when needed

## Example: Optimized Configuration

```typescript
// Fast configuration for CI/CD
const fastConfig = {
  captureScreenshots: false, // ✅ Disable screenshots
  includeElementsWithAttribute: false, // ✅ Skip elements with attributes
  excludeSelectors: [
    '.skip-audit',
    '[data-skip-test]',
    '.third-party',
    '[aria-hidden="true"]',
  ],
  minTextLength: 1, // ✅ Skip empty elements
};

// Slow but detailed configuration for development
const detailedConfig = {
  captureScreenshots: true, // ⚠️ Only for development
  includeElementsWithAttribute: true,
  excludeSelectors: ['.skip-audit'],
};
```

## Monitoring Performance

Use the `onProgress` callback to monitor audit progress:

```typescript
await auditTestAttributes(page, {
  onProgress: (progress) => {
    console.log(
      `Progress: ${progress.scanned}/${progress.total} ` +
      `(${Math.round((progress.scanned / progress.total) * 100)}%) ` +
      `Missing: ${progress.missing}`
    );
  },
});
```

This helps identify if the audit is stuck or progressing normally.

