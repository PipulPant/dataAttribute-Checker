import { Page } from 'playwright';
import type { AuditOptions, AuditResult, MissingAttributeElement } from './types';

// Re-export types for convenience
export type { AuditOptions, AuditResult, MissingAttributeElement } from './types';

/**
 * Default selectors to scan for interactive elements
 */
const DEFAULT_INCLUDE_SELECTORS = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  "[role='button']",
  'div[role]',
];

/**
 * Default attribute name to check for
 */
const DEFAULT_ATTRIBUTE_NAME = 'data-testID';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

/**
 * Colorize text for console output
 */
function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Generate XPath for an element (lazy - only when needed)
 */
async function generateXPath(element: any): Promise<string | undefined> {
  try {
    return await element.evaluate((el: any) => {
      const getXPath = (node: any): string => {
        if (!node || node.nodeType !== 1) { // ELEMENT_NODE = 1
          return '';
        }
        const element = node;
        if (element.id) {
          return `//*[@id="${element.id}"]`;
        }
        const siblings = Array.from(element.parentNode?.children || [])
          .filter((sibling: any) => sibling.tagName === element.tagName);
        if (siblings.length === 1) {
          return `${getXPath(element.parentNode)}/${element.tagName.toLowerCase()}`;
        }
        const index = siblings.indexOf(element) + 1;
        return `${getXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${index}]`;
      };
      return getXPath(element);
    });
  } catch {
    return undefined;
  }
}

/**
 * Batch fetch all element properties in a single evaluate call (#3 - Caching Element Properties)
 */
async function getElementProperties(element: any, excludeSelectors: string[]): Promise<{
  tagName: string;
  textSnippet: string;
  role: string | null;
  selector: string;
  shouldExclude: boolean;
}> {
  return await element.evaluate((el: any, excludeSelectors: string[]) => {
    const tagName = el.tagName.toLowerCase();
    const textContent = (el.textContent || '').trim();
    const textSnippet = textContent.substring(0, 100);
    const role = el.getAttribute('role');

    // Generate selector
    let selector = tagName;
    if (el.id) {
      selector = `#${el.id}`;
    } else if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(' ').filter((c: string) => c).join('.');
      if (classes) {
        selector = `${tagName}.${classes}`;
      }
    }

    // Check exclusion
    let shouldExclude = false;
    for (const excludeSelector of excludeSelectors) {
      try {
        if (el.matches(excludeSelector)) {
          shouldExclude = true;
          break;
        }
        // Check ancestors
        let current: any = el.parentElement;
        while (current) {
          try {
            if (current.matches(excludeSelector)) {
              shouldExclude = true;
              break;
            }
          } catch {
            // Invalid selector, continue
          }
          current = current.parentElement;
          if (shouldExclude) break;
        }
        if (shouldExclude) break;
      } catch {
        // Invalid selector, continue
      }
    }

    return { tagName, textSnippet, role, selector, shouldExclude };
  }, excludeSelectors);
}

/**
 * Audits a web page for missing test attributes on key interactive elements.
 * Implements multiple performance and feature enhancements.
 *
 * @param page - Playwright Page object representing the page to audit
 * @param options - Configuration options for the audit
 * @returns Promise resolving to an AuditResult object
 */
