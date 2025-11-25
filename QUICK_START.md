# Quick Start: Publish to GitHub & npm

## 🚀 Quick Steps

### 1. Update package.json

Edit `package.json` and replace `YOUR_USERNAME` with your GitHub username:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/playwright-attr-audit.git"
}
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `playwright-attr-audit`
3. Description: `A Playwright plugin to audit missing test attributes on web pages`
4. Choose **Public**
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**

### 3. Push to GitHub

```bash
# Commit files
git commit -m "Initial commit: Playwright attribute audit plugin"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/playwright-attr-audit.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### 4. Build & Test

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

### 5. Publish to npm (Optional)

```bash
# Login to npm
npm login

# Check if name is available
npm view playwright-attr-audit

# Publish
npm publish
```

## 📦 Using the Package

### Install from npm

```bash
npm install --save-dev playwright-attr-audit
```

### Install from GitHub

```bash
npm install --save-dev github:YOUR_USERNAME/playwright-attr-audit
```

### Use in your code

```typescript
import { auditCurrentPage } from 'playwright-attr-audit';

// With fixture
import { test } from 'playwright-attr-audit';

test('audit page', async ({ page, auditCurrentPage }) => {
  await page.goto('https://example.com');
  await auditCurrentPage('My-Report');
});
```

## 🔄 Updating the Package

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0

# Push changes
git push
git push --tags

# Publish to npm
npm publish
```

## 📝 Next Steps

- ✅ Add badges to README.md
- ✅ Create GitHub releases
- ✅ Set up GitHub Actions for CI/CD
- ✅ Add more examples

See [PUBLISHING.md](./PUBLISHING.md) for detailed instructions.

