import { AuditResult, MissingAttributeElement, HasAttributeElement } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates an HTML report from audit results
 */
export function generateHTMLReport(result: AuditResult, outputPath: string): void {
  const html = generateHTMLContent(result, outputPath);
  fs.writeFileSync(outputPath, html, 'utf-8');
}

/**
 * Generates HTML content for the report
 */
function generateHTMLContent(result: AuditResult, outputPath?: string): string {
  const groupedByTag = groupElementsByTag(result.elementsMissingAttribute);
  const coveragePercentage = result.totalElementsScanned > 0
    ? Math.round(((result.totalElementsScanned - result.missingAttributeCount) / result.totalElementsScanned) * 100)
    : 100;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Attribute Audit Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    
    header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    header .meta {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9f9f9;
      border-bottom: 1px solid #eee;
    }
    
    .stat-card {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .stat-card .value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-card .label {
      color: #666;
      font-size: 14px;
    }
    
    .stat-card.success .value {
      color: #10b981;
    }
    
    .stat-card.warning .value {
      color: #f59e0b;
    }
    
    .stat-card.error .value {
      color: #ef4444;
    }
    
    .coverage-bar {
      width: 100%;
      height: 30px;
      background: #e5e7eb;
      border-radius: 15px;
      overflow: hidden;
      margin-top: 10px;
    }
    
    .coverage-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    
    .content {
      padding: 30px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 22px;
      margin-bottom: 20px;
      color: #1f2937;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .group {
      margin-bottom: 30px;
    }
    
    .group-header {
      background: #f3f4f6;
      padding: 15px 20px;
      border-radius: 6px 6px 0 0;
      font-weight: bold;
      color: #374151;
      border-left: 4px solid #667eea;
    }
    
    .element-list {
      background: white;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 6px 6px;
    }
    
    .element-item {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      transition: background 0.2s;
    }
    
    .element-item:hover {
      background: #f9fafb;
    }
    
    .element-item:last-child {
      border-bottom: none;
    }
    
    .element-screenshot {
      margin-top: 15px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      max-width: 500px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      background: #f9fafb;
    }
    
    .element-screenshot img {
      width: 100%;
      height: auto;
      display: block;
      max-height: 300px;
      object-fit: contain;
    }
    
    .element-screenshot-label {
      background: #667eea;
      color: white;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .screenshot-placeholder {
      padding: 40px;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      background: #f3f4f6;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
    }
    
    .filter-controls {
      background: #f9fafb;
      padding: 20px 30px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      gap: 15px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .filter-toggle {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: 0.3s;
      border-radius: 24px;
    }
    
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
    
    input:checked + .toggle-slider {
      background-color: #667eea;
    }
    
    input:checked + .toggle-slider:before {
      transform: translateX(26px);
    }
    
    .filter-label {
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }
    
    .filter-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    
    .filter-badge.missing {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .filter-badge.has-attr {
      background: #d1fae5;
      color: #065f46;
    }
    
    .element-item.has-attribute {
      border-left: 4px solid #10b981;
    }
    
    .element-item.missing-attribute {
      border-left: 4px solid #ef4444;
    }
    
    .attribute-value {
      background: #d1fae5;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      color: #065f46;
      display: inline-block;
      margin-top: 5px;
      font-weight: 600;
    }
    
    .hidden {
      display: none !important;
    }
    
    .element-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .tag-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #667eea;
      color: white;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .element-text {
      flex: 1;
      font-weight: 500;
      color: #1f2937;
    }
    
    .element-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
      font-size: 14px;
    }
    
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .detail-label {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .detail-value {
      color: #1f2937;
      word-break: break-all;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
    
    .url-link {
      color: #667eea;
      text-decoration: none;
      word-break: break-all;
    }
    
    .url-link:hover {
      text-decoration: underline;
    }
    
    .suggested-value {
      background: #fef3c7;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      color: #92400e;
      display: inline-block;
      margin-top: 5px;
    }
    
    .instructions {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin-top: 30px;
      border-radius: 6px;
    }
    
    .instructions h3 {
      color: #1e40af;
      margin-bottom: 15px;
      font-size: 18px;
    }
    
    .instructions ol {
      margin-left: 20px;
      color: #1e3a8a;
    }
    
    .instructions li {
      margin-bottom: 10px;
    }
    
    .instructions code {
      background: #dbeafe;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }
    
    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    
    .empty-state h3 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #1f2937;
    }
    
    @media (max-width: 768px) {
      .stats {
        grid-template-columns: 1fr;
      }
      
      .element-details {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 Test Attribute Audit Report</h1>
      <div class="meta">
        <div>Page: <strong>${escapeHtml(result.pageUrl)}</strong></div>
        <div>Audited: <strong>${new Date(result.timestamp).toLocaleString()}</strong></div>
        <div>Attribute: <strong>${escapeHtml(result.attributeName)}</strong></div>
      </div>
    </header>
    
    <div class="stats">
      <div class="stat-card ${result.missingAttributeCount === 0 ? 'success' : 'error'}">
        <div class="value">${result.missingAttributeCount}</div>
        <div class="label">Missing Attributes</div>
      </div>
      <div class="stat-card">
        <div class="value">${result.totalElementsScanned}</div>
        <div class="label">Elements Scanned</div>
      </div>
      <div class="stat-card ${coveragePercentage >= 90 ? 'success' : coveragePercentage >= 70 ? 'warning' : 'error'}">
        <div class="value">${coveragePercentage}%</div>
        <div class="label">Coverage</div>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${coveragePercentage}%">${coveragePercentage}%</div>
        </div>
      </div>
    </div>
    
    ${result.elementsWithAttribute && result.elementsWithAttribute.length > 0 ? generateFilterControls() : ''}
    
    <div class="content">
      ${result.missingAttributeCount === 0 && (!result.elementsWithAttribute || result.elementsWithAttribute.length === 0) 
        ? generateEmptyState() 
        : (result.elementsWithAttribute && result.elementsWithAttribute.length > 0 
          ? generateAllElementsSection(groupedByTag, result)
          : generateMissingElementsSection(groupedByTag, result))}
      
      <div class="instructions">
        <h3>📖 How to View This Report</h3>
        <ol>
          <li><strong>Open the HTML file:</strong> Double-click the report file (<code>${path.basename(outputPath || 'report.html')}</code>) to open it in your default web browser.</li>
          <li><strong>View missing elements:</strong> Scroll through the report to see all elements missing the <code>${escapeHtml(result.attributeName)}</code> attribute.</li>
          <li><strong>Click URLs:</strong> Click on any page URL to navigate directly to that page in your browser.</li>
          <li><strong>Use suggested values:</strong> Each element includes a suggested test attribute value you can use.</li>
          <li><strong>Filter by tag:</strong> Elements are grouped by tag type for easier navigation.</li>
        </ol>
        <p style="margin-top: 15px; color: #1e3a8a;">
          <strong>Tip:</strong> You can also open this file programmatically using: <code>open report.html</code> (macOS) or <code>start report.html</code> (Windows)
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateEmptyState(): string {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">✅</div>
      <h3>All Good!</h3>
      <p>All scanned elements have the required test attribute. Great job! 🎉</p>
    </div>
  `;
}

function generateFilterControls(): string {
  return `
    <div class="filter-controls">
      <div class="filter-toggle">
        <span class="filter-label">Show:</span>
        <label class="toggle-switch">
          <input type="checkbox" id="toggleMissing" checked>
          <span class="toggle-slider"></span>
        </label>
        <span class="filter-label">Missing Attributes</span>
        <span class="filter-badge missing" id="missingCount">0</span>
      </div>
      <div class="filter-toggle">
        <label class="toggle-switch">
          <input type="checkbox" id="toggleHasAttribute" checked>
          <span class="toggle-slider"></span>
        </label>
        <span class="filter-label">Has Attributes</span>
        <span class="filter-badge has-attr" id="hasAttributeCount">0</span>
      </div>
    </div>
  `;
}

function generateAllElementsSection(
  groupedByTag: Map<string, MissingAttributeElement[]>,
  result: AuditResult
): string {
  const groupedWithAttribute = result.elementsWithAttribute 
    ? groupElementsByTag(result.elementsWithAttribute as any[])
    : new Map();
  
  let html = '<div class="section"><h2>All Elements</h2>';
  
  // Missing elements section
  if (result.missingAttributeCount > 0) {
    html += '<div class="group" id="missing-section">';
    html += '<div class="group-header" style="background: #fee2e2; color: #991b1b;">';
    html += `❌ Missing ${escapeHtml(result.attributeName)} (${result.missingAttributeCount} ${result.missingAttributeCount === 1 ? 'element' : 'elements'})`;
    html += '</div><div class="element-list">';
    
    for (const [tagName, elements] of groupedByTag.entries()) {
      html += `<div class="group" style="margin-top: 15px;">`;
      html += `<div class="group-header" style="font-size: 14px;">${escapeHtml(tagName)} (${elements.length})</div>`;
      html += '<div class="element-list">';
      
      for (const element of elements) {
        html += generateElementCard(element, result.attributeName, 'missing');
      }
      
      html += '</div></div>';
    }
    
    html += '</div></div>';
  }
  
  // Elements with attribute section
  if (result.elementsWithAttribute && result.elementsWithAttribute.length > 0) {
    html += '<div class="group" id="has-attribute-section" style="margin-top: 30px;">';
    html += '<div class="group-header" style="background: #d1fae5; color: #065f46;">';
    html += `✅ Has ${escapeHtml(result.attributeName)} (${result.hasAttributeCount || 0} ${(result.hasAttributeCount || 0) === 1 ? 'element' : 'elements'})`;
    html += '</div><div class="element-list">';
    
    for (const [tagName, elements] of groupedWithAttribute.entries()) {
      html += `<div class="group" style="margin-top: 15px;">`;
      html += `<div class="group-header" style="font-size: 14px;">${escapeHtml(tagName)} (${elements.length})</div>`;
      html += '<div class="element-list">';
      
      for (const element of elements) {
        html += generateElementCardWithAttribute(element as HasAttributeElement, result.attributeName);
      }
      
      html += '</div></div>';
    }
    
    html += '</div></div>';
  }
  
  html += '</div>';
  return html;
}

function generateMissingElementsSection(
  groupedByTag: Map<string, MissingAttributeElement[]>,
  result: AuditResult
): string {
  let html = '<div class="section"><h2>Missing Test Attributes</h2>';
  
  for (const [tagName, elements] of groupedByTag.entries()) {
    html += `
      <div class="group">
        <div class="group-header">
          ${escapeHtml(tagName)} (${elements.length} ${elements.length === 1 ? 'element' : 'elements'})
        </div>
        <div class="element-list">
    `;
    
    for (const element of elements) {
      html += generateElementCard(element, result.attributeName);
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

function generateElementCardWithAttribute(element: HasAttributeElement, attributeName: string): string {
  return `
    <div class="element-item has-attribute" data-type="has-attribute">
      <div class="element-header">
        <span class="tag-badge" style="background: #10b981;">${escapeHtml(element.tagName)}</span>
        <span class="element-text">${escapeHtml(element.textSnippet || '(no text)')}</span>
      </div>
      <div class="element-details">
        <div class="detail-item">
          <span class="detail-label">Page URL</span>
          <a href="${escapeHtml(element.pageUrl)}" target="_blank" class="url-link">${escapeHtml(element.pageUrl)}</a>
        </div>
        <div class="detail-item">
          <span class="detail-label">Selector</span>
          <span class="detail-value">${escapeHtml(element.selector)}</span>
        </div>
        ${element.xpath ? `
        <div class="detail-item">
          <span class="detail-label">XPath</span>
          <span class="detail-value">${escapeHtml(element.xpath)}</span>
        </div>
        ` : ''}
        ${element.role ? `
        <div class="detail-item">
          <span class="detail-label">Role</span>
          <span class="detail-value">${escapeHtml(element.role)}</span>
        </div>
        ` : ''}
        ${element.boundingBox ? `
        <div class="detail-item">
          <span class="detail-label">Position</span>
          <span class="detail-value">x: ${element.boundingBox.x}, y: ${element.boundingBox.y}</span>
        </div>
        ` : ''}
      </div>
      <div style="margin-top: 15px;">
        <span class="detail-label">${escapeHtml(attributeName)} value:</span>
        <div class="attribute-value">${escapeHtml(element.attributeValue)}</div>
      </div>
      <div class="element-screenshot" style="margin-top: 15px;">
        <div class="element-screenshot-label">📸 Element Screenshot</div>
        ${element.screenshot ? `
        <img src="data:image/png;base64,${element.screenshot}" alt="Screenshot of ${escapeHtml(element.tagName)} element: ${escapeHtml(element.textSnippet || 'no text')}" />
        ` : `
        <div class="screenshot-placeholder">
          Screenshot not available. Enable <code>captureScreenshots: true</code> in audit options.
        </div>
        `}
      </div>
    </div>
  `;
}

function generateElementCard(element: MissingAttributeElement, attributeName: string, type: 'missing' | 'has-attribute' = 'missing'): string {
  return `
    <div class="element-item ${type}-attribute" data-type="${type}">
      <div class="element-header">
        <span class="tag-badge" style="${type === 'missing' ? 'background: #ef4444;' : ''}">${escapeHtml(element.tagName)}</span>
        <span class="element-text">${escapeHtml(element.textSnippet || '(no text)')}</span>
      </div>
      <div class="element-details">
        <div class="detail-item">
          <span class="detail-label">Page URL</span>
          <a href="${escapeHtml(element.pageUrl)}" target="_blank" class="url-link">${escapeHtml(element.pageUrl)}</a>
        </div>
        <div class="detail-item">
          <span class="detail-label">Selector</span>
          <span class="detail-value">${escapeHtml(element.selector)}</span>
        </div>
        ${element.xpath ? `
        <div class="detail-item">
          <span class="detail-label">XPath</span>
          <span class="detail-value">${escapeHtml(element.xpath)}</span>
        </div>
        ` : ''}
        ${element.role ? `
        <div class="detail-item">
          <span class="detail-label">Role</span>
          <span class="detail-value">${escapeHtml(element.role)}</span>
        </div>
        ` : ''}
        ${element.boundingBox ? `
        <div class="detail-item">
          <span class="detail-label">Position</span>
          <span class="detail-value">x: ${element.boundingBox.x}, y: ${element.boundingBox.y}</span>
        </div>
        ` : ''}
      </div>
      ${element.suggestedValue ? `
      <div style="margin-top: 15px;">
        <span class="detail-label">Suggested ${escapeHtml(attributeName)} value:</span>
        <div class="suggested-value">${escapeHtml(element.suggestedValue)}</div>
      </div>
      ` : ''}
      <div class="element-screenshot" style="margin-top: 15px;">
        <div class="element-screenshot-label">📸 Element Screenshot</div>
        ${element.screenshot ? `
        <img src="data:image/png;base64,${element.screenshot}" alt="Screenshot of ${escapeHtml(element.tagName)} element: ${escapeHtml(element.textSnippet || 'no text')}" />
        ` : `
        <div class="screenshot-placeholder">
          Screenshot not available. Enable <code>captureScreenshots: true</code> in audit options.
        </div>
        `}
      </div>
    </div>
  `;
}

function groupElementsByTag(elements: MissingAttributeElement[]): Map<string, MissingAttributeElement[]> {
  const grouped = new Map<string, MissingAttributeElement[]>();
  
  for (const element of elements) {
    const tag = element.tagName;
    if (!grouped.has(tag)) {
      grouped.set(tag, []);
    }
    grouped.get(tag)!.push(element);
  }
  
  return grouped;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}


