# Publishing Guide

This guide will help you publish `playwright-attr-audit` to GitHub and npm.

## Step 1: Prepare the Package

### 1.1 Update package.json with your GitHub username

Edit `package.json` and replace `YOUR_USERNAME` with your actual GitHub username:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/playwright-attr-audit.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/playwright-attr-audit/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/playwright-attr-audit#readme"
}
```

### 1.2 Add author information (optional)

```json
{
  "author": "Your Name <your.email@example.com>"
}
```

## Step 2: Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Playwright attribute audit plugin"
```

## Step 3: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `playwright-attr-audit`
4. Description: `A Playwright plugin to audit missing test attributes on web pages`
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

## Step 4: Push to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/playwright-attr-audit.git

# Rename main branch if needed
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 5: Build the Package

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify dist/ folder was created
ls dist/
```

## Step 6: Publish to npm (Optional)

### 6.1 Create npm Account

If you don't have an npm account:
1. Go to [npmjs.com](https://www.npmjs.com/signup)
2. Create an account

### 6.2 Login to npm

```bash
npm login
```

Enter your npm username, password, and email.

### 6.3 Check Package Name Availability

```bash
npm view playwright-attr-audit
```

If it says "404 Not Found", the name is available. If it's taken, you'll need to change the name in `package.json`.

### 6.4 Publish

```bash
# Dry run (test without publishing)
npm publish --dry-run

# Publish to npm
npm publish
```

**Note:** The first time you publish, npm will ask you to verify your email.

### 6.5 Update Version for Future Releases

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Then publish
npm publish
```

## Step 7: Using the Package

### Option A: Install from npm (Recommended)

```bash
npm install --save-dev playwright-attr-audit
```

Then use it:

```typescript
import { auditCurrentPage } from 'playwright-attr-audit';

// Your code here
```

### Option B: Install from GitHub

```bash
npm install --save-dev github:YOUR_USERNAME/playwright-attr-audit
```

Or with specific branch/tag:

```bash
npm install --save-dev github:YOUR_USERNAME/playwright-attr-audit#main
```

### Option C: Install Locally (Development)

```bash
# In your project directory
npm install --save-dev /path/to/playwright-attr-audit
```

## Step 8: Add GitHub Actions (Optional)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm test
```

## Step 9: Add License File

Create `LICENSE` file (MIT License example):

```
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Troubleshooting

### Package name already taken

If `playwright-attr-audit` is taken on npm, change the name in `package.json`:

```json
{
  "name": "@your-username/playwright-attr-audit"
}
```

### Build fails

Make sure TypeScript is installed:
```bash
npm install --save-dev typescript
npm run build
```

### Git push fails

Make sure you've set up SSH keys or use HTTPS with personal access token:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/playwright-attr-audit.git
```

## Next Steps

1. ✅ Push to GitHub
2. ✅ Publish to npm (optional)
3. ✅ Add badges to README.md
4. ✅ Create releases/tags
5. ✅ Add GitHub Actions for CI/CD
6. ✅ Write documentation
7. ✅ Add examples

## Quick Commands Summary

```bash
# Initialize and push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/playwright-attr-audit.git
git push -u origin main

# Build and publish to npm
npm run build
npm login
npm publish
```