export async function auditTestAttributes(
  page: Page,
  options: AuditOptions = {}
): Promise<AuditResult> {
  const {
    attributeName = DEFAULT_ATTRIBUTE_NAME,
    includeSelectors = DEFAULT_INCLUDE_SELECTORS,
    excludeSelectors = [],
    minTextLength = 0,
    maxDepth,
    logToConsole = false,
    thresholds,
    onProgress,
  } = options;

  const pageUrl = page.url();
  const timestamp = new Date().toISOString();

  // Collect all elements matching the include selectors
  const allElementHandles: any[] = [];

  // Query elements for each include selector (#1 - Parallel Processing for queries)
  const queryPromises = includeSelectors.map(async (selector) => {
    try {
      const elements = await page.$$(selector);
      allElementHandles.push(...elements.map(el => ({ element: el, selector })));
    } catch (error) {
      if (logToConsole) {
        console.warn(colorize(`Warning: Failed to query selector "${selector}": ${error}`, 'yellow'));
      }
    }
  });

  await Promise.all(queryPromises);

  // Report progress
  if (onProgress) {
    onProgress({ scanned: 0, total: allElementHandles.length, missing: 0 });
  }

  // Batch fetch properties for all elements (#3 - Caching Element Properties)
  const elementsWithProperties = await Promise.all(
    allElementHandles.map(async ({ element, selector: originalSelector }, index) => {
      try {
        const props = await element.evaluate((el: any, excludeSelectors: string[]) => {
          const tagName = el.tagName.toLowerCase();
          const textContent = (el.textContent || '').trim();
          const textSnippet = textContent.substring(0, 100);
          const role = el.getAttribute('role');

          // Generate selector
          let selector = tagName;
          if (el.id) {
            selector = `#${el.id}`;
          } else if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter((c: string) => c).join('.');
            if (classes) {
              selector = `${tagName}.${classes}`;
            }
          }

          // Check exclusion
          let shouldExclude = false;
          for (const excludeSelector of excludeSelectors) {
            try {
              if (el.matches(excludeSelector)) {
                shouldExclude = true;
                break;
              }
              // Check ancestors
              let current: any = el.parentElement;
              while (current) {
                try {
                  if (current.matches(excludeSelector)) {
                    shouldExclude = true;
                    break;
                  }
                } catch {
                  // Invalid selector, continue
                }
                current = current.parentElement;
                if (shouldExclude) break;
              }
              if (shouldExclude) break;
            } catch {
              // Invalid selector, continue
            }
          }

          return { tagName, textSnippet, role, selector, shouldExclude };
        }, excludeSelectors);

        // Report progress
        if (onProgress && (index + 1) % 10 === 0) {
          onProgress({ scanned: index + 1, total: allElementHandles.length, missing: 0 });
        }

        return {
          element,
          ...props,
          originalSelector,
        };
      } catch (error) {
        if (logToConsole) {
          console.warn(colorize(`Warning: Failed to get properties for element: ${error}`, 'yellow'));
        }
        return null;
      }
    })
  );

  // Filter out nulls and excluded elements, apply minTextLength
  const validElements = elementsWithProperties.filter(
    (item) =>
      item &&
      !item.shouldExclude &&
      item.textSnippet.length >= minTextLength
  ) as Array<{
    element: any;
    tagName: string;
    textSnippet: string;
    role: string | null;
    selector: string;
    originalSelector: string;
  }>;

  // Check attributes in parallel (#1 - Parallel Processing)
  const attributeChecks = await Promise.all(
    validElements.map(async (item) => {
      try {
        const hasAttribute = await item.element.evaluate(
          (el: any, attr: string) => el.hasAttribute(attr),
          attributeName
        );
        return { ...item, hasAttribute };
      } catch (error) {
        if (logToConsole) {
          console.warn(colorize(`Warning: Failed to check attribute: ${error}`, 'yellow'));
        }
        return { ...item, hasAttribute: true }; // Assume has attribute on error
      }
    })
  );

  // Collect missing elements and generate XPath only for them (#4 - Lazy XPath Generation)
  const missingElements: MissingAttributeElement[] = [];
  let scannedCount = 0;

  for (const item of attributeChecks) {
    scannedCount++;
    if (onProgress && scannedCount % 10 === 0) {
      onProgress({ scanned: scannedCount, total: validElements.length, missing: missingElements.length });
    }

    if (!item.hasAttribute) {
      // Get bounding box
      let boundingBox: { x: number; y: number; width: number; height: number } | undefined;
      try {
        const box = await item.element.boundingBox();
        if (box) {
          boundingBox = {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
        }
      } catch {
        // Bounding box not available
      }

      // Generate suggested value
      const suggestedValue = await item.element.evaluate((el: any) => {
        const text = (el.textContent || '').trim().toLowerCase();
        const id = el.id;
        const className = el.className;

        if (id) {
          return id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
        }
        if (text && text.length > 0 && text.length < 50) {
          return text
            .replace(/[^a-z0-9\s-]/gi, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        }
        if (className && typeof className === 'string') {
          const classes = className.split(' ').filter(c => c && !c.includes('css-'));
          if (classes.length > 0) {
            return classes[0].replace(/[^a-z0-9-]/gi, '-').toLowerCase();
          }
        }
        return `${el.tagName.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`;
      });

      // Generate XPath only for missing elements (#4 - Lazy XPath Generation)
      const xpath = await generateXPath(item.element);

      missingElements.push({
        selector: item.selector,
        tagName: item.tagName,
        textSnippet: item.textSnippet,
        xpath,
        role: item.role,
        pageUrl,
        boundingBox,
        suggestedValue,
      });
    }
  }

  // Final progress report
  if (onProgress) {
    onProgress({ scanned: validElements.length, total: validElements.length, missing: missingElements.length });
  }

  const result: AuditResult = {
    attributeName,
    totalElementsScanned: validElements.length,
    missingAttributeCount: missingElements.length,
    elementsMissingAttribute: missingElements,
    timestamp,
    pageUrl,
  };

  // Check thresholds (#17 - Threshold-Based Warnings)
  if (thresholds) {
    const coveragePercentage = validElements.length > 0
      ? ((validElements.length - missingElements.length) / validElements.length) * 100
      : 100;
    const missingPercentage = 100 - coveragePercentage;

    if (thresholds.warningThreshold !== undefined && missingPercentage > thresholds.warningThreshold) {
      const message = colorize(
        `⚠️  Warning: ${missingPercentage.toFixed(1)}% of elements missing attributes (threshold: ${thresholds.warningThreshold}%)`,
        'yellow'
      );
      if (logToConsole) {
        console.warn(message);
      }
    }

    if (thresholds.failureThreshold !== undefined && missingPercentage > thresholds.failureThreshold) {
      const message = colorize(
        `❌ Error: ${missingPercentage.toFixed(1)}% of elements missing attributes (threshold: ${thresholds.failureThreshold}%)`,
        'red'
      );
      if (logToConsole) {
        console.error(message);
      }
      throw new Error(`Audit failed: ${missingPercentage.toFixed(1)}% missing (threshold: ${thresholds.failureThreshold}%)`);
    }
  }

  // Log summary with colors (#37 - Color-Coded Output)
  if (logToConsole) {
    console.log('\n' + colorize('=== Test Attribute Audit Summary ===', 'cyan'));
    console.log(`${colorize('Attribute:', 'dim')} ${attributeName}`);
    console.log(`${colorize('Page URL:', 'dim')} ${pageUrl}`);
    console.log(`${colorize('Total elements scanned:', 'dim')} ${result.totalElementsScanned}`);
    
    const missingColor = result.missingAttributeCount === 0 ? 'green' : 'red';
    console.log(`${colorize('Missing attribute count:', 'dim')} ${colorize(result.missingAttributeCount.toString(), missingColor)}`);
    
    if (result.missingAttributeCount > 0) {
      console.log(colorize('\nTop missing elements:', 'yellow'));
      const topN = Math.min(10, result.missingAttributeCount);
      for (let i = 0; i < topN; i++) {
        const elem = result.elementsMissingAttribute[i];
        console.log(`  ${colorize(`${i + 1}.`, 'dim')} <${colorize(elem.tagName, 'blue')}> "${elem.textSnippet}"`);
        console.log(`     ${colorize('Selector:', 'dim')} ${elem.selector}`);
        if (elem.role) {
          console.log(`     ${colorize('Role:', 'dim')} ${elem.role}`);
        }
      }
      if (result.missingAttributeCount > topN) {
        console.log(colorize(`  ... and ${result.missingAttributeCount - topN} more`, 'dim'));
      }
    } else {
      console.log(colorize('\n✓ All scanned elements have the required attribute!', 'green'));
    }
    console.log(colorize('=====================================', 'cyan') + '\n');
  }

  return result;
}

