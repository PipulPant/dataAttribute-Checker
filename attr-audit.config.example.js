/**
 * Configuration file for playwright-attr-audit
 * 
 * Copy this file to attr-audit.config.js and customize for your project.
 * The package will automatically load this file if it exists.
 */

module.exports = {
  /**
   * Custom attribute name to check for
   * Different organizations use different naming conventions:
   * - "data-testid" (common)
   * - "data-testID" (default)
   * - "data-test-id"
   * - "data-qa"
   * - "data-cy" (Cypress convention)
   * - "testid"
   * - Custom: "data-my-org-test"
   */
  attributeName: 'data-testID', // Change this to your organization's standard

  /**
   * Selectors to scan for interactive elements
   * Add or remove selectors based on your application's needs
   */
  includeSelectors: [
    'button',
    'a',
    'input',
    'select',
    'textarea',
    "[role='button']",
    'div[role]',
    // Add custom selectors for your app:
    // '[data-component="interactive"]',
    // '.clickable',
  ],

  /**
   * Selectors to exclude from scanning
   * Elements matching these selectors will be skipped
   */
  excludeSelectors: [
    // Add selectors for elements that don't need test attributes:
    // '.skip-audit',
    // '[data-skip-test]',
    // '.third-party-widget',
  ],

  /**
   * Minimum text length for elements to be considered
   * Elements with shorter text will be ignored (default: 0)
   */
  minTextLength: 0,

  /**
   * Whether to capture screenshots of missing elements
   * Screenshots are embedded in the HTML report (default: false)
   * Note: Enabling this will increase report generation time
   */
  captureScreenshots: false, // Set to true to enable screenshots

  /**
   * Whether to log summary to console (default: false)
   */
  logToConsole: false,

  /**
   * Thresholds for warnings and failures
   * Set percentage thresholds to trigger warnings or failures
   */
  thresholds: {
    /**
     * Warning threshold - log warning if missing count exceeds this percentage (0-100)
     * Example: 10 means warn if more than 10% of elements are missing attributes
     */
    warningThreshold: 0, // Set to 10 for 10% threshold

    /**
     * Failure threshold - throw error if missing count exceeds this percentage (0-100)
     * Example: 50 means fail if more than 50% of elements are missing attributes
     */
    failureThreshold: 0, // Set to 50 for 50% threshold
  },
};
