import { Page } from 'playwright';
import type { AuditOptions, AuditResult, MissingAttributeElement } from './types';
import { getAttributeName } from './config-reader';

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
  // Get attribute name with priority: Playwright config > options > default regex
  const attributeNameOrPattern = getAttributeName(options);
  const attributeName = typeof attributeNameOrPattern === 'string' 
    ? attributeNameOrPattern 
    : DEFAULT_ATTRIBUTE_NAME; // Fallback for regex pattern display
  
  const {
    includeSelectors = DEFAULT_INCLUDE_SELECTORS,
    excludeSelectors = [],
    minTextLength = 0,
    maxDepth,
    logToConsole = false,
    thresholds,
    onProgress,
    captureScreenshots = false,
    includeElementsWithAttribute = false,
  } = options;

  // Performance warning for screenshots
  if (captureScreenshots && logToConsole) {
    console.warn(colorize(
      '⚠️  Performance Warning: Screenshots are enabled. This will significantly slow down the audit.',
      'yellow'
    ));
  }

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
  // Support both string attribute name and regex pattern
  const attributeChecks = await Promise.all(
    validElements.map(async (item) => {
      try {
        let hasAttribute = false;
        
        if (typeof attributeNameOrPattern === 'string') {
          // String attribute name - check exact match
          hasAttribute = await item.element.evaluate(
            (el: any, attr: string) => el.hasAttribute(attr),
            attributeNameOrPattern
          );
        } else {
          // Regex pattern - check all attributes and match pattern
          hasAttribute = await item.element.evaluate(
            (el: any, pattern: RegExp) => {
              const attrs = el.getAttributeNames();
              return attrs.some((attr: string) => pattern.test(attr));
            },
            attributeNameOrPattern
          );
        }
        
        return { ...item, hasAttribute };
      } catch (error) {
        if (logToConsole) {
          console.warn(colorize(`Warning: Failed to check attribute: ${error}`, 'yellow'));
        }
        return { ...item, hasAttribute: true }; // Assume has attribute on error
      }
    })
  );

  // Collect missing elements and elements with attributes (#4 - Lazy XPath Generation)
  // PERFORMANCE OPTIMIZATION: Process elements in parallel batches instead of sequentially
  const missingElements: MissingAttributeElement[] = [];
  const hasAttributeElements: any[] = [];
  
  // Separate elements by type for parallel processing
  const elementsWithAttribute = attributeChecks.filter(item => item.hasAttribute && includeElementsWithAttribute);
  const elementsMissingAttribute = attributeChecks.filter(item => !item.hasAttribute);

  // Process elements with attributes in parallel batches
  if (elementsWithAttribute.length > 0) {
    const batchSize = 50; // Process 50 elements at a time
    for (let i = 0; i < elementsWithAttribute.length; i += batchSize) {
      const batch = elementsWithAttribute.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            // Parallelize bounding box and attribute value
            // Note: XPath generation is skipped for elements with attributes to improve performance
            const [box, attributeValue] = await Promise.all([
              item.element.boundingBox().catch(() => null),
              item.element.evaluate(
                (el: any, attr: string) => el.getAttribute(attr),
                attributeName
              ).catch(() => null),
            ]);
            const xpath = undefined; // Skip XPath for elements with attributes for better performance

            let boundingBox: { x: number; y: number; width: number; height: number } | undefined;
            if (box) {
              boundingBox = {
                x: Math.round(box.x),
                y: Math.round(box.y),
                width: Math.round(box.width),
                height: Math.round(box.height),
              };
            }

            // Capture screenshot if enabled (only for elements with attributes)
            let screenshot: string | undefined;
            if (captureScreenshots) {
              try {
                const screenshotBuffer = await item.element.screenshot({
                  type: 'png',
                  timeout: 2000, // Reduced timeout from 10s to 2s for better performance
                }).catch(() => null);
                
                if (screenshotBuffer && screenshotBuffer.length > 0) {
                  screenshot = screenshotBuffer.toString('base64');
                }
              } catch {
                // Screenshot capture failed, continue without it
              }
            }

            if (attributeValue) {
              return {
                selector: item.selector,
                tagName: item.tagName,
                textSnippet: item.textSnippet,
                attributeValue,
                xpath,
                role: item.role,
                pageUrl,
                boundingBox,
                screenshot,
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      hasAttributeElements.push(...batchResults.filter(r => r !== null));
      
      // Report progress
      if (onProgress) {
        onProgress({ 
          scanned: Math.min(i + batchSize, elementsWithAttribute.length), 
          total: validElements.length, 
          missing: missingElements.length 
        });
      }
    }
  }

  // Process missing elements in parallel batches
  if (elementsMissingAttribute.length > 0) {
    const batchSize = 50; // Process 50 elements at a time
    for (let i = 0; i < elementsMissingAttribute.length; i += batchSize) {
      const batch = elementsMissingAttribute.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            // Parallelize bounding box and suggested value generation
            // XPath is generated separately to avoid blocking
            const [box, suggestedValue] = await Promise.all([
              item.element.boundingBox().catch(() => null),
              item.element.evaluate((el: any) => {
                // Helper function to convert to kebab-case
                const toKebabCase = (str: string): string => {
                  return str
                    .replace(/([A-Z])/g, '-$1')
                    .replace(/[^a-z0-9\s-]/gi, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .toLowerCase();
                };

                // Helper function to get visible text (excludes hidden elements and scripts)
                const getVisibleText = (element: any): string => {
                  const clone = element.cloneNode(true);
                  // Remove script and style elements
                  const scripts = clone.querySelectorAll('script, style');
                  scripts.forEach((s: any) => s.remove());
                  
                  // Get text content and clean it
                  let text = (clone.textContent || '').trim();
                  
                  // If text is too long or contains too many newlines, try to get first meaningful line
                  if (text.length > 100) {
                    const lines = text.split(/\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                    if (lines.length > 0) {
                      text = lines[0];
                    }
                  }
                  
                  return text;
                };

                const id = el.id;
                const name = el.name;
                const placeholder = el.placeholder;
                const className = el.className;
                const ariaLabel = el.getAttribute('aria-label');
                
                // Priority 1: Use ID if available (convert to kebab-case)
                if (id) {
                  return toKebabCase(id);
                }

                // Priority 2: Use aria-label if available
                if (ariaLabel) {
                  return toKebabCase(ariaLabel);
                }

                // Priority 3: Check parent element's aria-label (one level up)
                let parent = el.parentElement;
                if (parent) {
                  const parentAriaLabel = parent.getAttribute('aria-label');
                  if (parentAriaLabel) {
                    return toKebabCase(parentAriaLabel);
                  }
                }

                // Priority 4: Use name attribute if available
                if (name) {
                  return toKebabCase(name);
                }

                // Priority 5: Use visible text content (better extraction from nested elements)
                const visibleText = getVisibleText(el);
                if (visibleText && visibleText.length > 0 && visibleText.length < 50) {
                  return toKebabCase(visibleText);
                }

                // Priority 6: Use placeholder if available
                if (placeholder) {
                  return toKebabCase(placeholder);
                }

                // Priority 7: Use className (first meaningful class)
                if (className && typeof className === 'string') {
                  const classes = className.split(' ').filter(c => c && !c.includes('css-') && !c.startsWith('Mui'));
                  if (classes.length > 0) {
                    return toKebabCase(classes[0]);
                  }
                }

                // Fallback: Use tag name with random suffix
                return `${el.tagName.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`;
              }).catch(() => undefined),
            ]);
            
            // Generate XPath separately (non-blocking, can be slow for deep DOM trees)
            const xpath = await generateXPath(item.element).catch(() => undefined);

            let boundingBox: { x: number; y: number; width: number; height: number } | undefined;
            if (box) {
              boundingBox = {
                x: Math.round(box.x),
                y: Math.round(box.y),
                width: Math.round(box.width),
                height: Math.round(box.height),
              };
            }

            // Capture screenshot if enabled (only for missing elements)
            let screenshot: string | undefined;
            if (captureScreenshots) {
              try {
                const screenshotBuffer = await item.element.screenshot({
                  type: 'png',
                  timeout: 2000, // Reduced timeout from 10s to 2s for better performance
                }).catch(() => null);
                
                if (screenshotBuffer && screenshotBuffer.length > 0) {
                  screenshot = screenshotBuffer.toString('base64');
                }
              } catch {
                // Screenshot capture failed, continue without it
              }
            }

            return {
              selector: item.selector,
              tagName: item.tagName,
              textSnippet: item.textSnippet,
              xpath,
              role: item.role,
              pageUrl,
              boundingBox,
              suggestedValue,
              screenshot,
            };
          } catch {
            return null;
          }
        })
      );

      missingElements.push(...batchResults.filter(r => r !== null));
      
      // Report progress
      if (onProgress) {
        onProgress({ 
          scanned: validElements.length, 
          total: validElements.length, 
          missing: missingElements.length 
        });
      }
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
    hasAttributeCount: includeElementsWithAttribute ? hasAttributeElements.length : undefined,
    elementsMissingAttribute: missingElements,
    elementsWithAttribute: includeElementsWithAttribute ? hasAttributeElements : undefined,
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

