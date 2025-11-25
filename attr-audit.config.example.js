/**
 * Example configuration file for playwright-attr-audit
 * 
 * Copy this file to attr-audit.config.js and customize as needed.
 * CLI flags will override values from this config file.
 */

module.exports = {
  // Attribute name to check for (default: "data-testID")
  attributeName: 'data-testID',

  // Selectors to scan for elements
  includeSelectors: [
    'button',
    'a',
    'input',
    'select',
    'textarea',
    "[role='button']",
    'div[role]',
  ],

  // Selectors to exclude from scanning
  // Elements matching these selectors or their descendants will be skipped
  excludeSelectors: [
    '.ignore-for-test',
    '[data-skip-audit]',
    '.skip-audit',
  ],

  // Minimum text length for elements to be considered
  // Elements with shorter text will be ignored
  minTextLength: 0,

  // Whether to log summary to console (CLI always logs)
  logToConsole: false,
};

