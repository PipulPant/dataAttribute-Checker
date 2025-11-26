#!/usr/bin/env node

// This file is a wrapper that calls the CLI main function
// It's compiled to dist/bin/playwright-attr-audit.js
// The CLI command name is 'playwright-testid-scanner'

// Import and execute the CLI main function
require('../cli/index');

