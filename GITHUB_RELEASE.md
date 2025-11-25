# GitHub Release Guide

## Current Status

✅ Code committed locally  
✅ Release tag `v1.0.0` created locally  
⏳ Need to push to GitHub

## Push to GitHub

### Option 1: Using Personal Access Token

```bash
# Push main branch
git push https://YOUR_TOKEN@github.com/PipulPant/dataAttribute-Checker.git main

# Push release tag
git push https://YOUR_TOKEN@github.com/PipulPant/dataAttribute-Checker.git v1.0.0
```

### Option 2: Update Remote URL

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/PipulPant/dataAttribute-Checker.git
git push origin main
git push origin v1.0.0
```

### Option 3: Use GitHub CLI

```bash
gh auth login
git push origin main
git push origin v1.0.0
```

## Create GitHub Release

### Via GitHub Website (Recommended)

1. Go to: https://github.com/PipulPant/dataAttribute-Checker/releases/new
2. **Tag**: Select `v1.0.0` (should auto-select)
3. **Release title**: `v1.0.0 - Initial Release`
4. **Description**:

```markdown
## 🎉 Initial Release

Initial release of `playwright-attr-audit` - A comprehensive Playwright plugin to audit missing test attributes on web pages.

### ✨ Features

- ✅ Full Playwright attribute audit functionality
- ✅ HTML and JSON report generation
- ✅ Multi-page audit tracking with `PageAuditor`
- ✅ Playwright fixture support (no need to pass `page` parameter)
- ✅ CLI tool with progress indicators
- ✅ Auto-generates HTML reports with `auditCurrentPage()`
- ✅ Comprehensive test suite (11/11 tests passing)
- ✅ TypeScript-first with full type definitions

### 📦 Installation

**From npm:**
```bash
npm install --save-dev playwright-attr-audit
```

**From GitHub:**
```bash
npm install --save-dev github:PipulPant/dataAttribute-Checker#v1.0.0
```

### 🚀 Quick Start

**With Playwright Fixture:**
```typescript
import { test } from 'playwright-attr-audit';

test('audit page', async ({ page, auditCurrentPage }) => {
  await page.goto('https://example.com');
  await auditCurrentPage('My-Report'); // Auto-generates HTML report!
});
```

**Without Fixture:**
```typescript
import { auditCurrentPage } from 'playwright-attr-audit';

await auditCurrentPage(page, 'My-Report');
```

### 📚 Documentation

- [README.md](./README.md) - Full documentation
- [Examples](./examples/) - Usage examples
- [npm Package](https://www.npmjs.com/package/playwright-attr-audit)

### 🔗 Links

- **npm**: https://www.npmjs.com/package/playwright-attr-audit
- **GitHub**: https://github.com/PipulPant/dataAttribute-Checker
- **Issues**: https://github.com/PipulPant/dataAttribute-Checker/issues
```

5. Click **"Publish release"**

### Via GitHub CLI

```bash
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes-file GITHUB_RELEASE.md
```

## After Release

Your package will be available at:
- **GitHub Release**: https://github.com/PipulPant/dataAttribute-Checker/releases/tag/v1.0.0
- **npm**: https://www.npmjs.com/package/playwright-attr-audit

Users can install with:
```bash
npm install --save-dev github:PipulPant/dataAttribute-Checker#v1.0.0
```

