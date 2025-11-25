import { Page } from 'playwright';

/**
 * Configuration options for the test attribute audit
 */
export interface AuditOptions {
  /**
   * The attribute name to check for (default: "data-testID")
   */
  attributeName?: string;

  /**
   * Selectors to scan for elements (defaults to common interactive elements)
   */
  includeSelectors?: string[];

  /**
   * Selectors to exclude from scanning
   */
  excludeSelectors?: string[];

  /**
   * Minimum text length for elements to be considered (default: 0)
   * Elements with shorter text will be ignored
   */
  minTextLength?: number;

  /**
   * Maximum depth for DOM traversal (optional)
   */
  maxDepth?: number;

  /**
   * Whether to log summary to console (default: false)
   */
  logToConsole?: boolean;

  /**
   * Thresholds for warnings and failures
   */
  thresholds?: {
    /**
     * Warning threshold - log warning if missing count exceeds this percentage (0-100)
     */
    warningThreshold?: number;
    /**
     * Failure threshold - throw error if missing count exceeds this percentage (0-100)
     */
    failureThreshold?: number;
  };

  /**
   * Progress callback for reporting audit progress
   */
  onProgress?: (progress: {
    scanned: number;
    total: number;
    missing: number;
  }) => void;
}

/**
 * Information about an element missing the required test attribute
 */
export interface MissingAttributeElement {
  /**
   * CSS selector for the element
   */
  selector: string;

  /**
   * HTML tag name (e.g., "button", "a", "div")
   */
  tagName: string;

  /**
   * Snippet of text content (first 100 chars)
   */
  textSnippet: string;

  /**
   * XPath of the element (if available)
   */
  xpath?: string;

  /**
   * ARIA role attribute value (if present)
   */
  role?: string | null;

  /**
   * URL of the page where this element was found
   */
  pageUrl: string;

  /**
   * Element's bounding box position (for visual highlighting)
   */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Suggested test attribute value based on element context
   */
  suggestedValue?: string;
}

/**
 * Result of the test attribute audit
 */
export interface AuditResult {
  /**
   * The attribute name that was audited
   */
  attributeName: string;

  /**
   * Total number of elements scanned
   */
  totalElementsScanned: number;

  /**
   * Number of elements missing the required attribute
   */
  missingAttributeCount: number;

  /**
   * Array of elements missing the required attribute
   */
  elementsMissingAttribute: MissingAttributeElement[];

  /**
   * Timestamp when the audit was performed (ISO 8601)
   */
  timestamp: string;

  /**
   * URL of the page that was audited
   */
  pageUrl: string;
}

/**
 * Configuration object that can be exported from a config file
 */
export interface AuditConfig extends AuditOptions {
  // Same as AuditOptions, but can be used for config files
}

