import { chromium, Browser, Page } from 'playwright';
import { auditTestAttributes } from '../audit';
import { AuditOptions } from '../types';

describe('auditTestAttributes', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it('should find elements missing data-testID attribute', async () => {
    await page.setContent(`
      <html>
        <body>
          <button>Click me</button>
          <button data-testID="btn-submit">Submit</button>
          <a href="#">Link without attribute</a>
          <a href="#" data-testID="link-home">Home</a>
        </body>
      </html>
    `);

    const result = await auditTestAttributes(page, {
      attributeName: 'data-testID',
      includeSelectors: ['button', 'a'],
      logToConsole: false,
    });

    expect(result.attributeName).toBe('data-testID');
    expect(result.totalElementsScanned).toBe(4);
    expect(result.missingAttributeCount).toBe(2);
    expect(result.elementsMissingAttribute).toHaveLength(2);
    expect(result.elementsMissingAttribute[0].tagName).toBe('button');
    expect(result.elementsMissingAttribute[1].tagName).toBe('a');
  });

  it('should respect excludeSelectors', async () => {
    await page.setContent(`
      <html>
        <body>
          <button>Should be checked</button>
          <div class="skip">
            <button>Should be excluded</button>
          </div>
        </body>
      </html>
    `);

    const result = await auditTestAttributes(page, {
      attributeName: 'data-testID',
      includeSelectors: ['button'],
      excludeSelectors: ['.skip'],
      logToConsole: false,
    });

    // Only one button should be scanned (the one not in .skip)
    expect(result.totalElementsScanned).toBe(1);
  });

  it('should respect minTextLength', async () => {
    await page.setContent(`
      <html>
        <body>
          <button>Long text button</button>
          <button></button>
          <button>X</button>
        </body>
      </html>
    `);

    const result = await auditTestAttributes(page, {
      attributeName: 'data-testID',
      includeSelectors: ['button'],
      minTextLength: 5,
      logToConsole: false,
    });

    // Only the button with "Long text button" should be scanned
    expect(result.totalElementsScanned).toBe(1);
  });

  it('should use default selectors when not provided', async () => {
    await page.setContent(`
      <html>
        <body>
          <button>Button</button>
          <a href="#">Link</a>
          <input type="text" />
        </body>
      </html>
    `);

    const result = await auditTestAttributes(page, {
      logToConsole: false,
    });

    expect(result.totalElementsScanned).toBeGreaterThan(0);
  });

  it('should include page URL and timestamp in result', async () => {
    await page.setContent('<html><body><button>Test</button></body></html>');

    const result = await auditTestAttributes(page, {
      logToConsole: false,
    });

    expect(result.pageUrl).toBeTruthy();
    expect(result.timestamp).toBeTruthy();
    expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should handle custom attribute names', async () => {
    await page.setContent(`
      <html>
        <body>
          <button data-testid="btn1">Button 1</button>
          <button>Button 2</button>
        </body>
      </html>
    `);

    const result = await auditTestAttributes(page, {
      attributeName: 'data-testid',
      includeSelectors: ['button'],
      logToConsole: false,
    });

    expect(result.attributeName).toBe('data-testid');
    expect(result.missingAttributeCount).toBe(1);
  });
});

